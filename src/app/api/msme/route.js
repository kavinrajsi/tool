import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-helper";
import { getDb } from "@/lib/neon";

export async function GET(req) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district") || "";
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
  const offset = (page - 1) * limit;

  const sql = getDb();

  try {
    let rows, countResult;

    if (q) {
      rows = await sql`
        SELECT * FROM msme_units
        WHERE district = ${district} AND enterprise_name ILIKE ${"%" + q + "%"}
        ORDER BY enterprise_name
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT count(*)::int as total FROM msme_units
        WHERE district = ${district} AND enterprise_name ILIKE ${"%" + q + "%"}
      `;
    } else if (district) {
      rows = await sql`
        SELECT * FROM msme_units
        WHERE district = ${district}
        ORDER BY enterprise_name
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT count(*)::int as total FROM msme_units WHERE district = ${district}
      `;
    } else {
      rows = await sql`
        SELECT * FROM msme_units
        ORDER BY enterprise_name
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT count(*)::int as total FROM msme_units`;
    }

    const total = countResult[0]?.total || 0;

    // Get districts list
    const districts = await sql`SELECT DISTINCT district FROM msme_units ORDER BY district`;

    return NextResponse.json({
      records: rows,
      total,
      page,
      limit,
      districts: districts.map((d) => d.district),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
