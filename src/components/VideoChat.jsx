import React, { useState, useRef, useEffect } from 'react';
import useWebRTC from '../hooks/useWebRTC';
import { socket } from '../services/socket';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiHeadphones, FiMessageCircle } from 'react-icons/fi';

export default function VideoChat({ roomId }) {
  const [mediaStarted, setMediaStarted] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(false);

  const {
    localStream,
    remoteStream,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    error,
    startMedia,
  } = useWebRTC(socket, roomId);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const positions = useRef({
    local: { x: 20, y: 20 },
    remote: { x: 20, y: 360 },
  });
  const dragging = useRef(null);

  const startDrag = (e, which) => {
    dragging.current = {
      which,
      offsetX: e.clientX - positions.current[which].x,
      offsetY: e.clientY - positions.current[which].y,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e) => {
    if (!dragging.current) return;
    const { which, offsetX, offsetY } = dragging.current;
    positions.current[which] = {
      x: e.clientX - offsetX,
      y: e.clientY - offsetY,
    };
    const el = document.getElementById(`${which}-video`);
    if (el) {
      el.style.left = `${positions.current[which].x}px`;
      el.style.top = `${positions.current[which].y}px`;
    }
  };

  const stopDrag = () => {
    dragging.current = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const handleStartMedia = (video, audio) => {
    setSelectedVideo(video);
    setMediaStarted(true);
    startMedia(video, audio);
  };

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  return (
    <div className="relative w-full h-[650px] flex flex-col items-center justify-center">
      {!mediaStarted && (
        <div className="flex flex-col gap-3 mb-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Elige cómo deseas conectarte:
          </h3>
          <div className="flex gap-3 justify-center">
            <button onClick={() => handleStartMedia(true, true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
              <FiVideo /> Video + Audio
            </button>
            <button onClick={() => handleStartMedia(false, true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">
              <FiHeadphones /> Solo Audio
            </button>
            <button onClick={() => handleStartMedia(false, false)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-md">
              <FiMessageCircle /> Solo Chat
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-red-500 mt-2">{error}</div>}

      {/* Local Video */}
      <div
        id="local-video"
        className="absolute w-96 h-72 bg-gray-200 rounded-xl shadow-2xl cursor-move overflow-hidden flex items-center justify-center transition-all"
        style={{ top: positions.current.local.y, left: positions.current.local.x }}
        onMouseDown={(e) => startDrag(e, 'local')}
      >
        {selectedVideo && localStream ? (
          <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted />
        ) : (
          <span className="text-gray-500 font-medium">Tu cámara aquí</span>
        )}
        <div className="absolute top-2 left-2 flex gap-2">
          {isVideoEnabled ? <FiVideo className="text-white" /> : <FiVideoOff className="text-red-500" />}
          {isAudioEnabled ? <FiMic className="text-white" /> : <FiMicOff className="text-red-500" />}
        </div>
      </div>

      {/* Remote Video */}
      <div
        id="remote-video"
        className="absolute w-96 h-72 bg-gray-300 rounded-xl shadow-2xl cursor-move overflow-hidden flex items-center justify-center transition-all"
        style={{ top: positions.current.remote.y, left: positions.current.remote.x }}
        onMouseDown={(e) => startDrag(e, 'remote')}
      >
        {remoteStream ? (
          <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay />
        ) : (
          <span className="text-gray-600 font-medium">Esperando a la otra persona...</span>
        )}
      </div>

      {/* Controles */}
      {mediaStarted && (
        <div className="absolute bottom-4 flex gap-3">
          <button onClick={toggleVideo} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition ${isVideoEnabled ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-700 hover:bg-gray-500'}`}>
            {isVideoEnabled ? <FiVideoOff /> : <FiVideo />}
            {isVideoEnabled ? 'Apagar Video' : 'Encender Video'}
          </button>
          <button onClick={toggleAudio} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition ${isAudioEnabled ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-400 text-gray-700 hover:bg-gray-500'}`}>
            {isAudioEnabled ? <FiMicOff /> : <FiMic />}
            {isAudioEnabled ? 'Silenciar Mic' : 'Activar Mic'}
          </button>
        </div>
      )}
    </div>
  );
}

