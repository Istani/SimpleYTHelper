import { NextResponse } from "next/server";
import { authenticate } from "../../../../src/web/auth/users.js";
import { createSessionToken, sessionCookie } from "../../../../src/web/auth/session.js";

export async function POST(request) {
  const form = await request.formData();
  const user = await authenticate(form.get("email"), form.get("password"));
  if (!user) return new NextResponse(null, { status: 303, headers: { Location: "/login?error=invalid" } });

  const response = new NextResponse(null, { status: 303, headers: { Location: "/dashboard" } });
  response.cookies.set(sessionCookie.name, await createSessionToken(user), sessionCookie.options);
  return response;
}
