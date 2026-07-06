import { NextResponse } from "next/server";
import { parseReturnParams, resolveReturnDestination } from "@/lib/payments/return-handler";

async function handle(request: Request) {
  const params = await parseReturnParams(request);
  const likelySuccess = params.status === "Success" || params.desc === "0000";
  const destination = await resolveReturnDestination(params.orderRefNum, likelySuccess);
  return NextResponse.redirect(new URL(destination, request.url));
}

export const GET = handle;
export const POST = handle;
