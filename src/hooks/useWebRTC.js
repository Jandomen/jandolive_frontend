import { useState, useEffect, useRef } from 'react';

export default function useWebRTC(socket, roomId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [error, setError] = useState(null);
  const peerConnection = useRef(null);

  const startMedia = async (video = false, audio = false) => {
    if (!video && !audio) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('WebRTC no soportado en este navegador o contexto. Usa HTTPS o localhost.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);

      if (peerConnection.current) {
        stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
      }
    } catch (err) {
      console.error('WebRTC error:', err);
      setError('Permite el acceso a cámara/micrófono.');
      if (socket) socket.emit('error', { message: 'No se pudo acceder a la cámara/micrófono' });
    }
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  useEffect(() => {
    if (!socket || !roomId) return;
    let isMounted = true;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.current.ontrack = (event) => {
      if (isMounted) setRemoteStream(event.streams[0]);
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', { roomId, candidate: event.candidate });
    };

    if (localStream) {
      localStream.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream));
      (async () => {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      })();
    }

    return () => {
      isMounted = false;
      if (peerConnection.current) peerConnection.current.close();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, [socket, roomId, localStream]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!peerConnection.current) return;
      try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)); } 
      catch (err) { console.error('ICE Error:', err); }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, roomId]);

  return { localStream, remoteStream, toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled, error, startMedia };
}
