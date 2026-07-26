"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function AdminQRPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<any[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [teamQrCodes, setTeamQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"individual" | "team">("individual");
  const [selectedTeam, setSelectedTeam] = useState<string>("All");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/list");
      const data = await res.json();
      setStudents(data);
      
      // Generate QR codes
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      const qrData: Record<string, string> = {};
      for (const student of data) {
        const url = `${origin}/student/${student.chestNo}`;
        qrData[student.chestNo] = await QRCode.toDataURL(url, { margin: 1, width: 200 });
      }
      setQrCodes(qrData);

      // Generate Team QR codes
      const teams = ["Ignis", "Ventus", "Aqua", "Terra", "Aether"]; // We can refine this later if needed
      const teamQrData: Record<string, string> = {};
      for (const team of teams) {
        const url = `${origin}/team/${team.toLowerCase()}`;
        teamQrData[team] = await QRCode.toDataURL(url, { margin: 1, width: 300 });
      }
      setTeamQrCodes(teamQrData);

    } catch (error) {
      console.error("Failed to fetch students or generate QR codes", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = selectedTeam === "All" ? students : students.filter(s => s.team === selectedTeam);

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageHeight = doc.internal.pageSize.height
    
    let x = 15
    let y = 20
    const cardWidth = 55
    const cardHeight = 70
    const margin = 5

    if (viewMode === "individual") {
      doc.setFontSize(16)
      doc.text(selectedTeam === "All" ? "All Students - QR Codes" : `Team ${selectedTeam} - QR Codes`, 15, 12)

      filteredStudents.forEach((student, index) => {
        // Draw card border
        doc.setDrawColor(200)
        doc.rect(x, y, cardWidth, cardHeight)

        // Add QR Code
        const qrData = qrCodes[student.chestNo]
        if (qrData) {
          doc.addImage(qrData, 'PNG', x + 10, y + 5, 35, 35)
        }

        // Add details
        doc.setFontSize(10)
        const shortName = student.name.length > 20 ? student.name.substring(0, 18) + ".." : student.name
        doc.text(shortName.toUpperCase(), x + cardWidth/2, y + 48, { align: "center" })
        
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text(`Chest: ${student.chestNo}`, x + cardWidth/2, y + 55, { align: "center" })
        
        doc.setFontSize(9)
        doc.text(`Team: ${student.team}`, x + cardWidth/2, y + 62, { align: "center" })
        
        doc.setTextColor(0)

        x += cardWidth + margin
        if (x + cardWidth > 200) { // new row
          x = 15
          y += cardHeight + margin
        }

        if (y + cardHeight > pageHeight - 10) { // new page
          doc.addPage()
          x = 15
          y = 20
        }
      })
    } else {
      // Team mode
      doc.setFontSize(16)
      doc.text("Team Master QR Codes", 15, 12)
      
      const teams = ["Ignis", "Ventus"]
      teams.forEach((team) => {
        doc.setDrawColor(200)
        doc.rect(x, y, 80, 100)
        
        const qrData = teamQrCodes[team]
        if (qrData) {
           doc.addImage(qrData, 'PNG', x + 10, y + 10, 60, 60)
        }
        
        doc.setFontSize(14)
        doc.text(`${team.toUpperCase()} TEAM`, x + 40, y + 80, { align: "center" })
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text("Scan to view full roster", x + 40, y + 90, { align: "center" })
        doc.setTextColor(0)
        
        x += 80 + margin
        if (x + 80 > 200) {
          x = 15
          y += 100 + margin
        }
      })
    }

    const title = viewMode === "individual" 
      ? (selectedTeam === "All" ? "All_Students_QR" : `Team_${selectedTeam}_QR`)
      : "Team_Master_QRs"
    doc.save(`${title}.pdf`)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">QR Code Center</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Generate & Print QR Codes</p>
          </div>
          <button onClick={() => router.push("/admin/students")} className="text-blue-600 font-bold hover:underline">
            ← Back to Students
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center print:hidden">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("individual")}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${viewMode === "individual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Individual QR Codes
            </button>
            <button 
              onClick={() => setViewMode("team")}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${viewMode === "team" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Team QR Codes
            </button>
          </div>

          {viewMode === "individual" && (
            <div className="ml-auto w-48">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Teams</SelectItem>
                  <SelectItem value="Ignis">Ignis</SelectItem>
                  <SelectItem value="Ventus">Ventus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className={`flex gap-2 ${viewMode !== "individual" ? "ml-auto" : ""}`}>
            <Button onClick={handleExportPDF} variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 print:hidden">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={() => window.print()} className="bg-slate-800 text-white font-bold print:hidden">
              Print Page
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 print:hidden">Loading QR Codes...</div>
        ) : (
          <div>
            {viewMode === "individual" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:gap-4">
                {filteredStudents.map(student => (
                  <Card key={student._id} className="overflow-hidden flex flex-col items-center p-4 border-2 shadow-sm break-inside-avoid print:shadow-none print:border-slate-300">
                    <h3 className="font-black text-lg text-slate-800 text-center uppercase tracking-tight w-full truncate" title={student.name}>{student.name}</h3>
                    <div className="flex gap-2 mt-1 mb-3">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Chest: {student.chestNo}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${student.team === "Ignis" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                        {student.team}
                      </span>
                    </div>
                    {qrCodes[student.chestNo] && (
                      <img src={qrCodes[student.chestNo]} alt={`QR for ${student.name}`} className="w-full h-auto max-w-[150px] border border-slate-100 rounded-lg" />
                    )}
                    <p className="text-[9px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">Scan to view programs</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                {["Ignis", "Ventus"].map(team => (
                  <Card key={team} className="overflow-hidden flex flex-col items-center p-8 border-2 shadow-sm break-inside-avoid print:shadow-none print:border-slate-300">
                    <h3 className={`font-black text-4xl uppercase tracking-tighter ${team === "Ignis" ? "text-amber-600" : "text-violet-600"}`}>{team} TEAM</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-6 mt-1">Complete Roster & Programs</p>
                    {teamQrCodes[team] && (
                      <img src={teamQrCodes[team]} alt={`QR for ${team}`} className="w-full h-auto max-w-[300px] border-4 border-slate-100 rounded-2xl" />
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
