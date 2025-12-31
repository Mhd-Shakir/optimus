import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
        
        {/* ✅ LOGO SECTION (No Text, Only Highlighted Image) */}
        <div className="mb-10 relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            {/* Make sure 'optimus.png' is inside your 'public' folder */}
            <Image 
              src="/optimus.png" 
              alt="Optimus Logo" 
              width={500} 
              height={500}
              priority
              // 👇 This adds the highlighting glow effect to the image
              className="object-contain drop-shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all duration-500 hover:drop-shadow-[0_0_70px_rgba(16,185,129,0.7)] hover:scale-105"
            />
        </div>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 mb-12 font-medium max-w-lg leading-relaxed">
          The Official Arts Fest Management System for <br/>
          <span className="text-slate-200">Darul Aman Integrated Islamic Academy</span>
        </p>

        {/* Login Button */}
        <div className="flex flex-col items-center gap-6 w-full">
          <Link href="/login">
            <button className="group relative px-10 py-4 bg-white hover:bg-emerald-50 text-slate-950 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center gap-3">
              <span>Enter Portal</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Restricted Access • Admins Only
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
        &copy; 2025 Optimus Software.
      </footer>

    </div>
  );
}