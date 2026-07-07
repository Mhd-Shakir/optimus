import { supabaseAdmin } from '../supabase';
import crypto from 'crypto';

// Server-only database operations for elections

/**
 * Hash the code using SHA-256 and a per-election salt
 */
export function hashVoterCode(code: string, electionId: string): string {
  // Use electionId as a deterministic salt for this code
  return crypto.createHash('sha256').update(`${electionId}-${code}`).digest('hex');
}

/**
 * Generate a random 6-character alphanumeric code
 */
export function generateRandomCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex characters
}

/**
 * Issue or retrieve a secret code for a student.
 * If the student already has a code for this election, it CANNOT be retrieved in plaintext.
 * This function should only be called once per student during PDF generation.
 */
export async function issueVoterCode(electionId: string, studentId: string): Promise<string | null> {
  // 1. Generate new code
  const plainTextCode = generateRandomCode();
  const codeHash = hashVoterCode(plainTextCode, electionId);

  // 2. Try to insert
  const { data, error } = await supabaseAdmin
    .from('election_voter_codes')
    .insert({
      election_id: electionId,
      student_id: studentId,
      code_hash: codeHash,
      status: 'issued',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique violation - already issued. 
      // We cannot return the plaintext code because we don't have it.
      return null;
    }
    throw error;
  }

  // 3. Log audit
  await supabaseAdmin.from('election_audit_logs').insert({
    election_id: electionId,
    action: 'code_issued',
    details: { student_id: studentId }
  });

  return plainTextCode;
}

/**
 * Validates a code and returns positions the user is eligible for.
 * Handles the "Doing" status.
 */
export async function validateCodeAndGetEligibility(electionId: string, plainTextCode: string) {
  const codeHash = hashVoterCode(plainTextCode, electionId);

  const { data: codeData, error: codeError } = await supabaseAdmin
    .from('election_voter_codes')
    .select('*, students(class_id)')
    .eq('election_id', electionId)
    .eq('code_hash', codeHash)
    .single();

  if (codeError || !codeData) {
    throw new Error('Invalid secret code.');
  }

  if (codeData.status === 'done') {
    throw new Error('This code has already been used to vote.');
  }

  // Check inactivity timeout (10 mins)
  if (codeData.status === 'doing') {
    const lastActiveAt = new Date(codeData.last_active_at);
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // If it's been doing for less than 10 mins, it's still active in another session
    if (lastActiveAt > tenMinsAgo) {
      throw new Error('This code is currently in use in another session. Please wait 10 minutes.');
    }
  }

  // Update status to 'doing' and refresh last_active_at
  await supabaseAdmin
    .from('election_voter_codes')
    .update({ status: 'doing', last_active_at: new Date().toISOString() })
    .eq('id', codeData.id);

  const studentClassId = codeData.students?.class_id;

  // Get eligible positions
  const { data: positions } = await supabaseAdmin
    .from('election_positions')
    .select('id, title, eligibility_classes')
    .eq('election_id', electionId);

  const eligiblePositions = (positions || []).filter(pos => {
    // If eligibility_classes is null/empty, everyone can vote
    if (!pos.eligibility_classes || pos.eligibility_classes.length === 0) return true;
    return pos.eligibility_classes.includes(studentClassId);
  });

  return {
    voterCodeId: codeData.id,
    eligiblePositions
  };
}

/**
 * Cast the vote by calling the RPC
 */
export async function castVote(electionId: string, plainTextCode: string, ballots: { position_id: string, candidate_id: string }[]) {
  const codeHash = hashVoterCode(plainTextCode, electionId);

  const { data, error } = await supabaseAdmin.rpc('cast_election_vote', {
    p_code_hash: codeHash,
    p_election_id: electionId,
    p_ballots: ballots
  });

  if (error) {
    throw error;
  }

  return true;
}
