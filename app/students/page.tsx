"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/student/list"); // നേരത്തെ ഉണ്ടാക്കിയ list api
      const data = await res.json();
      
      // Filter based on role
      let teamData = data;
      if (user?.role === "auris_leader") {
        teamData = data.filter((s: any) => s.team === "Auris");
      } else if (user?.role === "libras_leader") {
        teamData = data.filter((s: any) => s.team === "Libras");
      }
      
      setStudents(teamData);
      setFilteredStudents(teamData);
    } catch (error) {
      console.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // Handle Filter & Search
  useEffect(() => {
    let result = students;

    // Filter by Category (Alpha/Beta/Omega)
    if (filterCategory !== "All") {
      result = result.filter(s => s.category === filterCategory);
    }

    // Filter by Search (Name or Chest No)
    if (searchTerm) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.chestNo.includes(searchTerm)
      );
    }

    setFilteredStudents(result);
  }, [filterCategory, searchTerm, students]);

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/student/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        alert("Student deleted!");
        fetchStudents(); // Refresh list
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      alert("Error deleting student");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {user?.role === "admin" ? "All Students" : `Team ${user?.team} Students`}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Total: {filteredStudents.length} Students</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline">
            ← Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search by Name or Chest No..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded border-gray-300"
          />
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded border-gray-300"
          >
            <option value="All">All Categories</option>
            <option value="Alpha">Alpha</option>
            <option value="Beta">Beta</option>
            <option value="Omega">Omega</option>
          </select>
        </div>

        {/* Student List Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4 border-b">Chest No</th>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Category</th>
                <th className="p-4 border-b">Team</th>
                <th className="p-4 border-b">Events</th>
                <th className="p-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No students found.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="p-4 font-bold text-gray-800">{student.chestNo}</td>
                    <td className="p-4 font-medium">{student.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        student.category === "Alpha" ? "bg-purple-100 text-purple-700" :
                        student.category === "Beta" ? "bg-orange-100 text-orange-700" :
                        "bg-teal-100 text-teal-700"
                      }`}>
                        {student.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${student.team === "Auris" ? "text-yellow-600" : "text-blue-600"}`}>
                        {student.team}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {student.registeredEvents.length} Events
                      <span className="text-xs ml-2 bg-gray-100 px-1 rounded border">
                        {student.registeredEvents.filter((e:any) => e.isStar).length} ★
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(student._id, student.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}