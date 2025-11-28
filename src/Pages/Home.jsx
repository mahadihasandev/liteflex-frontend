
// Home.jsx
// Main frontend page for LiteFlex. Handles:
// - Fetching and displaying the list of video "shorts"
// - Playing selected videos (YouTube embed or direct links)
// - Searching/filtering videos by name
// - Uploading a video URL to the backend API at POST /api/upload
// Keep this file focused on UI logic; API calls use axios.
import React, { useEffect, useState } from "react";
import axios from 'axios'

function Home() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [uploadForm, setUploadForm] = useState({ name: '', tags: '', videoLink: '' });
  const [uploading, setUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load the list once on mount; explicit calls (e.g., after uploads) refresh manually.
  useEffect(() => {
    fetchVideos();
  }, []);

  // Get the existing shorts from the hosted backend and prime the player.
  const fetchVideos = async () => {
    try {
      const res = await axios.get("https://liteflex-backend.vercel.app/api/shorts");
      setVideos(res.data);
      if (res.data.length > 0 && !currentVideo) {
        setCurrentVideo(res.data[0]);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const handleLinkChange = (e) => {
    const val = e.target.value;
    setUploadForm({ ...uploadForm, videoLink: val });
  };

  // Submit a user-provided video URL to the backend for storage.
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.videoLink || uploadForm.videoLink.trim() === '') {
      alert('Please paste a video URL (YouTube, Vimeo, etc.)');
      return;
    }

    setUploading(true);
    const payload = {
      videoLink: uploadForm.videoLink.trim(),
      name: uploadForm.name || 'Untitled',
      tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      await axios.post('https://liteflex-backend.vercel.app/api/upload', payload);
      alert('Video saved successfully!');
      setUploadForm({ name: '', tags: '', videoLink: '' });
      fetchVideos();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:.*v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  const isYouTubeUrl = (url) => /(?:youtube(?:-nocookie)?\.com\/|youtu\.be\/)/.test(url || '');
  
  // Simple client-side search based on the title.
  const filteredVideos = videos.filter(video => 
    video.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="px-4 sm:px-6 lg:px-[100px] py-6 bg-white min-h-screen">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-black text-red-600 sm:text-4xl" style={{ letterSpacing: '-0.05em', fontFamily: 'Arial, sans-serif' }}>
          LIGHT<span className="text-black">FLEX</span>
        </h1>
        <div className="w-full lg:flex-1 lg:mx-8">
            <input
              type="text"
              placeholder="Search videos by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-[50vw] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
      </div>
      <div className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            {currentVideo ? (
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                {isYouTubeUrl(currentVideo.videoUrl) ? (
                  <iframe
                    className="h-full w-full"
                    src={getYouTubeEmbedUrl(currentVideo.videoUrl)}
                    title={currentVideo.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    className="h-full w-full object-cover"
                    autoPlay={isPlaying}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={currentVideo.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="bg-gray-300 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-600">No videos available</p>
              </div>
            )}
            {currentVideo && (
              <div className="mt-4">
                <h2 className="text-2xl font-bold">{currentVideo.name}</h2>
                {currentVideo.tags && currentVideo.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentVideo.tags.map((tag, i) => (
                      <span key={i} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full lg:w-80">
            <h3 className="text-lg font-semibold mb-3">Videos</h3>
            <div className="max-h-80 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3 lg:h-96">
              {filteredVideos.length === 0 ? (
                <p className="text-gray-500 text-sm">No videos found</p>
              ) : (
                filteredVideos.map((video) => (
                  <div
                    key={video._id}
                    className={`flex gap-2 cursor-pointer p-2 rounded-lg transition ${
                      currentVideo?._id === video._id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'hover:bg-gray-200'
                    }`}
                    onClick={() => { setCurrentVideo(video); setIsPlaying(true); }}
                  >
                    <div className="w-24 h-14 bg-gray-400 rounded shrink-0 flex items-center justify-center overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white">Video</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.name}</p>
                      {video.tags && video.tags.length > 0 && (
                        <p className="text-xs text-gray-600">{video.tags.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Upload New Video</h2>
        <form onSubmit={handleUpload} className="max-w-2xl mx-auto space-y-4 px-2 sm:px-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Video Title"
              value={uploadForm.name}
              onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="url"
              placeholder="Video URL (YouTube or direct link)"
              value={uploadForm.videoLink}
              onChange={handleLinkChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Click Preview to test or Upload to save.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-center">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium"
            >
              {uploading ? 'Saving...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Home