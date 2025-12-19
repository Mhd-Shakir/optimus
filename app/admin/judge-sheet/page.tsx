"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Search, Check, ChevronsUpDown, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// --- TYPES ---
type Student = {
  _id: string
  name: string
  chestNo: string
  team: string
  registeredEvents: { eventId: string }[]
}

type Event = {
  _id: string
  name: string
  category: string
  type: string
}

// --- SEARCHABLE SELECT COMPONENT ---
function SearchableSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt:any) => opt.label.toLowerCase().includes(search.toLowerCase()))
  const selectedLabel = options.find((opt:any) => opt.value === value)?.label

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm border rounded-lg cursor-pointer bg-white hover:border-slate-400 transition-colors shadow-sm"
      >
        <span className={value ? "text-slate-900 font-medium" : "text-slate-500"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-72 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b bg-slate-50 sticky top-0 z-10">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                type="text" 
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Type event name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-xs text-center text-slate-400 py-4">
                 {options.length === 0 ? "Loading events..." : "No matching events found"}
              </div>
            ) : (
              filteredOptions.map((opt:any) => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`px-3 py-2.5 text-sm rounded-md cursor-pointer flex items-center justify-between ${value === opt.value ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {opt.label}
                  {value === opt.value && <Check className="w-4 h-4" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function JudgeSheetPage() {
  const router = useRouter()
  
  // State
  const [events, setEvents] = useState<Event[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Fetch Data (Improved Logic)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch Events
        const eventsRes = await axios.get('/api/events')
        setEvents(eventsRes.data)
      } catch (error) {
        console.error("Error fetching events", error)
      }

      try {
        // Fetch Students (Try correct path first)
        const studentsRes = await axios.get('/api/student/list')
        setStudents(studentsRes.data)
      } catch (error) {
        console.error("Error fetching students", error)
        // Fallback if needed, though '/api/student/list' is the correct one based on your setup
        try {
             const fallbackRes = await axios.get('/api/students/list')
             setStudents(fallbackRes.data)
        } catch(e) {}
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter Participants & Sort by Chest No
  const participants = selectedEventId 
    ? students
        .filter(s => s.registeredEvents?.some((e: any) => e.eventId === selectedEventId))
        .sort((a, b) => {
            const chestA = parseInt(a.chestNo) || 0
            const chestB = parseInt(b.chestNo) || 0
            return chestA - chestB
        })
    : []

  const selectedEvent = events.find(e => e._id === selectedEventId)

  // Options for Search
  const eventOptions = events.map(e => ({ value: e._id, label: `${e.name} (${e.category})` }))

  return (
    <div className="min-h-screen bg-slate-100/50 p-6 print:bg-white print:p-0">
      
      {/* --- DASHBOARD HEADER (Hidden in Print) --- */}
      <div className="max-w-5xl mx-auto print:hidden mb-8 space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-slate-400" /> Judge Score Sheet
                </h1>
                <p className="text-slate-500 mt-1 ml-11">Generate professional score sheets for competition judges</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row items-end gap-4">
            <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-700">Select Event to Print</label>
                <SearchableSelect 
                    options={eventOptions} 
                    value={selectedEventId} 
                    onChange={setSelectedEventId} 
                    placeholder="Search and select an event..." 
                />
            </div>
            <Button 
                onClick={() => window.print()} 
                disabled={!selectedEventId}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-[42px]"
            >
                <Printer className="w-4 h-4 mr-2" /> Print Sheet
            </Button>
        </div>
      </div>

      {/* --- PRINTABLE SHEET --- */}
      {selectedEventId && (
        <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-lg print:shadow-none print:w-full print:p-0 print:m-0 min-h-[297mm]">
            
            {/* 1. SHEET HEADER */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Judging Sheet</h2>
                        <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Official Score Card</p>
                    </div>
                    <div className="text-right">
                         <div className="border-2 border-black px-4 py-2 inline-block">
                            <span className="block text-xs uppercase font-bold text-slate-500">Max Score</span>
                            <span className="block text-2xl font-black">30</span>
                         </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-8 text-left bg-slate-50 p-4 border border-slate-200 print:bg-transparent print:border-black print:p-2">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Event Name</p>
                        <p className="text-xl font-bold leading-tight">{selectedEvent?.name}</p>
                    </div>
                    <div className="border-l border-slate-300 pl-8 print:border-black">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Category</p>
                        <p className="text-xl font-bold">{selectedEvent?.category}</p>
                    </div>
                    <div className="border-l border-slate-300 pl-8 print:border-black">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Judge Name / Sig.</p>
                        <div className="border-b border-black border-dashed w-full mt-4 h-1"></div>
                    </div>
                </div>
            </div>

            {/* 2. SCORING TABLE */}
            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="bg-slate-100 print:bg-gray-100">
                        <th className="border border-black py-4 px-2 w-16 text-center font-black text-xs uppercase">Chest No</th>
                        {/* Removed (Max 10) as requested */}
                        <th className="border border-black py-4 px-2 text-center w-1/4 font-bold uppercase text-xs">
                            Criteria 1
                        </th>
                        <th className="border border-black py-4 px-2 text-center w-1/4 font-bold uppercase text-xs">
                            Criteria 2
                        </th>
                        <th className="border border-black py-4 px-2 text-center w-1/4 font-bold uppercase text-xs">
                            Criteria 3
                        </th>
                        <th className="border border-black py-4 px-2 w-20 text-center font-black text-sm uppercase bg-slate-200 print:bg-gray-200">Total</th>
                        <th className="border border-black py-4 px-2 w-32 text-center font-bold text-xs uppercase">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {participants.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                                No participants registered yet.
                            </td>
                        </tr>
                    ) : (
                        participants.map((student) => (
                            <tr key={student._id} className="h-16 print:h-14">
                                <td className="border border-black text-center text-2xl font-black font-mono">
                                    {student.chestNo}
                                </td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black bg-slate-50 print:bg-gray-50"></td>
                                <td className="border border-black"></td>
                            </tr>
                        ))
                    )}
                    {/* Empty Rows for extra entries */}
                    {[1, 2, 3].map((i) => (
                        <tr key={`empty-${i}`} className="h-16 print:h-14">
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black bg-slate-50 print:bg-gray-50"></td>
                            <td className="border border-black"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 3. FOOTER & NOTES */}
            <div className="mt-8 flex gap-8">
                <div className="flex-1 border border-black p-3 h-32">
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Judge's Remarks / Notes:</p>
                </div>
                <div className="w-1/3 flex flex-col justify-end">
                    <div className="text-center">
                        <p className="mb-8 font-bold text-sm uppercase tracking-wide">Signature</p>
                        <div className="border-b-2 border-black w-full"></div>
                    </div>
                </div>
            </div>

            {/* 4. PRINT TIMESTAMP */}
            <div className="mt-8 text-center border-t pt-2 hidden print:block">
                <p className="text-[10px] text-slate-400">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • Optimus Event Manager
                </p>
            </div>
        </div>
      )}
    </div>
  )
}