'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Helper to fetch all elections
export async function getElections() {
  const { data, error } = await supabaseAdmin
    .from('election_settings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create new election
export async function createElection(title: string) {
  const { data, error } = await supabaseAdmin
    .from('election_settings')
    .insert({ title, status: 'upcoming' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update election status
export async function updateElectionStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from('election_settings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// Fetch positions for an election
export async function getPositions(electionId: string) {
  const { data, error } = await supabaseAdmin
    .from('election_positions')
    .select('*')
    .eq('election_id', electionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Create position
export async function createPosition(electionId: string, title: string, eligibilityClasses: string[] | null) {
  const { data, error } = await supabaseAdmin
    .from('election_positions')
    .insert({
      election_id: electionId,
      title,
      eligibility_classes: eligibilityClasses
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get all candidates with their student names
export async function getCandidates(electionId: string) {
  const { data, error } = await supabaseAdmin
    .from('election_candidates')
    .select('*, election_positions!inner(election_id), students(full_name)')
    .eq('election_positions.election_id', electionId);
  if (error) throw new Error(error.message);
  return data;
}

// Add candidate
export async function addCandidate(positionId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('election_candidates')
    .insert({ position_id: positionId, student_id: studentId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Fetch live results (Only for admin)
export async function getLiveResults(electionId: string) {
  const { data, error } = await supabaseAdmin
    .from('election_ballots')
    .select('position_id, candidate_id')
    .eq('election_id', electionId);
  
  if (error) throw new Error(error.message);
  
  // Group counts by candidate_id
  const results = data.reduce((acc: any, ballot: any) => {
    acc[ballot.candidate_id] = (acc[ballot.candidate_id] || 0) + 1;
    return acc;
  }, {});

  return results; // { candidate_id: count }
}

// Helper to fetch all classes to populate eligibility dropdowns
export async function getClasses() {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id, title')
    .order('title', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Helper to fetch students for candidate selection
export async function searchStudents(query: string) {
  if (!query) return [];
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, full_name, roll_no, classes(title)')
    .ilike('full_name', `%${query}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}
