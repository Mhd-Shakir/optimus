'use client';

import { useState, useEffect } from 'react';
import { getElections } from '../admin/actions'; // Reusing action for now
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Download, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MentorDashboard() {
  const [elections, setElections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, we'd get the logged-in mentor's ID from context/session.
  // We'll hardcode a dummy or expect it to be passed.
  // Assuming the user is logged in, and we have their mentor ID.
  const dummyMentorId = 'mentor-id-uuid-here'; 

  useEffect(() => {
    async function loadData() {
      try {
        const elec = await getElections();
        // Mentors should probably only see 'upcoming' or 'polling' elections to download cards
        setElections(elec.filter(e => e.status !== 'ended' && e.status !== 'published'));
      } catch (e) {
        toast.error('Failed to load elections');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = (electionId: string) => {
    // We redirect to the API route which generates the PDF and forces download
    // Wait, the API requires classId or mentorId. We'll pass mentorId to let the server resolve it securely.
    window.open(`/api/election/generate-ids?electionId=${electionId}&mentorId=${dummyMentorId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mother Mentor Portal</h1>
          <p className="text-slate-500">Download Voter ID cards for your assigned class.</p>
        </div>

        {isLoading ? (
          <p>Loading active elections...</p>
        ) : elections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No active elections at the moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {elections.map(election => (
              <Card key={election.id} className="border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{election.title}</CardTitle>
                  <CardDescription>Status: {election.status}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Download the secret voter codes for your students. Print and cut these cards, then distribute them securely.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded flex items-start">
                    <Users className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <p>Only students in your assigned class will be included in this document. Do not share codes.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleDownload(election.id)}>
                    <Download className="w-4 h-4 mr-2" /> Download ID Cards (PDF)
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
