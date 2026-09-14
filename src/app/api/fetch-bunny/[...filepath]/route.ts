import { NextResponse } from "next/server";

/* وسيط تخزين Bunny — يُبقي مفتاح التخزين على الخادم، ويخدم الشرائح
   وقوائم الدروس من الأصل نفسه فلا تحتاج CORS. */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filepath: string[] }> },
) {
  const { filepath } = await params;

  /* لا خروج من جذر التخزين */
  if (
    !filepath?.length ||
    filepath.some((seg) => !seg || seg === "." || seg === ".." || seg.includes("\\"))
  ) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const base = process.env.BUNNY_STORAGE_PULL_ZONE_URL;
  const key = process.env.BUNNY_STORAGE_API_KEY;
  if (!base || !key) {
    return NextResponse.json(
      { error: "Server misconfigured: Bunny storage missing" },
      { status: 500 },
    );
  }

  const bunnyUrl = `${base.replace(/\/+$/, "")}/${filepath.map(encodeURIComponent).join("/")}`;

  try {
    const response = await fetch(bunnyUrl, {
      headers: { AccessKey: key },
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("BunnyCDN Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
