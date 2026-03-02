import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { FiSend, FiUser, FiGlobe } from 'react-icons/fi';

export default function ChatBox({ roomId, onLeave }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleMessage);
    return () => socket.off('chat-message', handleMessage);
  }, []);

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      const msg = { text: input, fromMe: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      socket.emit('chat-message', { roomId, message: input });
      setMessages((prev) => [...prev, msg]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
      {/* Header Chat */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <FiGlobe className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Chat en Vivo</h3>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-black">Conexión Segura</p>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg"
        >
          Salir
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-2">
            <FiUser size={40} className="text-white" />
            <p className="text-white text-xs font-bold uppercase tracking-widest">Di hola para empezar...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.fromMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20' : 'bg-white/10 text-blue-100 border border-white/10 rounded-tl-none shadow-black/10 shadow-lg'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-white/30 font-bold mt-1 uppercase px-1">{msg.time}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Envío - Optimizado para móvil */}
      <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
        />
        <button
          type="submit"
          className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 active:scale-95 transition-all shadow-xl flex items-center justify-center min-w-[56px] shadow-indigo-600/30"
          title="Enviar Mensaje"
        >
          <FiSend className="text-xl" />
        </button>
      </form>
    </div>
  );
}
