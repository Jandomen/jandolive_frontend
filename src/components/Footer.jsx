import React from 'react';

export default function Footer() {
    return (
        <footer className="w-full py-8 mt-auto border-t border-white/5 bg-[#0a0a0c]/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <h2 className="text-white font-black tracking-widest text-lg">JANDOLIVE</h2>
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em]">© {new Date().getFullYear()} • TODOS LOS DERECHOS RESERVADOS</p>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <span className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">Estado del Sistema</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                            <span className="text-white font-bold text-xs uppercase tracking-tighter">Servidores Online</span>
                        </div>
                    </div>

                    <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

                    <div className="flex flex-col items-center md:items-end gap-1">
                        <span className="text-pink-400 font-black text-[9px] uppercase tracking-widest">Privacidad</span>
                        <span className="text-white/60 font-bold text-xs uppercase hover:text-white cursor-pointer transition-colors">Encriptación End-to-End</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
