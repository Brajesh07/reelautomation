import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRenderStore } from '../engine/useRenderQueue';
import { validateJson } from '../utils/validateJson';

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const { 
    signsData, 
    setSignsData, 
    startRendering, 
    isRendering, 
    progress,
    currentRenderIndex,
    isComplete,
    renderedVideos
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
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
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
      "zodiacs": [
        {
          "name": "Leo",
          "vibe": "Radiant confidence leads to unexpected breakthroughs.",
          "love": "Passionate encounters spark\nnew emotional depth.",
          "career": "Leadership success comes from\ntrusting your creative vision.",
          "money": "Invest wisely in projects that\nalign with your core values.",
          "soulMessage": "Shine bright and let the\nworld see your true self."
        },
        {
          "name": "Virgo",
          "vibe": "Grounded energy brings focus to minor details.",
          "love": "Practical love and small gestures\nstrengthen your connection.",
          "career": "Detail-oriented work earns\nrecognition from decision makers.",
          "money": "Budgeting pays off as you\nfind new ways to save.",
          "soulMessage": "Trust the process and stay\npatient with your growth."
        },
        {
          "name": "Libra",
          "vibe": "Balanced perspective helps resolve old conflicts.",
          "love": "Harmony is key to moving\npast recent misunderstandings.",
          "career": "Diplomacy wins over skeptical\ncolleagues and partners.",
          "money": "Balance your books and avoid\nunnecessary luxury expenses.",
          "soulMessage": "Seek peace within before\nlooking for it elsewhere."
        }
      ]
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

  const currentSign = signsData[currentRenderIndex];

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
                  {signsData.length} signs loaded: {signsData.map(s => s.name).join(', ')}
                </p>
                <button 
                  onClick={() => startRendering(navigate)}
                  className="w-full bg-[#DAC477] hover:bg-[#DAC477]/90 text-black font-bold py-3 rounded-xl transition-all shadow-lg"
                >
                  Render All {signsData.length} Videos
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
                Rendering {currentSign?.name} ({currentRenderIndex + 1} of {signsData.length})
              </p>
              <p className="text-sm text-gray-400">
                {progress.stage === 'capturing' ? 'Capturing frames' : 'Encoding MP4'} {progress.percent}%
              </p>
            </div>
            
            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/10">
              <div 
                className="bg-[#DAC477] h-full transition-all duration-300 ease-out" 
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center italic mt-4">
              Please do not close or navigate away from this tab.
            </p>
          </div>
        )}

        {/* Complete State */}
        {isComplete && renderedVideos.length > 0 && (
          <div className="space-y-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-400">All {renderedVideos.length} videos rendered!</h2>
            
            <div className="bg-black/40 rounded-xl p-4 max-h-48 overflow-y-auto text-left space-y-2 border border-white/10">
              {renderedVideos.map(v => (
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

        {/* Navigation Links */}
        {!isRendering && (
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center gap-6">
            <a href="/frame-preview" className="text-xs text-gray-500 hover:text-[#DAC477] transition-colors">Frame Preview</a>
          </div>
        )}
      </div>

      {/* In-App Toast Fallback */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#DAC477] text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#DAC477]/50">
            <span className="font-bold text-lg">✅ All {renderedVideos.length} videos are ready!</span>
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