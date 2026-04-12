import { NextResponse } from "next/server";
import { getDb } from "@/lib/neon";

const API_KEY = process.env.UDYAM_API_KEY;
const RESOURCE_ID = "8b68ae56-84cf-4728-a0a6-1be11028dea7";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const STATE = "TAMIL NADU";

// Fetch one page of records for a specific district
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

// Fetch all records for a district
async function fetchDistrict(district) {
  const all = [];
  let offset = 0;
  const limit = 500;

  // First call to get total
  const first = await fetchPage(district, 0, limit);
  all.push(...first.records);
  const total = first.total;

  while (all.length < total) {
    offset += limit;
    const page = await fetchPage(district, offset, limit);
    if (page.records.length === 0) break;
    all.push(...page.records);
  }

  return all;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const districtParam = searchParams.get("district");

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
    await sql`CREATE INDEX IF NOT EXISTS idx_msme_name ON msme_units USING gin (enterprise_name gin_trgm_ops)`;
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    await sql`CREATE INDEX IF NOT EXISTS idx_msme_name ON msme_units USING gin (enterprise_name gin_trgm_ops)`;

    // If specific district requested, sync only that one
    if (districtParam) {
      const records = await fetchDistrict(districtParam);
      await sql`DELETE FROM msme_units WHERE district = ${districtParam}`;

      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        for (const r of batch) {
          let activities = null;
          try { activities = JSON.parse(r.Activities || "[]"); } catch { activities = []; }
          await sql`
            INSERT INTO msme_units (state, district, pincode, registration_date, enterprise_name, address, activities, lg_st_code, lg_dt_code)
            VALUES (${r.State}, ${r.District}, ${r.Pincode?.replace(".0", "") || null}, ${r.RegistrationDate}, ${r.EnterpriseName}, ${r.CommunicationAddress || null}, ${JSON.stringify(activities)}, ${r.LG_ST_Code}, ${r.LG_DT_Code})
          `;
        }
      }

      return NextResponse.json({ ok: true, district: districtParam, records: records.length });
    }

    // Full sync: get districts list from udyam_districts in Supabase is complex,
    // so fetch distinct districts from the API itself
    // For now, return instructions to sync one district at a time
    return NextResponse.json({
      message: "Use ?district=DISTRICT_NAME to sync a specific district. Example: ?district=CHENNAI",
      state: STATE,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
