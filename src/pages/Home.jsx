import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRenderStore, buildRenderTasks } from '../engine/useRenderQueue';
import { validateJson } from '../utils/validateJson';

// Group-reel options only appear when the upload holds more than this many signs
const GROUP_OPTIONS_THRESHOLD = 3;
// A "group" of one is just a single reel, so require at least two signs
const GROUP_MIN_SIGNS = 2;
// Rough clock length used for the per-group estimate: intro + outro + one card
const GROUP_BASE_SECONDS = 18.6;
const CARD_SECONDS = 13.1;

const DEFAULT_SELECTION = { single: true, group: false, groups: [] };

const formatSeconds = (seconds) => `${seconds.toFixed(1)}s`;

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const groupIdRef = useRef(0);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [selection, setSelection] = useState(DEFAULT_SELECTION);

  const {
    signsData,
    setSignsData,
    startRendering,
    isRendering,
    tasks,
    currentTaskIndex,
    progress,
    isComplete,
    renderedVideos,
    errors,
  } = useRenderStore();

  // Show toast fallback if browser notifications are denied or unsupported
  React.useEffect(() => {
    if (isComplete && renderedVideos.length > 0) {
      const notificationsActive = 'Notification' in window && Notification.permission === 'granted';
      if (!notificationsActive) {
        setShowToast(true);
      }
    }
  }, [isComplete, renderedVideos.length]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setShowToast(false);
    setSelection(DEFAULT_SELECTION);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') {
        setError('Could not read that file. Please pick a JSON file and try again.');
        setSignsData([]);
        return;
      }

      try {
        const json = JSON.parse(text);
        const { valid, error: valError, data: validatedData } = validateJson(json);

        if (!valid) {
          setError(valError);
          setSignsData([]);
          return;
        }

        setSignsData(validatedData);
      } catch (err) {
        setError('Invalid JSON format.');
        setSignsData([]);
      }
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const sampleData = {
      zodiacs: [
        {
          name: 'Leo',
          vibe: 'Radiant confidence leads to unexpected breakthroughs.',
          love: 'Passionate encounters spark\nnew emotional depth.',
          career: 'Leadership success comes from\ntrusting your creative vision.',
          money: 'Invest wisely in projects that\nalign with your core values.',
          soulMessage: 'Shine bright and let the\nworld see your true self.',
        },
        {
          name: 'Virgo',
          vibe: 'Grounded energy brings focus to minor details.',
          love: 'Practical love and small gestures\nstrengthen your connection.',
          career: 'Detail-oriented work earns\nrecognition from decision makers.',
          money: 'Budgeting pays off as you\nfind new ways to save.',
          soulMessage: 'Trust the process and stay\npatient with your growth.',
        },
        {
          name: 'Libra',
          vibe: 'Balanced perspective helps resolve old conflicts.',
          love: 'Harmony is key to moving\npast recent misunderstandings.',
          career: 'Diplomacy wins over skeptical\ncolleagues and partners.',
          money: 'Balance your books and avoid\nunnecessary luxury expenses.',
          soulMessage: 'Seek peace within before\nlooking for it elsewhere.',
        },
      ],
    };
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-zodiac.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Render mode + group configuration -------------------------------------

  // Above the threshold the user picks the modes; at or below it single reels
  // stay the implicit default (unchanged legacy behaviour).
  const offersGroupMode = signsData.length > GROUP_OPTIONS_THRESHOLD;
  const groups = offersGroupMode && selection.group ? selection.groups : [];

  const plannedTasks = useMemo(
    () => buildRenderTasks(signsData, offersGroupMode ? { single: selection.single, groups } : {}),
    [signsData, selection, offersGroupMode],
  );

  const singleCount = plannedTasks.filter((task) => task.type === 'single').length;
  const groupTasks = plannedTasks.filter((task) => task.type === 'group');
  const groupTaskCount = groupTasks.length;

  // Every configured group needs at least two signs before a batch can start
  const undersizedGroups = groups
    .map((group, index) => ({ number: index + 1, count: group.indices.length }))
    .filter((group) => group.count < GROUP_MIN_SIGNS);

  const groupSignCount = groups.reduce((total, group) => total + group.indices.length, 0);
  const needsGroup = offersGroupMode && selection.group && groups.length === 0;
  const noModeSelected = offersGroupMode && !selection.single && !selection.group;

  const canRender = plannedTasks.length > 0 && undersizedGroups.length === 0 && !noModeSelected;

  const buttonLabel = noModeSelected
    ? 'Choose a render mode'
    : needsGroup
      ? 'Add a group to render'
      : undersizedGroups.length > 0
        ? `Group ${undersizedGroups[0].number} needs at least ${GROUP_MIN_SIGNS} signs`
        : groupTaskCount && singleCount
          ? `Render ${singleCount} Reels + ${groupTaskCount} Group Reel${groupTaskCount === 1 ? '' : 's'}`
          : groupTaskCount
            ? `Render ${groupTaskCount} Group Reel${groupTaskCount === 1 ? '' : 's'}`
            : `Render All ${singleCount} Videos`;

  const summaryParts = [];
  if (singleCount) {
    summaryParts.push(`${singleCount} single reel${singleCount === 1 ? '' : 's'}`);
  }
  if (groupTaskCount) {
    summaryParts.push(
      `${groupTaskCount} group reel${groupTaskCount === 1 ? '' : 's'} (${groupSignCount} signs)`,
    );
  }

  const newGroup = (indices) => {
    groupIdRef.current += 1;
    return { id: groupIdRef.current, indices };
  };

  const toggleMode = (mode) => {
    setSelection((prev) => {
      if (mode === 'group') {
        const nextGroup = !prev.group;
        return {
          ...prev,
          group: nextGroup,
          // Turning group mode on pre-seeds one group holding every sign; the
          // user then splits it up with "Add Another Group" and the checkboxes.
          groups:
            nextGroup && prev.groups.length === 0
              ? [newGroup(signsData.map((_, index) => index))]
              : prev.groups,
        };
      }
      return { ...prev, single: !prev.single };
    });
  };

  const addGroup = () =>
    setSelection((prev) => ({ ...prev, groups: [...prev.groups, newGroup([])] }));

  const removeGroup = (id) =>
    setSelection((prev) => ({
      ...prev,
      groups: prev.groups.filter((group) => group.id !== id),
    }));

  const updateGroup = (id, updater) =>
    setSelection((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === id ? { ...group, indices: updater(group.indices) } : group,
      ),
    }));

  const toggleGroupSign = (id, index) =>
    updateGroup(id, (indices) =>
      indices.includes(index)
        ? indices.filter((selected) => selected !== index)
        : [...indices, index],
    );

  const selectAllInGroup = (id) => updateGroup(id, () => signsData.map((_, index) => index));

  const clearGroup = (id) => updateGroup(id, () => []);

  const handleStart = () => {
    if (!canRender) return;
    startRendering(navigate, { single: selection.single, groups });
  };

  const activeTask = tasks[currentTaskIndex];
  const progressLabel =
    progress.stage === 'capturing'
      ? 'Capturing frames'
      : progress.stage === 'encoding'
        ? 'Encoding MP4'
        : 'Preparing';

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#111] rounded-2xl shadow-2xl p-8 border border-white/10">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#DAC477]">CanvaReel</h1>

        {/* Upload State */}
        {!isRendering && (!isComplete || renderedVideos.length === 0) && (
          <div className="space-y-6">
            <div className="text-center">
              <button
                onClick={downloadSample}
                className="text-xs text-[#DAC477] hover:text-[#DAC477]/80 underline transition-colors"
              >
                ⬇️ Download Sample JSON
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-[#DAC477] transition-colors bg-white/5"
            >
              <p className="text-gray-400">Click to upload zodiac data JSON</p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 text-red-200 border border-red-500/30 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {signsData.length > 0 && !error && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center">
                  {signsData.length} signs loaded: {signsData.map((s) => s.name).join(', ')}
                </p>

                {offersGroupMode && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-left">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">
                      Render options
                    </p>

                    <label className="flex items-center gap-3 cursor-pointer text-sm select-none">
                      <input
                        type="checkbox"
                        checked={selection.single}
                        onChange={() => toggleMode('single')}
                        className="w-4 h-4 accent-[#DAC477] cursor-pointer"
                      />
                      <span>
                        Single Reels
                        <span className="text-gray-500"> — one video per sign</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-sm select-none">
                      <input
                        type="checkbox"
                        checked={selection.group}
                        onChange={() => toggleMode('group')}
                        className="w-4 h-4 accent-[#DAC477] cursor-pointer"
                      />
                      <span>
                        Multiple Reels <span className="text-gray-500">(Group Reels)</span>
                      </span>
                    </label>

                    {selection.group && (
                      <div className="ml-2 border-l border-white/10 pl-4 space-y-3">
                        {groups.map((group, groupIndex) => {
                          const count = group.indices.length;
                          const estimate = GROUP_BASE_SECONDS + count * CARD_SECONDS;
                          return (
                            <div
                              key={group.id}
                              className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-[#DAC477]">
                                  Group {groupIndex + 1}
                                </p>
                                <div className="flex items-center gap-3 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => selectAllInGroup(group.id)}
                                    className="text-[#DAC477] hover:underline"
                                  >
                                    All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearGroup(group.id)}
                                    className="text-gray-500 hover:text-gray-300 hover:underline"
                                  >
                                    None
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeGroup(group.id)}
                                    className="text-red-300/80 hover:text-red-200 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] text-gray-400">
                                {count} of {signsData.length} signs
                                {count > 0 && ` · ≈ ${formatSeconds(estimate)} video`}
                              </p>

                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-40 overflow-y-auto pr-1">
                                {signsData.map((sign, index) => (
                                  <label
                                    key={`${group.id}-${index}`}
                                    className="flex items-center gap-2 cursor-pointer text-sm py-0.5 select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={group.indices.includes(index)}
                                      onChange={() => toggleGroupSign(group.id, index)}
                                      className="w-3.5 h-3.5 accent-[#DAC477] cursor-pointer"
                                    />
                                    <span className="text-gray-300 truncate">{sign.name}</span>
                                  </label>
                                ))}
                              </div>

                              {count < GROUP_MIN_SIGNS && (
                                <p className="text-[11px] text-red-300/80">
                                  Pick at least {GROUP_MIN_SIGNS} signs — a group of one is just a
                                  single reel.
                                </p>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={addGroup}
                          className="w-full text-xs border border-dashed border-white/20 rounded-lg py-2 text-[#DAC477] hover:border-[#DAC477] hover:bg-[#DAC477]/5 transition-colors"
                        >
                          + Add Another Group
                        </button>

                        {groups.length === 0 && (
                          <p className="text-[11px] text-gray-500 text-center">
                            No groups configured yet.
                          </p>
                        )}

                        {groups.some((group) => group.indices.length > 6) && (
                          <p className="text-[11px] text-amber-400/80 leading-snug">
                            Heads up: memory is per video, not per batch — every card adds ~13s and
                            ~200MB while that reel renders. Groups above ~6 signs can run out of
                            memory.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {summaryParts.length > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Will render: {summaryParts.join(' + ')} → {plannedTasks.length} video
                    {plannedTasks.length === 1 ? '' : 's'}
                  </p>
                )}

                <button
                  onClick={handleStart}
                  disabled={!canRender}
                  className="w-full bg-[#DAC477] hover:bg-[#DAC477]/90 disabled:bg-[#DAC477]/30 disabled:text-black/50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-lg"
                >
                  {buttonLabel}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rendering State */}
        {isRendering && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-[#DAC477]">
                Rendering {activeTask?.label ?? '…'} ({currentTaskIndex + 1} of {tasks.length})
              </p>
              <p className="text-sm text-gray-400">
                {progressLabel} {progress.percent}%
              </p>
            </div>

            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/10">
              <div
                className="bg-[#DAC477] h-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            {activeTask?.type === 'group' && (
              <p className="text-xs text-gray-500 text-center">
                {activeTask.data.length} zodiac cards in this reel:{' '}
                {activeTask.data.map((sign) => sign.name).join(' → ')}
              </p>
            )}

            <p className="text-xs text-gray-500 text-center italic mt-4">
              Please do not close or navigate away from this tab.
            </p>
          </div>
        )}

        {/* Complete State */}
        {isComplete && renderedVideos.length > 0 && (
          <div className="space-y-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-400">
              {renderedVideos.length} video{renderedVideos.length === 1 ? '' : 's'} rendered!
            </h2>

            <div className="bg-black/40 rounded-xl p-4 max-h-48 overflow-y-auto text-left space-y-2 border border-white/10">
              {renderedVideos.map((v) => (
                <div key={v.filename} className="text-xs text-gray-400 font-mono">
                  {v.filename}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/videos')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
            >
              🎬 View All Videos
            </button>
          </div>
        )}

        {/* Failed renders (queue keeps going on error, so surface what was lost) */}
        {errors.length > 0 && (
          <div className="mt-6 bg-red-900/30 text-red-200 border border-red-500/30 rounded-lg p-3 text-xs space-y-1">
            <p className="font-bold">
              {errors.length} render{errors.length === 1 ? '' : 's'} failed:
            </p>
            {errors.map((failure, index) => (
              <p key={`${failure.label}-${index}`}>
                {failure.label} — {failure.message}
              </p>
            ))}
          </div>
        )}

        {/* Navigation Links */}
        {!isRendering && (
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center gap-6">
            <a
              href="/frame-preview"
              className="text-xs text-gray-500 hover:text-[#DAC477] transition-colors"
            >
              Frame Preview
            </a>
          </div>
        )}
      </div>

      {/* In-App Toast Fallback */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#DAC477] text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#DAC477]/50">
            <span className="font-bold text-lg">
              ✅ All {renderedVideos.length} videos are ready!
            </span>
            <button
              onClick={() => navigate('/videos')}
              className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              🎬 View Videos →
            </button>
            <button
              onClick={() => setShowToast(false)}
              className="text-black/50 hover:text-black font-bold text-xl ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
