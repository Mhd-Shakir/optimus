'use client';

import { useState, useEffect } from 'react';
import { 
  getElections, 
  createElection, 
  updateElectionStatus, 
  getPositions, 
  createPosition, 
  getCandidates, 
  addCandidate, 
  getLiveResults, 
  getClasses, 
  searchStudents 
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Users, LayoutList, Activity, Trophy } from 'lucide-react';

export default function AdminDashboard() {
  const [elections, setElections] = useState<any[]>([]);
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);
  
  // Data for active election
  const [electionData, setElectionData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [classes, setClasses] = useState<any[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeElectionId) {
      loadElectionDetails(activeElectionId);
    }
  }, [activeElectionId]);

  const loadInitialData = async () => {
    try {
      const [elecData, classData] = await Promise.all([getElections(), getClasses()]);
      setElections(elecData);
      setClasses(classData);
      if (elecData.length > 0) setActiveElectionId(elecData[0].id);
    } catch (e: any) {
      toast.error('Failed to load elections.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadElectionDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const elec = elections.find(e => e.id === id);
      setElectionData(elec);
      
      const [posData, candData, resData] = await Promise.all([
        getPositions(id),
        getCandidates(id),
        getLiveResults(id)
      ]);
      setPositions(posData);
      setCandidates(candData);
      setResults(resData);
    } catch (e: any) {
      toast.error('Failed to load details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = (e.target as any).title.value;
    try {
      const newElec = await createElection(title);
      setElections([newElec, ...elections]);
      setActiveElectionId(newElec.id);
      toast.success('Election created');
    } catch (e: any) {
      toast.error('Failed to create election');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateElectionStatus(activeElectionId!, status);
      setElections(elections.map(e => e.id === activeElectionId ? { ...e, status } : e));
      setElectionData({ ...electionData, status });
      toast.success(`Status updated to ${status}`);
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = (e.target as any).title.value;
    try {
      const newPos = await createPosition(activeElectionId!, title, null); // All classes by default for demo
      setPositions([...positions, newPos]);
      toast.success('Position added');
      (e.target as any).reset();
    } catch (e: any) {
      toast.error('Failed to create position');
    }
  };

  // Dummy Student search logic for adding candidate
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const handleSearch = async () => {
    const res = await searchStudents(searchQuery);
    setSearchResults(res);
  };

  const handleAddCandidate = async (studentId: string, positionId: string) => {
    try {
      await addCandidate(positionId, studentId);
      loadElectionDetails(activeElectionId!);
      toast.success('Candidate added');
      setSearchResults([]);
    } catch (e: any) {
      toast.error('Failed to add candidate');
    }
  };

  if (isLoading && elections.length === 0) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Election Controller</h1>
            <p className="text-slate-500">Manage elections, positions, and view results.</p>
          </div>
          <Select value={activeElectionId || ''} onValueChange={setActiveElectionId}>
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Select Election" />
            </SelectTrigger>
            <SelectContent>
              {elections.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!activeElectionId ? (
          <Card>
            <CardHeader><CardTitle>Create New Election</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateElection} className="flex gap-4">
                <Input name="title" placeholder="e.g. Student Council 2026-27" required />
                <Button type="submit">Create</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white border p-1 rounded-lg shadow-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Overview</TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Positions & Candidates</TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Live Results</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Election Status</CardTitle>
                    <CardDescription>Current status: <Badge variant="outline">{electionData?.status}</Badge></CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Button variant={electionData?.status === 'upcoming' ? 'default' : 'outline'} onClick={() => handleStatusChange('upcoming')}>Upcoming</Button>
                    <Button variant={electionData?.status === 'polling' ? 'default' : 'outline'} onClick={() => handleStatusChange('polling')}>Polling</Button>
                    <Button variant={electionData?.status === 'ended' ? 'default' : 'outline'} onClick={() => handleStatusChange('ended')}>Ended</Button>
                    <Button variant={electionData?.status === 'published' ? 'default' : 'outline'} onClick={() => handleStatusChange('published')}>Published</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`/api/election/generate-ids?electionId=${activeElectionId}&classId=${classes[0]?.id || ''}`, '_blank')}>
                      Generate Test ID Cards (First Class)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePosition} className="flex gap-4">
                    <Input name="title" placeholder="Position Title (e.g. Head Boy)" required />
                    <Button type="submit"><Plus className="w-4 h-4 mr-2"/> Add</Button>
                  </form>
                </CardContent>
              </Card>

              {positions.map(pos => (
                <Card key={pos.id}>
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-lg flex items-center"><Users className="w-5 h-5 mr-2 text-slate-400"/> {pos.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider">Candidates</h4>
                        <div className="space-y-3">
                          {candidates.filter(c => c.position_id === pos.id).map(cand => (
                            <div key={cand.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                              <span className="font-medium text-slate-800">{cand.students?.full_name}</span>
                            </div>
                          ))}
                          {candidates.filter(c => c.position_id === pos.id).length === 0 && (
                            <p className="text-sm text-slate-400 italic">No candidates yet.</p>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-4 text-sm text-slate-700">Add Candidate</h4>
                        <div className="flex gap-2 mb-4">
                          <Input 
                            placeholder="Search student name..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          />
                          <Button variant="secondary" onClick={handleSearch}>Search</Button>
                        </div>
                        <div className="space-y-2">
                          {searchResults.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                              <span>{student.full_name} <span className="text-xs text-slate-400">({student.classes?.title})</span></span>
                              <Button size="sm" onClick={() => handleAddCandidate(student.id, pos.id)}>Add</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500"/> Live Results</CardTitle>
                  <CardDescription>
                    Results are only visible to the Election Controller during polling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {positions.map(pos => {
                    const posCands = candidates.filter(c => c.position_id === pos.id).map(c => ({
                      ...c,
                      votes: results[c.id] || 0
                    })).sort((a, b) => b.votes - a.votes); // Sort by votes

                    const maxVotes = posCands.length > 0 ? posCands[0].votes : 0;

                    return (
                      <div key={pos.id} className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2">{pos.title}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {posCands.map((cand, idx) => (
                            <div key={cand.id} className={`p-4 rounded-xl border-2 flex flex-col justify-between ${idx === 0 && cand.votes > 0 ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 bg-white'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-lg text-slate-800 flex items-center">
                                    {idx === 0 && cand.votes > 0 && <Trophy className="w-4 h-4 mr-2 text-yellow-500" />}
                                    {cand.students?.full_name}
                                  </span>
                                  {idx > 0 && maxVotes > 0 && (
                                    <span className="text-xs text-red-500 font-medium">Lagging by {maxVotes - cand.votes}</span>
                                  )}
                                  {idx === 0 && posCands.length > 1 && cand.votes > posCands[1].votes && (
                                    <span className="text-xs text-green-600 font-medium">Leading by {cand.votes - posCands[1].votes}</span>
                                  )}
                                </div>
                                <div className="text-3xl font-black text-slate-900">{cand.votes}</div>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                  className={`h-full ${idx === 0 ? 'bg-yellow-400' : 'bg-blue-500'}`} 
                                  style={{ width: `${maxVotes > 0 ? (cand.votes / maxVotes) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
