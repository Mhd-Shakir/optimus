"use client";

import { Calendar, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

const findBestEventMatch = (evt: any, dbEvents: any[]) => {
  let bestMatch = null;
  let highestScore = 0;

  const normalizeCategory = (cat: string) => {
    if (!cat) return "";
    let c = cat.toUpperCase().replace(/[^A-Z]/g, '');
    c = c.replace('CATA', 'A').replace('CATB', 'B').replace('GENARAL', 'GENERAL');
    return c;
  };
  
  const schedCat = normalizeCategory(evt.category);
  const schedName = evt.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const e of dbEvents) {
    const dbCat = normalizeCategory(e.category);
    const dbName = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let score = 0;
    
    if (dbCat === schedCat) {
      score += 50;
    }

    if (dbName === schedName) {
      score += 100;
    } else if (dbName.includes(schedName) || schedName.includes(dbName)) {
      score += 40;
    } else {
      if (schedName.includes('handwritingenglish') && dbName.includes('handwritingeng')) score += 100;
      if (schedName.includes('hiflulmuthoon') && dbName.includes('hiflulmuthooa')) score += 100;
      if (schedName.includes('hiflulquran') && dbName.includes('hifzulquran')) score += 100;
      if (schedName.includes('imlaa') && dbName.includes('imlaa')) score += 100;
      if (schedName.includes('essaywritingmal') && (dbName === 'essaymalayalam' || dbName === 'essaywritingmal')) score += 100;
      if (schedName.includes('bookctriticism') && dbName.includes('bookcriticism')) score += 100;
      if (schedName.includes('nahvseminar') && dbName.includes('nahvuseminar')) score += 100;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = e;
    }
  }

  // Only return if name matched at least partially (score >= 40). 
  // A score of exactly 50 means only category matched, which is not enough.
  if (highestScore >= 40 && highestScore !== 50) {
    return bestMatch;
  }
  return null;
};

