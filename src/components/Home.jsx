import Footer from './Footer';
import { FiUsers } from 'react-icons/fi';

export default function Home({ onStart }) {
  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[#0a0a0c] overflow-x-hidden font-['Outfit']">
      {/* Fondo Animado de Luces Premium ✨ */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[180px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[180px] animate-pulse delay-1000"></div>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-5xl w-full">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-3xl shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white font-black text-[11px] uppercase tracking-[0.4em]">Plataforma Activa</span>
          </div>

          <h1 className="text-7xl sm:text-9xl font-black text-white tracking-tighter leading-none italic select-none">
            JANDO<span className="text-indigo-500 underline decoration-indigo-500/50 underline-offset-8">LIVE</span>
          </h1>

          <p className="text-xl sm:text-2xl text-blue-100 max-w-2xl mx-auto opacity-80 leading-relaxed font-light px-4">
            Conéctate al instante con el mundo. Charlas de video en tiempo real, <span className="text-white font-bold italic underline decoration-indigo-400">seguras y 100% anónimas</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <button
              onClick={onStart}
              className="group relative px-14 py-6 bg-indigo-600 text-white text-xl font-black rounded-[32px] shadow-[0_25px_50px_rgba(79,70,229,0.4)] hover:shadow-[0_30px_60px_rgba(79,70,229,0.5)] hover:-translate-y-2 transition-all duration-500 overflow-hidden ring-1 ring-white/20 active:scale-95"
            >
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
              <span className="relative z-10 tracking-widest uppercase text-sm">¡Comenzar Ahora!</span>
            </button>

            <div className="flex flex-col gap-1 items-center sm:items-start">
              <span className="text-white/40 text-[9px] uppercase font-black tracking-widest pl-1">Confianza Total</span>
              <div className="flex items-center gap-4 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                <FiUsers className="text-white/60 text-lg" />
                <span className="text-white font-bold text-xs">+1.2k Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Tags Animados */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-6">
          {['Anónimo', 'Video HD', 'Seguro', 'Global'].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-[28px] backdrop-blur-2xl hover:bg-white/10 transition-colors group">
              <span className="text-white/30 group-hover:text-white/80 transition-colors font-black text-[12px] uppercase tracking-[0.3em]">{feature}</span>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}