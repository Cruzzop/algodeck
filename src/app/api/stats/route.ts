import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
