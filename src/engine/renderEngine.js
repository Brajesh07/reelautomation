import { formatDate } from '../utils/dateFormatter';
import { renderSign } from './renderSign';

/**
 * Worker-backed render engine.
 *
 * `renderTask()` is the single entry point the queue uses. It hands the whole
 * task (one sign or a whole group reel) to `renderWorker.js`, which owns its
 * own OffscreenCanvas, fonts, images and FFmpeg instance. If the browser (or
 * the worker bundle) cannot run it, the call transparently falls back to the
 * main-thread `renderSign()` loop so rendering never becomes impossible.
 */

const WORKER_SUPPORTED =
  typeof window !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined';

/** @type {Worker|null} */
let worker = null;
/** Set when the worker crashes or cannot be constructed — disables it for the session */
let workerFailed = false;
let nextTaskId = 0;

/** @type {Map<number, { resolve: Function, reject: Function, onProgress: Function }>} */
const pending = new Map();

export function isWorkerEngineAvailable() {
  return WORKER_SUPPORTED && !workerFailed;
}

/** Read the typography overrides saved by the Design Preview page. */
function readFontConfig() {
  try {
    const saved = localStorage.getItem('fontConfig');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function rejectAllPending(reason) {
  for (const entry of pending.values()) entry.reject(reason);
  pending.clear();
}

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL('./renderWorker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (event) => {
    const message = event.data || {};
    const entry = pending.get(message.taskId);
    if (!entry) return;

    if (message.type === 'PROGRESS') {
      entry.onProgress({
        stage: message.stage,
        percent: message.percent,
        engine: message.engine,
      });
      return;
    }

    if (message.type === 'DONE') {
      pending.delete(message.taskId);
      entry.resolve({
        name: message.name,
        filename: message.filename,
        blob: message.blob,
        url: URL.createObjectURL(message.blob),
      });
      return;
    }

    if (message.type === 'ERROR') {
      pending.delete(message.taskId);
      entry.reject(new Error(message.error || 'Worker render failed'));
    }
  };

  // A crash means every in-flight task is lost; disable the worker so the
  // queue's fallback takes over from the next task onward.
  worker.onerror = (event) => {
    workerFailed = true;
    try {
      worker?.terminate();
    } catch {
      /* already gone */
    }
    worker = null;
    rejectAllPending(new Error(event?.message || 'Render worker crashed'));
  };

  return worker;
}

/**
 * Render one task (one MP4) in the worker.
 *
 * @param {Array<Object>} signs - One sign (single reel) or N signs (group reel)
 * @param {(progress: {stage: string, percent: number, engine?: string}) => void} onProgress
 * @param {{ groupNumber?: number|null }} [options]
 * @returns {Promise<{ name: string, filename: string, blob: Blob, url: string }>}
 */
function renderInWorker(signs, onProgress, options = {}) {
  const instance = getWorker();
  const taskId = ++nextTaskId;

  return new Promise((resolve, reject) => {
    pending.set(taskId, { resolve, reject, onProgress: onProgress || (() => {}) });
    instance.postMessage({
      type: 'START',
      taskId,
      signs,
      groupNumber: options.groupNumber ?? null,
      // LocalStorage is not available in the worker, so the typography config
      // travels with the task. `date` is the intro's display date.
      fontConfig: readFontConfig(),
      date: formatDate(new Date()),
    });
  });
}

/**
 * Render one task (one MP4): worker engine first, main thread as fallback.
 *
 * @param {Array<Object>} signs - One sign (single reel) or N signs (group reel)
 * @param {(progress: {stage: string, percent: number, engine?: string}) => void} onProgress
 * @param {{ groupNumber?: number|null }} [options]
 */
export async function renderTask(signs, onProgress, options = {}) {
  if (isWorkerEngineAvailable()) {
    try {
      return await renderInWorker(signs, onProgress, options);
    } catch (error) {
      console.warn(
        '[renderTask] Worker engine failed, falling back to the main-thread renderer:',
        error,
      );
    }
  }

  return renderSign(signs, onProgress, options);
}

/** Optional cleanup for tests/HMR; the queue keeps one worker for the session. */
export function disposeRenderWorker() {
  try {
    worker?.terminate();
  } catch {
    /* already gone */
  }
  worker = null;
  rejectAllPending(new Error('Render worker disposed'));
}
