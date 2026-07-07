'use client';

import { useState, useEffect } from 'react';
import { getElections } from '../admin/actions'; // Reuse getElections
import { getTurnoutStats } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfficerDashboard() {
  const [elections, setElections] = useState<any[]>([]);
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const elec = await getElections();
        // Officers care mostly about active polling
        const polling = elec.filter(e => e.status === 'polling' || e.status === 'published');
        setElections(polling);
        if (polling.length > 0) setActiveElectionId(polling[0].id);
      } catch (e) {
        toast.error('Failed to load elections');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (activeElectionId) {
      loadStats(activeElectionId);
      
      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        loadStats(activeElectionId, true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeElectionId]);

  const loadStats = async (id: string, silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await getTurnoutStats(id);
      setStats(data);
    } catch (e) {
      if (!silent) toast.error('Failed to load stats');
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    if (activeElectionId) {
      loadStats(activeElectionId);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading Officer Dashboard...</div>;

  const totalVoters = stats.reduce((sum, stat) => sum + stat.total, 0);
  const totalVoted = stats.reduce((sum, stat) => sum + stat.voted, 0);
  const overallPercentage = totalVoters > 0 ? (totalVoted / totalVoters) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Polling Officer Station</h1>
            <p className="text-slate-500">Monitor live voter turnout.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
        </div>

        {!activeElectionId ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No active elections found.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="col-span-full md:col-span-1 border-t-4 border-t-blue-500">
                <CardHeader>
                  <CardTitle>Overall Turnout</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="text-5xl font-black text-slate-900 mb-2">
                    {overallPercentage.toFixed(1)}%
                  </div>
                  <p className="text-slate-500 font-medium">{totalVoted} of {totalVoters} voted</p>
                  <Progress value={overallPercentage} className="h-3 w-full mt-6" />
                </CardContent>
              </Card>

              <Card className="col-span-full md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center"><Activity className="w-5 h-5 mr-2 text-slate-500"/> Turnout by Class</CardTitle>
                  <CardDescription>Live stats of voter participation per class.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {stats.sort((a,b) => (b.voted/b.total) - (a.voted/a.total)).map(stat => {
                      const percent = stat.total > 0 ? (stat.voted / stat.total) * 100 : 0;
                      return (
                        <div key={stat.className} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="font-semibold text-slate-700">{stat.className}</span>
                            <div className="text-sm">
                              <span className="font-bold text-slate-900">{stat.voted}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-slate-600">{stat.total}</span>
                              <span className="ml-2 text-blue-600 font-medium">({percent.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <Progress value={percent} className="h-2" />
                          {stat.voting > 0 && (
                            <p className="text-xs text-amber-600 italic">
                              {stat.voting} student(s) currently voting...
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
