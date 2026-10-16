import { auth } from "@clerk/nextjs/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "https://admin.mediqit.com"), 307);
  }

  let html = await readFile(path.join(process.cwd(), "secure", "dashboard.html"), "utf8");
  return new Response(html.replace("</body>", '<script src="/responses-link.js"></script></body>'), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
      "x-frame-options": "DENY",
      "content-security-policy": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      "referrer-policy": "no-referrer",
    },
  });
}
