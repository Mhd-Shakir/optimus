'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function getTurnoutStats(electionId: string) {
  // Get all issued codes and their status
  const { data, error } = await supabaseAdmin
    .from('election_voter_codes')
    .select('status, students!inner(classes(id, title))')
    .eq('election_id', electionId);

  if (error) throw new Error(error.message);

  // Group by class
  const classStats: Record<string, { className: string, total: number, voted: number, voting: number }> = {};

  data.forEach((code: any) => {
    const classTitle = code.students?.classes?.title || 'Unknown Class';
    const classId = code.students?.classes?.id || 'unknown';

    if (!classStats[classId]) {
      classStats[classId] = { className: classTitle, total: 0, voted: 0, voting: 0 };
    }

    classStats[classId].total++;
    if (code.status === 'done') classStats[classId].voted++;
    if (code.status === 'doing') classStats[classId].voting++;
  });

  return Object.values(classStats);
}
