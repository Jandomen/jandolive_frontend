import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';

// Configuración de servidores STUN (Para que funcione con datos móviles)
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
  const [remoteStreams, setRemoteStreams] = useState({});

  useEffect(() => {
    if (!roomId) return;

    let peers = {}; // Usar objeto local para evitar dependencias circulares en useEffect

    const createPeer = (socketId, stream) => {
      const peer = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = (e) => e.candidate && socket.emit('ice-candidate', { roomId, candidate: e.candidate, to: socketId });
      peer.ontrack = (e) => setRemoteStreams((prev) => ({ ...prev, [socketId]: e.streams[0] }));
      peer.createOffer().then((off) => peer.setLocalDescription(off)).then(() => socket.emit('offer', { roomId, offer: peer.localDescription, to: socketId }));
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

        socket.on('user-joined', async ({ socketId }) => {
          peers[socketId] = createPeer(socketId, stream);
        });

        socket.on('offer', async ({ offer, from }) => {
          const peer = createAnswerPeer(from, stream);
          peers[from] = peer;
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer, to: from });
        });

        socket.on('answer', async ({ answer, from }) => {
          if (peers[from]) await peers[from].setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate, from }) => {
          if (peers[from] && candidate) await peers[from].addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('peer-left', ({ socketId }) => {
          if (peers[socketId]) {
            peers[socketId].close();
            delete peers[socketId];
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

    return () => {
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('peer-left');
      Object.values(peers).forEach(p => p.close());
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <div className="relative w-full h-[600px] bg-black/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="absolute inset-0 flex items-center justify-center">
        {Object.entries(remoteStreams).length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
            <p className="text-white/60 font-bold tracking-widest animate-pulse uppercase">Esperando compañero...</p>
          </div>
        ) : (
          Object.entries(remoteStreams).map(([id, stream]) => (
            <div key={id} className="relative w-full h-full">
              <video autoPlay playsInline ref={(el) => el && !el.srcObject && (el.srcObject = stream)} className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-lg border border-white/20 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-white text-xs font-bold uppercase tracking-widest">En línea</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="absolute top-6 right-6 w-48 h-32 bg-black/50 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-2xl group hover:scale-110 transition-transform duration-300">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover group-hover:brightness-125 transition-all" />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600/80 backdrop-blur-sm rounded-md border border-white/20 text-white text-[10px] font-black uppercase">Tú</div>
      </div>

      <div className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-full">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]"></div>
      </div>
    </div>
  );
}
