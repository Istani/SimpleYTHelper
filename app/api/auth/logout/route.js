import { NextResponse } from "next/server";
import { sessionCookie } from "../../../../src/web/auth/session.js";

export async function POST(request) {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/" } });
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
