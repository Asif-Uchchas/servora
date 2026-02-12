import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// import NextAuth from "next-auth";
// import { authConfig } from "@/lib/auth.config";

// export default NextAuth(authConfig).auth;

export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login"],
};
