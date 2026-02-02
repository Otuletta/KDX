import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;

    // 1. Define routes that do NOT require authentication
    const isPublicRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.startsWith("/static") ||
        request.nextUrl.pathname.endsWith(".ico") ||
        request.nextUrl.pathname.endsWith(".png") ||
        request.nextUrl.pathname.endsWith(".jpg");

    // 2. If no session and trying to access protected route -> login
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 3. Verify session validity
    if (session) {
        try {
            await decrypt(session);

            // If already logged in and visiting login -> dashboard
            if (request.nextUrl.pathname === "/login") {
                return NextResponse.redirect(new URL("/", request.url));
            }
        } catch (e) {
            // Invalid token -> login
            if (!isPublicRoute) {
                return NextResponse.redirect(new URL("/login", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
