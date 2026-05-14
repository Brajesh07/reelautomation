import JSZip from 'jszip';

export async function downloadZip(videos) {
  if (!videos || videos.length === 0) return;

  const zip = new JSZip();

  videos.forEach(video => {
    zip.file(video.filename, video.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CanvaReel_Videos.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}