export default function SchedulePage() {
  const [dbEvents, setDbEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbEvents(data);
        }
      })
      .catch(console.error);
  }, []);

  const scheduleData = [
    {
      day: "Thursday",
      date: "06 August 2026",
      stages: [
        {
          name: "STAGE-4",
          events: [
            { name: "Hand Writing ENG (+1, +2)", category: "NEXUS", time: "2:30-2:50 pm" },
            { name: "Hiflul Muthooa (+1, +2)", category: "NEXUS", time: "2:55-3:15 pm" },
            { name: "Imla'a (+1, +2)", category: "NEXUS", time: "3:20-3:30 pm" },
            { name: "Caption Writing", category: "NEXUS", time: "5:00-5:05 pm" },
            { name: "Essay Malayalam", category: "NEXUS", time: "5:10-5:40 pm" },
            { name: "E-Poster", category: "COSMOS", time: "5:15-6:15 pm" },
            { name: "Arabic Vocabulary Test", category: "NEXUS", time: "5:45-5:55 pm" }
          ]
        },
        {
          name: "STAGE-5",
          events: [
            { name: "Essay Malayalam", category: "PROTONS", time: "5:00-5:30 pm" },
            { name: "Essay English", category: "PROTONS", time: "5:35-6:05 pm" },
            { name: "Caption Writing", category: "PROTONS", time: "6:05-6:10 pm" },
            { name: "Arabic Calligraphy", category: "GENARAL B", time: "9:20-10:20 pm" },
            { name: "Logo Design", category: "GENARAL B", time: "10:20-11:20 pm" }
          ]
        }
      ]
    },
    {
      day: "Friday",
      date: "07 August 2026",
      stages: [
        {
          name: "STAGE-04",
          events: [
            { name: "Translation English", category: "NEXUS", time: "6:15-6:45 am" },
            { name: "Dictionary Making", category: "NEXUS", time: "6:45-7:15 am" },
            { name: "Essay Arabic", category: "NEXUS", time: "5:15-5:45 pm" }
          ]
        },
        {
          name: "STAGE-05",
          events: [
            { name: "Bulletin", category: "COSMOS", time: "6:15-6:30 am" },
            { name: "Essay Arabic", category: "COSMOS", time: "6:30-7:00 am" },
            { name: "Story Writing Arabic", category: "COSMOS", time: "7:00-7:30 am" },
            { name: "Essay Malayalam", category: "COSMOS", time: "7:30-8:00 am" },
            { name: "Translation Arabic", category: "COSMOS", time: "8:00-8:30 am" },
            { name: "Review Malayalam", category: "COSMOS", time: "8:30-9:30 am" },
            { name: "Feature Writing", category: "COSMOS", time: "9:30-10:30 am" },
            { name: "Ihrab Writing", category: "COSMOS", time: "2:00-2:15 pm" },
            { name: "Mudhravakya Rachana", category: "COSMOS", time: "2:15-2:45 pm" },
            { name: "Book Writing Arabic", category: "COSMOS", time: "2:45-3:45 pm" },
            { name: "Book Criticism Arabic", category: "COSMOS", time: "4:45-5:15 pm" },
            { name: "Caption Writing", category: "COSMOS", time: "5:15-5:20 pm" },
            { name: "Editing Malayalam", category: "COSMOS", time: "5:20-5:35 pm" },
            { name: "Essay Urdu", category: "COSMOS", time: "5:35-6:05 pm" },
            { name: "Madh Song Writing", category: "COSMOS", time: "6:05-6:35 pm" }
          ]
        }
      ]
    },
    {
      day: "Saturday",
      date: "08 August 2026",
      stages: [
        {
          name: "STAGE-05",
          events: [
            { name: "Story Writing Malayalam", category: "COSMOS", time: "10:00-10:30 pm" },
            { name: "Story Writing English", category: "COSMOS", time: "10:30-11:00 pm" }
          ]
        }
      ]
    },
    {
      day: "Sunday",
      date: "09 August 2026",
      stages: [
        {
          name: "STAGE-04",
          events: [
            { name: "Masala Test", category: "NEXUS", time: "6:15-6:45 am" },
            { name: "Editing Malayalam", category: "NEXUS", time: "6:45-7:00 am" },
            { name: "Essay English", category: "NEXUS", time: "7:00-7:30 am" },
            { name: "Pencil Drawing", category: "NEXUS", time: "7:30-8:30 am" },
            { name: "Water Colour", category: "NEXUS", time: "9:00-10:00 am" },
            { name: "Review Malayalam", category: "NEXUS", time: "10:00-11:00 am" },
            { name: "Word's Worth", category: "NEXUS", time: "11:00-11:30 am" },
            { name: "Translation Arabic", category: "NEXUS", time: "11:30-12:00 pm" },
            { name: "Translation Malayalam", category: "NEXUS", time: "12:00-12:30 pm" },
            { name: "Poem Writing Malayalam", category: "NEXUS", time: "2:30-3:00 pm" },
            { name: "Story Writing English", category: "NEXUS", time: "3:00-3:30 pm" },
            { name: "Poem Writing English", category: "NEXUS", time: "3:30-4:00 pm" },
            { name: "Story Writing Malayalam", category: "NEXUS", time: "5:00-5:30 pm" },
            { name: "Slogan Writing", category: "NEXUS", time: "5:30-6:00 pm" },
            { name: "Spelling Bee", category: "NEXUS", time: "6:00-6:20 pm" }
          ]
        },
        {
          name: "STAGE-05",
          events: [
            { name: "Story Writing Malayalam", category: "PROTONS", time: "6:15-6:45 am" },
            { name: "Poem Writing English", category: "PROTONS", time: "6:45-7:15 am" },
            { name: "Story Writing English", category: "PROTONS", time: "7:15-7:45 am" },
            { name: "Poem Writing Malayalam", category: "PROTONS", time: "7:45-8:15 am" },
            { name: "Qaida Exposission", category: "PROTONS", time: "8:15-8:30 am" },
            { name: "Water Colour", category: "PROTONS", time: "9:00-10:00 am" },
            { name: "Pencil Drawing", category: "PROTONS", time: "10:00-11:00 am" },
            { name: "Language Game", category: "PROTONS", time: "11:00-11:15 am" },
            { name: "Handwriting (Eng)", category: "PROTONS", time: "11:20-11:40 am" },
            { name: "Imlaau", category: "PROTONS", time: "11:40-12:00 pm" },
            { name: "Pathakalari", category: "PROTONS", time: "12:00-12:15 pm" },
            { name: "Hiflul Quran", category: "NEXUS", time: "2:00-2:30 pm" },
            { name: "Hiflul Quran", category: "PROTONS", time: "2:30-3:00 pm" },
            { name: "Qira'ath", category: "PROTONS", time: "3:00-3:30 pm" },
            { name: "Spot Magazine", category: "GENERAL CAT A", time: "9:15-10:15 pm" }
          ]
        },
        {
          name: "STAGE-06",
          events: [
            { name: "Book Review English", category: 'COSMOS', time: '6:15-6:45 am' },
            { name: "Essay English", category: 'COSMOS', time: '6:45-7:15 am' },
            { name: "News Writing (English)", category: 'COSMOS', time: '7:15-7:45 am' },
            { name: "Poem Writing English", category: 'COSMOS', time: '9:00-9:30 am' },
            { name: "Translation English", category: 'COSMOS', time: '9:30-10:00 am' },
            { name: "Translation Malayalam", category: 'COSMOS', time: '10:00-10:30 am' },
            { name: "Balaga Test", category: 'COSMOS', time: '10:30-11:00 am' },
            { name: "Hiflul Muthoon", category: 'COSMOS', time: '11:00-11:30 am' },
            { name: "Paper Presentation (ENG)", category: 'COSMOS', time: '2:00-2:30 pm' },
            { name: "Sharhul Muthoon", category: 'COSMOS', time: '5:00-5:30 pm' },
            { name: "Poem Writing Arabic", category: 'COSMOS', time: '5:30-6:00 pm' },
            { name: "Social Tweet", category: 'COSMOS', time: '6:00-6:30 pm' },
            { name: "Spot Magazine", category: 'GENERAL CAT B', time: '9:50-10:50 pm' },
            { name: "Thajriba", category: 'COSMOS', time: '10:55-11:10 pm' }
          ]
        }
      ]
    },
    {
      day: "Monday",
      date: "10 August 2026",
      stages: [
        {
          name: "STAGE-04",
          events: [
            { name: "Qira'ath", category: "NEXUS", time: "5:00-5:30 pm" },
            { name: "Qira'athul Ibara", category: "COSMOS", time: "9:30-9:40 pm" },
            { name: "Qira'athul Ibara (+2, BS1)", category: "NEXUS", time: "9:40-10:00 pm" },
            { name: "Survey Tool", category: "COSMOS", time: "10:15-11:15 pm" }
          ]
        },
        {
          name: "STAGE-05",
          events: [
            { name: "Paper Presentation (+1,+2)", category: "NEXUS", time: "5:00-5:30 pm" },
            { name: "Swarf Test (8)", category: "GENERAL CAT A", time: "9:00-9:30 pm" },
            { name: "Swarf Test (9,10)", category: "GENERAL CAT A", time: "9:30-10:00 pm" }
          ]
        }
      ]
    },
    {
      day: "Tuesday",
      date: "11 August 2026",
      stages: [
        {
          name: "STAGE-04",
          events: [
            { name: "Poem Lecturing MAL", category: "COSMOS", time: "5:00-5:30 pm" },
            { name: "Poem Lecturing ENG", category: "COSMOS", time: "9:45-10:15 pm" }
          ]
        },
        {
          name: "STAGE-05",
          events: [
            { name: "Azan", category: "NEXUS", time: "5:00-5:30 pm" },
            { name: "Nahvu Test (9,10)", category: "COSMOS", time: "5:30-6:00 pm" },
            { name: "Nahv Seminar", category: "GENERAL CAT A", time: "9:30-10:00 pm" }
          ]
        }
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          Event Schedule
        </h1>
        <p className="text-slate-500 mt-2">Manage and view the official Sahityotsav event timings.</p>
      </div>

      <div className="space-y-12">
        {scheduleData.map((dayData, idx) => (
          <div key={idx} className="space-y-6">
            <div className="border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-900">{dayData.day}</h2>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">{dayData.date}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dayData.stages.map((stage, sIdx) => {
                // Determine which events are visible (not yet having code letters)
                const visibleEvents = stage.events.filter(evt => {
                  const matchedEvent = findBestEventMatch(evt, dbEvents);
                  // Hide if codes are already saved
                  if (matchedEvent && matchedEvent.hasCodeLetters) return false;
                  return true;
                });

                if (visibleEvents.length === 0) return null;

                return (
                <div key={sIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    {stage.name}
                  </h3>
                  
                  <div className="space-y-3">
                    {visibleEvents.map((evt, eIdx) => {
                      // Attempt to match event name in DB again for rendering
                      const matchedEvent = findBestEventMatch(evt, dbEvents);

                      const EventCard = (
                        <div className={`flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg border transition-colors gap-3 ${matchedEvent ? 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-200 cursor-pointer group' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex-1">
                            <p className={`font-semibold ${matchedEvent ? 'text-blue-700 group-hover:text-blue-800' : 'text-slate-800'} flex items-center gap-2`}>
                              {evt.name}
                              {matchedEvent && <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />}
                            </p>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{evt.category}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm text-slate-700">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold whitespace-nowrap">{evt.time}</span>
                          </div>
                        </div>
                      );

                      return matchedEvent ? (
                        <Link key={eIdx} href={`/admin/results/code-letters/${matchedEvent._id}`} className="block">
                          {EventCard}
                        </Link>
                      ) : (
                        <div key={eIdx}>
                          {EventCard}
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
