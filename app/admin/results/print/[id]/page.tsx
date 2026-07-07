"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export default function PrintResultPage() {
  const params = useParams()
  const [event, setEvent] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/student/list')
      ])
      
      const foundEvent = eventsRes.data.find((e: any) => e._id === params.id)
      setEvent(foundEvent)
      setStudents(studentsRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStudentName = (id: string) => {
    const s = students.find(std => std._id === id)
    return s ? `${s.name} (${s.team})` : "Unknown"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400">Event not found</p>
      </div>
    )
  }

  const isGroup = event.groupEvent || 
                  normalizeString(event.name) === "histoart" || 
                  normalizeString(event.name) === "dictionarymaking" || 
                  normalizeString(event.name) === "swarafdebate" || 
                  normalizeString(event.name) === "swarfdebate";

  return (
    <>
      <div className="min-h-screen bg-white p-12 print:p-8">
        {/* Header */}
        <div className="text-center border-b-4 border-slate-900 pb-8 mb-8">
          <h1 className="text-5xl font-black text-slate-900 mb-4">{event.name}</h1>
          <div className="text-xl font-semibold text-slate-600">
            Category: {event.category} | Type: {isGroup ? "Group Event" : "Individual Event"}
          </div>
        </div>

        {/* Print Button */}
        <div className="mb-8 text-center print:hidden">
          <Button 
            onClick={() => window.print()} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg"
          >
            <Printer className="w-5 h-5 mr-3" />
            Print Result Sheet
          </Button>
        </div>

        {/* Results Table */}
        <Table className="border-4 border-slate-900">
          <TableHeader>
            <TableRow className="bg-slate-900">
              <TableHead className="border-r-2 border-white text-white font-bold text-lg py-4 text-center w-16">SI</TableHead>
              <TableHead className="border-r-2 border-white text-white font-bold text-lg py-4">Name</TableHead>
              <TableHead className="border-r-2 border-white text-white font-bold text-lg py-4">Team</TableHead>
              <TableHead className="border-r-2 border-white text-white font-bold text-lg py-4">Mark</TableHead>
              <TableHead className="border-r-2 border-white text-white font-bold text-lg py-4">Position</TableHead>
              <TableHead className="text-white font-bold text-lg py-4">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* First Place */}
            {event.results?.first && (
              <TableRow className="border-b-2 border-slate-900">
                <TableCell className="border-r-2 border-slate-900 text-center font-bold text-lg py-6">1</TableCell>
                <TableCell className="border-r-2 border-slate-900 font-bold text-lg py-6">
                  {getStudentName(event.results.first).split(' (')[0]}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {getStudentName(event.results.first).split(' (')[1]?.replace(')', '')}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {event.results.firstMark || '-'}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 py-6">
                  <span className="inline-block bg-yellow-100 text-yellow-900 px-4 py-2 rounded-lg font-bold text-base border-2 border-yellow-400">
                    🥇 1st Place
                  </span>
                </TableCell>
                <TableCell className="font-black text-2xl text-yellow-700 py-6">
                  {event.results.firstGrade}
                </TableCell>
              </TableRow>
            )}

            {/* Second Place */}
            {event.results?.second && (
              <TableRow className="border-b-2 border-slate-900">
                <TableCell className="border-r-2 border-slate-900 text-center font-bold text-lg py-6">2</TableCell>
                <TableCell className="border-r-2 border-slate-900 font-bold text-lg py-6">
                  {getStudentName(event.results.second).split(' (')[0]}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {getStudentName(event.results.second).split(' (')[1]?.replace(')', '')}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {event.results.secondMark || '-'}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 py-6">
                  <span className="inline-block bg-slate-100 text-slate-900 px-4 py-2 rounded-lg font-bold text-base border-2 border-slate-400">
                    🥈 2nd Place
                  </span>
                </TableCell>
                <TableCell className="font-black text-2xl text-slate-700 py-6">
                  {event.results.secondGrade}
                </TableCell>
              </TableRow>
            )}

            {/* Third Place */}
            {event.results?.third && (
              <TableRow className="border-b-2 border-slate-900">
                <TableCell className="border-r-2 border-slate-900 text-center font-bold text-lg py-6">3</TableCell>
                <TableCell className="border-r-2 border-slate-900 font-bold text-lg py-6">
                  {getStudentName(event.results.third).split(' (')[0]}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {getStudentName(event.results.third).split(' (')[1]?.replace(')', '')}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {event.results.thirdMark || '-'}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 py-6">
                  <span className="inline-block bg-amber-100 text-amber-900 px-4 py-2 rounded-lg font-bold text-base border-2 border-amber-400">
                    🥉 3rd Place
                  </span>
                </TableCell>
                <TableCell className="font-black text-2xl text-amber-700 py-6">
                  {event.results.thirdGrade}
                </TableCell>
              </TableRow>
            )}

            {/* Other Positions */}
            {event.results?.others && event.results.others.map((other: any, idx: number) => (
              <TableRow key={idx} className="border-b-2 border-slate-900">
                <TableCell className="border-r-2 border-slate-900 text-center font-bold text-lg py-6">
                  {idx + 4}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 font-bold text-lg py-6">
                  {getStudentName(other.studentId).split(' (')[0]}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {getStudentName(other.studentId).split(' (')[1]?.replace(')', '')}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 text-lg py-6">
                  {other.mark || '-'}
                </TableCell>
                <TableCell className="border-r-2 border-slate-900 py-6">
                  <span className="inline-block bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-bold text-base border-2 border-blue-400">
                    {idx + 4}th Place
                  </span>
                </TableCell>
                <TableCell className="font-black text-2xl text-blue-700 py-6">
                  {other.grade}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-slate-300 text-center text-slate-500">
          <p className="text-sm">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          table { 
            page-break-inside: auto;
          }
          
          tr { 
            page-break-inside: avoid; 
            page-break-after: auto;
          }
          
          thead { 
            display: table-header-group;
          }
          
          @page { 
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </>
  )
}