import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Student from '@/lib/models/student';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const students = await req.json(); // Expects an Array of students

    // ordered: false = If one fails (duplicate), continue adding the others
    const result = await Student.insertMany(students, { ordered: false });

    return NextResponse.json({ 
      message: 'Success', 
      count: result.length 
    });

  } catch (error: any) {
    // If some fail, MongoDB returns an error but 'insertedDocs' has the successful ones
    const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
    
    return NextResponse.json({ 
      message: 'Partial Success', 
      count: inserted,
      duplicatesSkipped: true
    }, { status: 200 });
  }
}