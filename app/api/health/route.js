import { NextResponse } from "next/server";
import { webLogger } from "../../../src/web/logger.js";

export function GET() {
  webLogger.info("healthcheck_served", { route: "/api/health" });
  return NextResponse.json({ status: "ok", service: "simpleyth-web" });
}
