import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Student from '@/lib/models/student';

// GET: Fetch all students
export async function GET() {
  await connectToDatabase();
  const students = await Student.find({}).sort({ createdAt: -1 });
  return NextResponse.json(students);
}

// DELETE: Remove a student by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    await Student.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

// POST: Add Single Student
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Try to create the student
    const newStudent = await Student.create(body);
    return NextResponse.json(newStudent, { status: 201 });

  } catch (error: any) {
    // Check for Duplicate Key Error (MongoDB Code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // e.g., 'chestNo' or 'admissionNo'
      return NextResponse.json(
        { error: `Duplicate detected! This ${field} already exists.` }, 
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}