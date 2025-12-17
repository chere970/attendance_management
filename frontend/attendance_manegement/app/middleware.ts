import { NextResponse } from "next/server";

export function middleware(req) {
  const auth = req.headers.get("authorization");
  const expectedAuth = "Basic " + btoa("secretUser:SuperStrongPassword");

  if (auth !== expectedAuth) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure App"'
      }
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
