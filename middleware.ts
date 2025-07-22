import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenValid } from "./app/lib/access-utils";
import Cookie from 'js-cookie'

export function middleware(request: NextRequest) {
  // Allow direct access to SVG files in the root directory
  if (request.nextUrl.pathname.endsWith('.svg')) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("authToken")?.value || "";

  if (
    !isTokenValid(authToken) &&
    !request.nextUrl.pathname.startsWith("/access")
  ) {
    return NextResponse.redirect(new URL("/access", request.url));
  }

  const network = request.cookies.get("network")?.value
  const isTradeurl = request.nextUrl.pathname.startsWith("/trade")
  const isFarmPage = request.nextUrl.pathname === "/trade/farm"

  if(network==="Katana" && isTradeurl && !isFarmPage){
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
