import { NextResponse } from "next/server";
import { GET as getStats } from "@/app/api/dashboard/stats/route";
import { corsHeaders } from "../cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const res = await getStats();
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500, headers: corsHeaders });
    }
    const data = await res.json();
    
    // Only return the scores and counts, hide internal data like student scores
    return NextResponse.json({ 
        scores: data.scores,
        counts: data.counts
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
