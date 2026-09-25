import { NextResponse } from "next/server";
import { GET as getResult } from "@/app/api/announcer/result/route";
import { corsHeaders } from "../cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const res = await getResult(req);
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status, headers: corsHeaders });
    }
    const data = await res.json();
    
    // Check if the event has actually been announced
    if (data.event?.status !== 'announced') {
        return NextResponse.json({ error: "Results for this event have not been officially announced yet." }, { status: 403, headers: corsHeaders });
    }

    // Filter out internal marker from topics if any
    const topics = (data.event?.topics || []).filter((t: string) => typeof t === 'string' && !t.startsWith('__announced_at:'));
    data.event.topics = topics;

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
