import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";
import Student from "@/lib/models/student";

// Helper function to normalize event names
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Helper function to get grade points
const getGradePoints = (grade: string, isGroup: boolean) => {
  if (isGroup) {
    if (grade === 'A+') return 15;
    if (grade === 'A') return 10;
    if (grade === 'B') return 5;
    if (grade === 'C') return 2;
    return 0;
  } else {
    if (grade === 'A+') return 6;
    if (grade === 'A') return 5;
    if (grade === 'B') return 3;
    if (grade === 'C') return 1;
    return 0;
  }
};

// Helper function to calculate points
const getPoints = (grade: string, event: any, position: string) => {
  if (!event || !grade) return 0;

  const eventName = normalizeString(event?.name || "");

  const isGroupEvent = event.groupEvent === true ||
    eventName === "histoart" ||
    eventName === "dictionarymaking" ||
    eventName === "swarafdebate" ||
    eventName === "swarfdebate";

  const individualPointExceptions = [
    "speechtranslation",
    "dictionarymaking",
    "swarafdebate",
    "swarfdebate"
  ];

  const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);
  const gradePoints = getGradePoints(grade, useGroupPoints);

  if (useGroupPoints) {
    if (position === 'first') return 10 + gradePoints;
    if (position === 'second') return 6 + gradePoints;
    if (position === 'third') return 3 + gradePoints;
    return gradePoints;
  } else {
    if (position === 'first') return 5 + gradePoints;
    if (position === 'second') return 3 + gradePoints;
    if (position === 'third') return 1 + gradePoints;
    return gradePoints;
  }
};

export async function POST(req: Request) {
  try {
    await connectToDb();

    const body = await req.json();
    const { eventId, results } = body;

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    // Validate that at least one first place winner exists
    if (!results || !results.first || (Array.isArray(results.first) && results.first.length === 0)) {
      return NextResponse.json({ error: "First Place Winner is required" }, { status: 400 });
    }

    // Get the event to access its properties
    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Get all students to map IDs to teams
    const students = await Student.find();
    const studentMap = new Map();
    students.forEach((s: any) => {
      studentMap.set(s._id.toString(), s.team);
    });

    // Calculate team points
    const teamPoints: any = { Auris: 0, Libras: 0 };

    // Process first place winners
    if (Array.isArray(results.first)) {
      results.first.forEach((winner: any) => {
        if (winner.studentId && winner.grade) {
          const points = getPoints(winner.grade, event, 'first');
          const team = studentMap.get(winner.studentId);
          if (team && teamPoints[team] !== undefined) {
            teamPoints[team] += points;
          }
        }
      });
    }

    // Process second place winners
    if (Array.isArray(results.second)) {
      results.second.forEach((winner: any) => {
        if (winner.studentId && winner.grade) {
          const points = getPoints(winner.grade, event, 'second');
          const team = studentMap.get(winner.studentId);
          if (team && teamPoints[team] !== undefined) {
            teamPoints[team] += points;
          }
        }
      });
    }

    // Process third place winners
    if (Array.isArray(results.third)) {
      results.third.forEach((winner: any) => {
        if (winner.studentId && winner.grade) {
          const points = getPoints(winner.grade, event, 'third');
          const team = studentMap.get(winner.studentId);
          if (team && teamPoints[team] !== undefined) {
            teamPoints[team] += points;
          }
        }
      });
    }

    // Process others
    if (Array.isArray(results.others)) {
      results.others.forEach((winner: any) => {
        if (winner.studentId && winner.grade) {
          const points = getPoints(winner.grade, event, 'other');
          const team = studentMap.get(winner.studentId);
          if (team && teamPoints[team] !== undefined) {
            teamPoints[team] += points;
          }
        }
      });
    }

    // Update event with results and team points
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "completed",
        results: {
          first: results.first,
          second: results.second || [],
          third: results.third || [],
          others: results.others || []
        },
        teamPoints: teamPoints
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Updated", event: updatedEvent });

  } catch (error: any) {
    console.error("Error updating result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDb();
    const { eventId } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    // Reset to empty arrays and zero team points
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "upcoming",
        results: {
          first: [],
          second: [],
          third: [],
          others: []
        },
        teamPoints: { Auris: 0, Libras: 0 }
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Deleted", event: updatedEvent });

  } catch (error: any) {
    console.error("Error deleting result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}