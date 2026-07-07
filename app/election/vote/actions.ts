'use server';

import { validateCodeAndGetEligibility, castVote } from '@/lib/election/db';
import { supabaseAdmin } from '@/lib/supabase';

export async function verifyVoterCode(electionId: string, plainTextCode: string) {
  try {
    const result = await validateCodeAndGetEligibility(electionId, plainTextCode);
    
    // Fetch candidates for eligible positions
    const positionIds = result.eligiblePositions.map(p => p.id);
    
    if (positionIds.length === 0) {
      return { success: false, error: 'You are not eligible for any positions in this election.' };
    }

    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('election_candidates')
      .select('id, position_id, students(full_name)')
      .in('position_id', positionIds);

    if (candidatesError) {
      throw new Error('Failed to load candidates.');
    }

    return { 
      success: true, 
      eligiblePositions: result.eligiblePositions,
      candidates: candidates.map(c => ({
        id: c.id,
        position_id: c.position_id,
        name: c.students?.full_name || 'Unknown Candidate'
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitBallot(electionId: string, plainTextCode: string, ballots: { position_id: string, candidate_id: string }[]) {
  try {
    await castVote(electionId, plainTextCode, ballots);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
