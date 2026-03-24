import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
  const isPublic = isLoginPage || isAuthApi;

  if (isPublic) {
    if (isLoginPage && isLoggedIn) {
      return Response.redirect(new URL("/app", nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
