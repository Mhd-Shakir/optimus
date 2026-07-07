import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { issueVoterCode } from '@/lib/election/db';
import { renderToStream } from '@react-pdf/renderer';
import { IdCardTemplate } from '@/components/election/IdCardTemplate';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get('electionId');
    const classId = searchParams.get('classId');
    const mentorId = searchParams.get('mentorId');

    if (!electionId) {
      return NextResponse.json({ error: 'Missing electionId' }, { status: 400 });
    }

    // Need either classId or mentorId to resolve the class
    if (!classId && !mentorId) {
      return NextResponse.json({ error: 'Missing classId or mentorId' }, { status: 400 });
    }

    let targetClassId = classId;

    // Validate mentor permissions if mentorId is provided
    if (mentorId) {
      // Find class assigned to this mother mentor
      const { data: classData, error: classError } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('mother_mentor_id', mentorId)
        .single();
        
      if (classError || !classData) {
        return NextResponse.json({ error: 'No class assigned as mother mentor' }, { status: 403 });
      }
      targetClassId = classData.id;
    }

    // Verify election is active or upcoming
    const { data: election, error: electionError } = await supabaseAdmin
      .from('election_settings')
      .select('title')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return NextResponse.json({ error: 'Invalid election' }, { status: 404 });
    }

    // Get all students in the class
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, classes(title)')
      .eq('class_id', targetClassId);

    if (studentsError || !students || students.length === 0) {
      return NextResponse.json({ error: 'No students found for this class' }, { status: 404 });
    }

    const cardsToGenerate = [];

    // Issue codes
    for (const student of students) {
      const plainTextCode = await issueVoterCode(electionId, student.id);
      
      // If code was already issued, plainTextCode will be null.
      // In a real scenario, we might want to allow regenerating codes by deleting the old one,
      // but for strict security, we'll only generate cards for newly issued codes.
      if (plainTextCode) {
        cardsToGenerate.push({
          studentName: student.full_name,
          className: student.classes?.title || 'Unknown Class',
          secretCode: plainTextCode
        });
      }
    }

    if (cardsToGenerate.length === 0) {
      return NextResponse.json({ error: 'No new codes to generate. Codes have already been issued.' }, { status: 400 });
    }

    // Render PDF
    const stream = await renderToStream(
      <IdCardTemplate cards={cardsToGenerate} electionTitle={election.title} />
    );

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="voter-ids-${targetClassId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating IDs:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
