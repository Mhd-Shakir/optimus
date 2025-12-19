import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 text-center max-w-3xl">
        
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            OPTIMUS
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 font-light">
          Official Arts Fest Management Software
        </p>

        {/* Login Button */}
        <div className="flex flex-col items-center gap-4">
          <Link href="/login">
            <button className="group relative px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              <span className="flex items-center gap-2">
                Team Login <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Restricted Access • Auris & Libras Admins Only
          </p>
        </div>

      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-gray-600">
        &copy; 2025 Optimus Software. All rights reserved.
      </footer>

    </div>
  );
}