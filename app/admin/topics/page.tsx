"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Event = {
  _id: string
  id: string
  name: string
  category: string
  type: "Stage" | "Non-Stage"
  status?: string
  groupEvent?: boolean
  topics?: string[]
}

export default function AdminTopicsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/events')
      
      // Filter events that have topics assigned
      const eventsWithTopics = res.data.filter((ev: Event) => 
        (ev.topics && ev.topics.length > 0) || ev.topic
      )
      
      // Fix IDs for compatibility
      const fixedEvents = eventsWithTopics.map((e: any) => ({
        ...e,
        id: e.id || e._id,
        _id: e._id || e.id
      }))
      
      setEvents(fixedEvents)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load events" })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-slate-400" /></div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Topic Selection</h1>
        <p className="text-slate-500 text-sm">Select an event to assign specific topics to participants</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed">
          <p>No events have topics assigned yet. Add topics to events in the Events page first.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="hover:shadow-md transition-all cursor-pointer group border-slate-200 relative overflow-hidden" 
              onClick={() => router.push(`/admin/topics/${event.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-bold group-hover:text-blue-600 transition-colors line-clamp-1 pr-6 flex items-center gap-2" title={event.name}>
                    {event.name}
                    {(event.status === 'completed' || event.status === 'announced') && (
                      <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                  </CardTitle>
                </div>
                <div className="flex items-center flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] shrink-0">{event.category}</Badge>
                  {event.groupEvent && <Badge variant="secondary" className="text-[9px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Group</Badge>}
                </div>
              </CardHeader>
              <CardFooter className="pt-3 text-xs text-slate-500 border-t bg-slate-50/50 rounded-b-xl flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-medium text-blue-600">
                  <FileText className="w-3.5 h-3.5" /> 
                  {event.topics?.length ? `${event.topics.length} Topics` : '1 Topic'}
                </div>
                <span className="font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider text-[10px]">Assign</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
