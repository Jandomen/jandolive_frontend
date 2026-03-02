import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { FiSend, FiUser, FiGlobe } from 'react-icons/fi';

export default function ChatBox({ roomId, onLeave }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
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
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl rounded-[40px] border border-white/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Estilo Android/iOS */}
      <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-2xl ring-1 ring-white/10">
            <FiGlobe className="text-indigo-400 text-xl" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm tracking-tight">Sala de Chat</h3>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
              <p className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-black truncate">Chat Activo</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="px-5 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-full text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-95"
        >
          Salir
        </button>
      </div>

      {/* Burbujas de Chat */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <div className="p-6 bg-white/5 rounded-full border border-white/10">
              <FiUser size={48} className="text-white" />
            </div>
            <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Di algo increíble...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[80%] px-5 py-3.5 rounded-[22px] text-sm leading-relaxed shadow-lg ${msg.fromMe ? 'bg-indigo-600/90 text-white rounded-tr-none shadow-indigo-600/20 ring-1 ring-white/20' : 'bg-white/10 text-blue-100 border border-white/20 rounded-tl-none shadow-black/40 backdrop-blur-md'}`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-white/30 font-black mt-2 uppercase px-2 tracking-widest">{msg.time}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Envío - 100% Mobile Safe 📱 */}
      <form onSubmit={sendMessage} className="p-4 sm:p-5 bg-white/5 border-t border-white/10 flex gap-2 items-center">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-[24px] px-4 py-3.5 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-sm transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          className="w-12 h-12 flex-none bg-indigo-600 text-white rounded-[20px] hover:bg-indigo-500 active:scale-90 transition-all shadow-xl flex items-center justify-center ring-1 ring-white/20 group"
        >
          <FiSend className="text-xl group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>
    </div>
  );
}

