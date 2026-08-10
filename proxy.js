import { NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const roles = ["admin", "creator", "viewer"];
function redirectTo(request, path) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return NextResponse.redirect(new URL(path, `${protocol}://${host}`));
}
export async function proxy(request) {
  const requestedArea = request.nextUrl.pathname.split("/")[1];
  const requiredRole = roles.includes(requestedArea) ? requestedArea : null;
  const token = request.cookies.get("syth_session")?.value;
  const secret = process.env.WEB_AUTH_SECRET;
  if (!token || !secret) return redirectTo(request, "/login");
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!Array.isArray(payload.roles) || payload.roles.some((role) => !roles.includes(role))) throw new Error("Invalid roles");
    if (requiredRole && !payload.roles.includes(requiredRole)) return redirectTo(request, "/dashboard");
    return NextResponse.next();
  } catch { return redirectTo(request, "/login"); }
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/creator/:path*", "/viewer/:path*", "/connections/:path*"] };
