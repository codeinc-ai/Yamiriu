import { NextResponse } from "next/server";
import { parseReturnParams, resolveReturnDestination } from "@/lib/payments/return-handler";

async function handle(request: Request) {
  const params = await parseReturnParams(request);
  const likelySuccess =
    params.status === "success" || params.TRAN_STATUS === "Paid" || params.TRAN_STATUS === "00";
  const destination = await resolveReturnDestination(params.BASKET_ID, likelySuccess);
  return NextResponse.redirect(new URL(destination, request.url));
}

export const GET = handle;
export const POST = handle;
