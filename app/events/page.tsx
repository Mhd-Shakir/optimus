"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

interface Event {
  _id: string;
  name: string;
  category: string;
  points: number;
  status: string;
  winner: string | null;
}

export default function EventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ name: "", category: "stage", points: 10 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch Events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  // 2. Add New Event (Admin Only)
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name) return;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        setNewEvent({ name: "", category: "stage", points: 10 }); // Reset form
        fetchEvents(); // Refresh list
        alert("Event added successfully!");
      }
    } catch (error) {
      alert("Failed to add event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Events & Competitions</h1>
          <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </button>
        </div>

        {/* ADMIN ONLY: Add Event Form */}
        {user?.role === "admin" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="px-3 py-2 border rounded-md w-64"
                  placeholder="Ex: Oppana"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={newEvent.points}
                  onChange={(e) => setNewEvent({ ...newEvent, points: Number(e.target.value) })}
                  className="px-3 py-2 border rounded-md w-24"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Event
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500">No events added yet.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{event.name}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{event.category}</span>
                    <span>Points: {event.points}</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="text-right">
                  {event.winner ? (
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      event.winner === "Auris" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      Winner: {event.winner} 🦁🦅
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}