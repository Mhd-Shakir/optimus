import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, ClipboardList, Vote } from 'lucide-react';

export default function ElectionPortal() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            AGS Election Portal
          </h1>
          <p className="text-lg text-slate-600">
            Select your role to access the system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Vote className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Student Voter</CardTitle>
              <CardDescription>Cast your anonymous vote</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/election/vote" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Booth</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle>Mother Mentor</CardTitle>
              <CardDescription>Download Voter IDs</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/election/mentor" passHref>
                <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">Access Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle>Polling Officer</CardTitle>
              <CardDescription>Track live turnout</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/election/officer" passHref>
                <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">View Station</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-slate-700" />
              </div>
              <CardTitle>Election Controller</CardTitle>
              <CardDescription>Full election management</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/election/admin" passHref>
                <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">Manage</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
