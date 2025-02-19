import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function middleware(req: NextRequest) {
  const pb = new PocketBase("http://127.0.0.1:8090");

  // Load auth state from cookies
  pb.authStore.loadFromCookie(req.cookies.toString());
  const user = pb.authStore.model;

  // Redirect to home page if not logged in
  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { pathname } = req.nextUrl;

  // Only professors can access "/generate"
  if (pathname.startsWith("/generate") && user.role !== "professor") {
    return NextResponse.redirect(new URL("/student", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/generate", "/student"], // Apply middleware to these routes
};
