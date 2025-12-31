import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen pb-10 bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
        
        {/* ✅ LOGO SECTION */}
        <div className="relative group cursor-default -mb-6 md:-mb-8"> 
           {/* Subtle glow behind logo on hover */}
           <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
           
           <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transition-transform duration-700 ease-out group-hover:-translate-y-2">
            <Image 
              src="/optimus.png" 
              alt="Optimus Logo" 
              width={500} 
              height={500}
              priority
              className="object-contain drop-shadow-2xl transition-all duration-500"
            />
          </div>
        </div>
        
        {/* Text Section - Removed opacity/animation classes */}
        <div className="space-y-3 max-w-lg mx-auto mb-10">
           <h2 className="text-xs font-bold tracking-[0.2em] text-emerald-500 uppercase">Event Management Portal</h2>
           
           <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-light">
             The Official Arts Fest System for <br className="hidden md:block"/>
             <span className="text-slate-100 font-medium">Darul Aman Integrated Islamic Academy</span>
           </p>
        </div>

        {/* Action Section - Removed opacity/animation classes */}
        <div className="flex flex-col items-center gap-6 w-full">
          <Link href="/login">
            <button className="group relative px-10 py-4 bg-white hover:bg-emerald-50 text-slate-950 rounded-full font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-3 active:scale-95">
              <span>Enter Portal</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>
          </Link>

          {/* Glassy Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur-md text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Restricted Access • Admins Only
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-[10px] text-slate-600 font-medium uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
        &copy; 2025 Optimus Software.
      </footer>

    </div>
  );
}