import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { FiMonitor, FiVideo } from 'react-icons/fi';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export default function VideoChat({ roomId }) {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }

  useEffect(() => {
    if (!roomId) return;

    const createPeer = (socketId, stream) => {
      const peer = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (e) => e.candidate && socket.emit('ice-candidate', { roomId, candidate: e.candidate, to: socketId });
      peer.ontrack = (e) => setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));

      peer.createOffer()
        .then((off) => peer.setLocalDescription(off))
        .then(() => socket.emit('offer', { roomId, offer: peer.localDescription, to: socketId }));

      return peer;
    };

    const createAnswerPeer = (socketId, stream) => {
      const peer = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = (e) => e.candidate && socket.emit('ice-candidate', { roomId, candidate: e.candidate, to: socketId });
      peer.ontrack = (e) => setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));
      return peer;
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket.emit('join-room', { roomId });

        socket.on('user-joined', ({ socketId }) => {
          peersRef.current[socketId] = createPeer(socketId, stream);
        });

        socket.on('offer', async ({ offer, from }) => {
          const peer = createAnswerPeer(from, stream);
          peersRef.current[from] = peer;
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer, to: from });
        });

        socket.on('answer', async ({ answer, from }) => {
          if (peersRef.current[from]) await peersRef.current[from].setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate, from }) => {
          if (peersRef.current[from] && candidate) await peersRef.current[from].addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('peer-left', ({ socketId }) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].close();
            delete peersRef.current[socketId];
            setRemoteStreams((prev) => {
              const next = { ...prev };
              delete next[socketId];
              return next;
            });
          }
        });
      } catch (err) {
        console.error("Error media:", err);
      }
    };

    initMedia();

    // Capturamos los valores de las refs AQUÍ, antes del cleanup
    const currentPeers = peersRef.current;
    const currentStream = localStreamRef.current;

    return () => {
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('peer-left');

      Object.values(currentPeers).forEach(p => p.close());
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);


  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        // Reemplazar video track en todas las conexiones
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        screenTrack.onended = () => stopScreenShare();
        setIsSharingScreen(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setIsSharingScreen(false);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-black/80 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">

      {/* Botones de Control (Flotantes) */}
      <div className="absolute top-6 left-6 z-[20] flex gap-3">
        <button
          onClick={toggleScreenShare}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${isSharingScreen ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
        >
          {isSharingScreen ? <FiVideo /> : <FiMonitor />}
          {isSharingScreen ? 'Detener Pantalla' : 'Compartir Escritorio'}
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {Object.entries(remoteStreams).length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-400 rounded-full animate-spin"></div>
            <p className="text-white/60 font-bold tracking-widest animate-pulse uppercase">Esperando amigos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 w-full h-full overflow-y-auto">
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div key={id} className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                <video autoPlay playsInline ref={(el) => el && !el.srcObject && (el.srcObject = stream)} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 scale-75 origin-left">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-white text-[10px] font-bold uppercase">Amigo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Miniatura Local */}
      <div className={`absolute bottom-6 right-6 ${isSharingScreen ? 'w-full max-w-[300px]' : 'w-48 h-36'} bg-black/50 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group`}>
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover group-hover:brightness-125 transition-all" />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600/80 backdrop-blur-sm rounded-md border border-white/20 text-white text-[10px] font-black uppercase">
          {isSharingScreen ? 'Tu Pantalla' : 'Tú'}
        </div>
      </div>
    </div>
  );
}
