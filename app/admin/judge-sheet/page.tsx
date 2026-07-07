"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Search, Check, ChevronsUpDown, FileText } from "lucide-react"
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
  groupEvent?: boolean // Added to check Individual/Group
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

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const eventsRes = await axios.get('/api/events')
        setEvents(eventsRes.data)
      } catch (error) { console.error("Error events", error) }

      try {
        const studentsRes = await axios.get('/api/student/list')
        setStudents(studentsRes.data)
      } catch (error) { console.error("Error students", error) } 
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  // Filter Participants
  const participants = selectedEventId 
    ? students
        .filter(s => s.registeredEvents?.some((e: any) => e.eventId === selectedEventId))
        .sort((a, b) => (parseInt(a.chestNo) || 0) - (parseInt(b.chestNo) || 0))
    : []

  const selectedEvent = events.find(e => e._id === selectedEventId)
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
                <p className="text-slate-500 mt-1 ml-11">Generate valuation sheets for judges</p>
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
                    placeholder="Search event..." 
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

      {/* --- PRINTABLE SHEET (Exact Replica of Image) --- */}
      {selectedEventId && (
        <div className="max-w-[210mm] mx-auto bg-white p-8 shadow-lg print:shadow-none print:w-full print:p-4 print:m-0 min-h-[297mm] text-black font-sans">
            
            {/* 1. HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-1/3">
                    {/* Organization Name (Placeholder) */}
                    <div className="flex items-center gap-2">
                        {/* <img src="/logo.png" className="h-10 w-10" /> Optional Logo */}
                        <div>
                            <p className="font-bold text-xs uppercase tracking-wide">Optimus Arts Fest</p>
                            <p className="text-[10px] text-gray-500">Event Management System</p>
                        </div>
                    </div>
                </div>
                <div className="w-1/3 text-center">
                    <h2 className="text-xl font-medium uppercase tracking-wide underline underline-offset-4 decoration-1">Valuation Sheet</h2>
                </div>
                <div className="w-1/3 text-right">
                    <p className="text-xs font-medium">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>

            {/* 2. EVENT DETAILS TABLE */}
            <div className="border border-black flex text-center text-sm font-bold uppercase mb-0">
                <div className="flex-1 border-r border-black py-1 px-2">{selectedEvent?.name}</div>
                <div className="w-1/4 border-r border-black py-1 px-2">{selectedEvent?.category}</div>
                <div className="w-1/4 py-1 px-2">
                    {selectedEvent?.groupEvent ? "Group" : "Individual"}
                </div>
            </div>

            {/* 3. SCORING TABLE */}
            <table className="w-full border-collapse border border-black border-t-0 text-center">
                <thead>
                    <tr className="h-10">
                        <th className="border border-black border-t-0 py-1 px-2 w-28 text-xs font-bold uppercase bg-gray-50">Code Letter</th>
                        <th className="border border-black border-t-0 py-1 px-2 text-xs font-bold uppercase" colSpan={4}>Marks</th>
                        <th className="border border-black border-t-0 py-1 px-2 w-32 text-xs font-bold uppercase bg-gray-50">Mark out of 100</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Rows for Students */}
                    {participants.map((student) => (
                        <tr key={student._id} className="h-10">
                            {/* Chest No mapped to Code Letter */}
                            <td className="border border-black text-lg font-bold font-mono bg-gray-50">
                                {student.chestNo}
                            </td>
                            {/* 4 Empty Columns for Split Marks */}
                            <td className="border border-black w-[15%]"></td>
                            <td className="border border-black w-[15%]"></td>
                            <td className="border border-black w-[15%]"></td>
                            <td className="border border-black w-[15%]"></td>
                            {/* Total Column */}
                            <td className="border border-black bg-gray-50"></td>
                        </tr>
                    ))}

                    {/* Empty Rows (Fill up to 15 rows minimum for aesthetics) */}
                    {Array.from({ length: Math.max(0, 15 - participants.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10">
                            <td className="border border-black bg-gray-50"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black bg-gray-50"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 4. FOOTER */}
            <div className="mt-16 flex justify-between items-end">
                <div className="w-1/2">
                    <p className="text-sm font-medium mb-8">Judging Comments:</p>
                </div>
                <div className="w-1/3 text-center">
                    <p className="text-sm font-medium mb-12">Judge's Name and Signature:</p>
                    <div className="border-b border-black w-full"></div>
                </div>
            </div>

            {/* Print Timestamp Footer */}
            <div className="fixed bottom-4 left-0 w-full text-center hidden print:block">
               <p className="text-[9px] text-gray-400 uppercase tracking-widest">Generated by Optimus</p>
            </div>
        </div>
      )}
    </div>
  )
}