import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const API_KEY = process.env.UDYAM_API_KEY;
const RESOURCE_ID = "c3dfe7e6-0cfd-4ddb-8f79-9cb3695d9866";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );
}

async function fetchAllRecords() {
  const records = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${BASE_URL}?api-key=${API_KEY}&format=json&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) break;

    const data = await res.json();
    if (!data.records || data.records.length === 0) break;

    records.push(...data.records);
    offset += limit;

    if (records.length >= data.total) break;
  }

  return records;
}

export async function GET(req) {

  try {
    const records = await fetchAllRecords();
    if (records.length === 0) {
      return NextResponse.json({ error: "No records fetched from API" }, { status: 500 });
    }

    const supabase = getSupabase();

    // Clear existing data and insert fresh
    await supabase.from("udyam_districts").delete().neq("id", 0);

    // Insert in batches of 50
    const rows = records.map((r) => ({
      state_name: r.state_name,
      state_id: r.state_id,
      district_name: r.district_name,
      lg_dt_code: r.lg_dt_code,
      micro: parseInt(r.micro) || 0,
      small: parseInt(r.small) || 0,
      medium: parseInt(r.medium) || 0,
      total: parseInt(r.total) || 0,
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from("udyam_districts").insert(batch);
      if (error) {
        return NextResponse.json({ error: error.message, batch: i }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      states: [...new Set(rows.map((r) => r.state_name))].length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
