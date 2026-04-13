import { NextResponse } from "next/server";
import { getDb } from "@/lib/neon";

const API_KEY = process.env.UDYAM_API_KEY;
const RESOURCE_ID = "8b68ae56-84cf-4728-a0a6-1be11028dea7";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const STATE = "TAMIL NADU";
const BATCH_SIZE = 50; // records per API call
const MAX_PER_RUN = 50; // max records per sync request

async function fetchPage(district, offset, limit) {
  const params = new URLSearchParams({
    "api-key": API_KEY,
    format: "json",
    offset: String(offset),
    limit: String(limit),
    "filters[State]": STATE,
    "filters[District]": district,
  });
  const res = await fetch(`${BASE_URL}?${params}`, { headers: { accept: "application/json" } });
  if (!res.ok) return { records: [], total: 0 };
  const data = await res.json();
  return { records: data.records || [], total: data.total || 0 };
}

async function insertRecords(sql, records) {
  if (records.length === 0) return;
  // Insert in parallel batches of 50 for speed
  const promises = records.map((r) => {
    let activities = null;
    try { activities = JSON.parse(r.Activities || "[]"); } catch { activities = []; }
    return sql`
      INSERT INTO msme_units (state, district, pincode, registration_date, enterprise_name, address, activities, lg_st_code, lg_dt_code)
      VALUES (${r.State}, ${r.District}, ${r.Pincode?.replace(".0", "") || null}, ${r.RegistrationDate}, ${r.EnterpriseName}, ${r.CommunicationAddress || null}, ${JSON.stringify(activities)}, ${r.LG_ST_Code}, ${r.LG_DT_Code})
    `;
  });
  // Run 50 at a time in parallel
  for (let i = 0; i < promises.length; i += 50) {
    await Promise.all(promises.slice(i, i + 50));
  }
}

export async function GET(req) {
  if (!API_KEY) {
    return NextResponse.json({ error: "UDYAM_API_KEY environment variable is not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");
  const startOffset = parseInt(searchParams.get("offset") ?? "0");
  const fresh = searchParams.get("fresh") === "true";

  if (!district) {
    return NextResponse.json({
      message: "Use ?district=DISTRICT_NAME&offset=0 to sync. Add &fresh=true on first call to clear old data.",
      example: "/api/cron/msme-sync?district=CHENNAI&offset=0&fresh=true",
      state: STATE,
    });
  }

  try {
    const sql = getDb();

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS msme_units (
        id SERIAL PRIMARY KEY,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        pincode TEXT,
        registration_date TEXT,
        enterprise_name TEXT NOT NULL,
        address TEXT,
        activities JSONB,
        lg_st_code TEXT,
        lg_dt_code TEXT,
        synced_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_msme_district ON msme_units (district)`;
    try { await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`; } catch {}

    // Clear old data only when explicitly requested
    if (fresh) {
      await sql`DELETE FROM msme_units WHERE district = ${district}`;
    }

    // Get current count in DB for this district
    const countResult = await sql`SELECT count(*)::int as c FROM msme_units WHERE district = ${district}`;
    const dbCount = countResult[0]?.c || 0;

    // Fetch records in batches up to MAX_PER_RUN
    let offset = startOffset;
    let inserted = 0;
    let apiTotal = 0;

    while (inserted < MAX_PER_RUN) {
      const page = await fetchPage(district, offset, BATCH_SIZE);
      apiTotal = page.total;
      if (page.records.length === 0) break;

      await insertRecords(sql, page.records);
      inserted += page.records.length;
      offset += page.records.length;
    }

    const done = offset >= apiTotal;

    // Get updated DB count
    const finalCount = await sql`SELECT count(*)::int as c FROM msme_units WHERE district = ${district}`;
    const dbTotal = finalCount[0]?.c || 0;

    return NextResponse.json({
      ok: true,
      district,
      inserted,
      offset,
      apiTotal,
      dbTotal,
      done,
      next: done ? null : `/api/msme-sync?district=${district}&offset=${offset}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
