import { NextResponse } from "next/server";
import { parseReturnParams, resolveReturnDestination } from "@/lib/payments/return-handler";

async function handle(request: Request) {
  const params = await parseReturnParams(request);
  const destination = await resolveReturnDestination(
    params.pp_BillReference,
    params.pp_ResponseCode === "000"
  );
  return NextResponse.redirect(new URL(destination, request.url));
}

export const GET = handle;
export const POST = handle;
