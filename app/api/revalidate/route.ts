import { revalidateTag, revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token !== process.env.REVALIDATE_TOKEN) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Invalidate the data cache
  revalidateTag("sheets", { expire: 0 });

  // Also purge the page cache for every route
  revalidatePath("/", "layout");

  return Response.json({ revalidated: true, timestamp: new Date().toISOString() });
}
