import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRenderStore } from "../engine/useRenderQueue";
import { downloadZip } from "../utils/downloadZip";

export default function Videos() {
  const navigate = useNavigate();
  const { renderedVideos, deleteVideo, loadPersistedVideos } = useRenderStore();
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore videos from IndexedDB when the page mounts (e.g. after a tab change or refresh)
  useEffect(() => {
    loadPersistedVideos().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading videos...</p>
      </div>
    );
  }

  if (renderedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
        <p className="text-xl text-gray-400">
          No videos yet. Go render some first!
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-xl shadow-lg"
        >
          ← Go Render
        </button>
      </div>
    );
  }

  const toggleSelect = (filename) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === renderedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(renderedVideos.map((v) => v.filename)));
    }
  };

  const handleDownload = async () => {
    if (selectedVideos.size === 0) return;
    setIsZipping(true);
    const videosToDownload = renderedVideos.filter((v) =>
      selectedVideos.has(v.filename),
    );
    try {
      await downloadZip(videosToDownload);
      // Clear selection after successful download
      setSelectedVideos(new Set());
    } catch (error) {
      alert("Failed to create ZIP.");
    }
    setIsZipping(false);
  };

  const handleDelete = () => {
    if (selectedVideos.size === 0) return;
    if (
      window.confirm(
        `Delete ${selectedVideos.size} videos? This cannot be undone.`,
      )
    ) {
      const toDelete = Array.from(selectedVideos);
      toDelete.forEach((filename) => deleteVideo(filename));
      setSelectedVideos(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white font-medium"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-yellow-500">
              Rendered Videos ({renderedVideos.length})
            </h1>
          </div>

          <button
            onClick={handleSelectAll}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {selectedVideos.size === renderedVideos.length
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {renderedVideos.map((video) => {
            const isSelected = selectedVideos.has(video.filename);
            return (
              <div
                key={video.filename}
                className={`relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer border-4 transition-colors ${
                  isSelected ? "border-yellow-500" : "border-transparent"
                }`}
                onClick={() => toggleSelect(video.filename)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-5 h-5 accent-yellow-500 pointer-events-none"
                  />
                </div>

                <div className="aspect-[9/16] bg-black">
                  <video
                    src={video.url}
                    preload="metadata"
                    controls
                    muted
                    className="w-full h-full object-cover"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="p-3 bg-gray-800 border-t border-gray-700">
                  <p
                    className="text-xs font-mono text-center text-gray-300 truncate"
                    title={video.filename}
                  >
                    {video.filename}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        {selectedVideos.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-2xl z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <span className="font-bold text-yellow-500">
                {selectedVideos.size} selected
              </span>

              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  disabled={isZipping}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  {isZipping ? "⏳ Zipping..." : "⬇ Download ZIP"}
                </button>

                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  🗑 Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
