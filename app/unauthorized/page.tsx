import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center border border-gray-200">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          Oops! You don't have permission to view this area. 
          This zone is restricted to authorized team leaders only.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            href="/"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}