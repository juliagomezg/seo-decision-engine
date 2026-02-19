import { NextRequest, NextResponse } from "next/server";

/**
 * API key authentication middleware.
 * Protects all /api/* routes in production.
 * In development, auth is bypassed for frictionless local DX.
 */
export function middleware(req: NextRequest) {
  // Skip auth in development
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Should never happen — instrumentation.ts validates at startup
    return NextResponse.json(
      { ok: false, error: "Server misconfigured", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  const provided = req.headers.get("x-api-key");

  if (!provided || provided !== apiKey) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
