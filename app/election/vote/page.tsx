'use client';

import { useState } from 'react';
import { verifyVoterCode, submitBallot } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VotePage() {
  const [code, setCode] = useState('');
  const [electionId, setElectionId] = useState('00000000-0000-0000-0000-000000000000'); // TODO: get from context or URL
  const [step, setStep] = useState<'auth' | 'voting' | 'success'>('auth');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [ballot, setBallot] = useState<Record<string, string>>({}); // position_id -> candidate_id
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character code.');
      return;
    }

    setIsVerifying(true);
    const res = await verifyVoterCode(electionId, code);
    setIsVerifying(false);

    if (res.success) {
      setPositions(res.eligiblePositions!);
      setCandidates(res.candidates!);
      setStep('voting');
    } else {
      setError(res.error || 'Verification failed.');
    }
  };

  const handleVote = (positionId: string, candidateId: string) => {
    setBallot(prev => ({ ...prev, [positionId]: candidateId }));
  };

  const handleSubmitBallot = async () => {
    // Check if all positions are voted for
    if (Object.keys(ballot).length !== positions.length) {
      toast.error('Please vote for all positions before submitting.');
      return;
    }

    setIsSubmitting(true);
    const ballotArray = Object.entries(ballot).map(([posId, candId]) => ({
      position_id: posId,
      candidate_id: candId
    }));

    const res = await submitBallot(electionId, code, ballotArray);
    setIsSubmitting(false);

    if (res.success) {
      setStep('success');
      toast.success('Your vote has been cast successfully!');
    } else {
      toast.error(res.error || 'Failed to submit vote. Please try again.');
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-green-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Vote Cast Successfully</CardTitle>
            <CardDescription className="text-slate-500 text-lg">
              Thank you for participating in the AGS Student Council Election. Your vote is secret and secure.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-6">
            <Button className="w-full" variant="outline" onClick={() => window.location.reload()}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
            Student Council Election
          </h1>
          <p className="text-lg text-slate-600">
            Secure, anonymous digital voting.
          </p>
        </div>

        {step === 'auth' && (
          <Card className="max-w-md mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Enter Secret Code</CardTitle>
              <CardDescription>
                Find the 6-character code on your digital ID card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Voter Code</Label>
                  <Input 
                    id="code" 
                    placeholder="e.g. A1B2C3" 
                    value={code} 
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl tracking-widest uppercase font-mono py-6"
                    maxLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 text-lg" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Start Voting'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'voting' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {positions.map(position => {
              const positionCandidates = candidates.filter(c => c.position_id === position.id);
              
              return (
                <Card key={position.id} className="shadow-md border-t-4 border-t-blue-500 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b">
                    <h3 className="text-xl font-semibold text-slate-800">{position.title}</h3>
                    <p className="text-sm text-slate-500">Select one candidate</p>
                  </div>
                  <CardContent className="p-6">
                    <RadioGroup 
                      value={ballot[position.id] || ''} 
                      onValueChange={(val) => handleVote(position.id, val)}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      {positionCandidates.map(candidate => (
                        <div key={candidate.id}>
                          <RadioGroupItem
                            value={candidate.id}
                            id={`cand-${candidate.id}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`cand-${candidate.id}`}
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 hover:border-blue-200 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                          >
                            <div className="h-16 w-16 rounded-full bg-slate-200 mb-3 overflow-hidden flex items-center justify-center text-xl font-bold text-slate-500">
                              {/* Avatar placeholder initials */}
                              {candidate.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                            </div>
                            <span className="font-semibold text-slate-900 text-center">{candidate.name}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}

            <div className="sticky bottom-6 mt-10">
              <Card className="shadow-2xl border-blue-200 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-600">
                    Selected: <span className="text-blue-600 font-bold">{Object.keys(ballot).length}</span> / {positions.length}
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleSubmitBallot}
                    disabled={isSubmitting || Object.keys(ballot).length !== positions.length}
                    className="px-8 shadow-lg shadow-blue-500/30"
                  >
                    {isSubmitting ? 'Submitting...' : 'Cast My Vote'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
