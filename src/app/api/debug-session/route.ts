import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/actions/auth";

export async function GET() {
    const session = await getCurrentSession();

    return NextResponse.json({
        message: "Session Debug Info",
        session: session,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
}
