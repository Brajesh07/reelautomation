export function isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotifyPermission() {
  if (!isSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function notifyComplete(count, navigate) {
  if (!isSupported() || Notification.permission !== 'granted') return
  try {
    const n = new Notification('✅ CanvaReel — Render Complete', {
      body: `All ${count} videos are ready. Click to view them.`,
      icon: '/favicon.ico',
    })
    n.onclick = () => {
      window.focus()
      if (navigate) navigate('/videos')
    }
  } catch {}
}

export function notifySignDone(name, current, total) {
  if (!isSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(`⏳ ${name} rendered (${current} of ${total})`, {
      body: `${total - current} video${total - current !== 1 ? 's' : ''} remaining`,
      icon: '/favicon.ico',
      silent: true,
    })
  } catch {}
}
