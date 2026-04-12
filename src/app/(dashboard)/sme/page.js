"use client";

import { useState, useMemo } from "react";
import { XIcon, ArrowUpDownIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DISTRICTS = [
  { name: "Chennai",         micro: 362363, small: 6405, medium: 521, tier: 1, region: "North",   industries: ["IT/ITES","Auto Components","Engineering","Electronics","Leather","Pharma","Logistics"] },
  { name: "Coimbatore",      micro: 210002, small: 2076, medium: 144, tier: 1, region: "West",    industries: ["Textiles","Pumps & Motors","Foundry","Engineering","IT/ITES","Food Processing"] },
  { name: "Madurai",         micro: 132880, small: 1003, medium: 50,  tier: 1, region: "South",   industries: ["Textiles","Food Processing","Rubber","Granite","Tourism","Healthcare"] },
  { name: "Thiruvallur",     micro: 131682, small: 904,  medium: 43,  tier: 1, region: "North",   industries: ["Auto Components","Engineering","Leather","Electronics","Logistics"] },
  { name: "Salem",           micro: 129963, small: 1050, medium: 52,  tier: 1, region: "West",    industries: ["Steel","Textiles","Sago & Tapioca","Sericulture","Agro Processing"] },
  { name: "Tiruchirappalli", micro: 107583, small: 679,  medium: 27,  tier: 1, region: "Central", industries: ["Heavy Engineering","Leather","Food Processing","Agro Processing"] },
  { name: "Tiruppur",        micro: 100920, small: 938,  medium: 27,  tier: 1, region: "West",    industries: ["Knitwear & Hosiery","Garment Export","Textiles","Dyeing & Bleaching"] },
  { name: "Kanchipuram",     micro: 100960, small: 840,  medium: 64,  tier: 1, region: "North",   industries: ["Silk Sarees","Handlooms","Auto Components","Electronics","Engineering"] },
  { name: "Cuddalore",       micro: 91415,  small: 358,  medium: 18,  tier: 2, region: "North",   industries: ["Chemicals","Sugar","Salt","Marine Products","Leather"] },
  { name: "Thanjavur",       micro: 89910,  small: 477,  medium: 17,  tier: 2, region: "Central", industries: ["Rice Mills","Tanjore Art","Musical Instruments","Sugar","Tourism"] },
  { name: "Chengalpattu",    micro: 88645,  small: 315,  medium: 6,   tier: 2, region: "North",   industries: ["Auto Components","IT/ITES","Electronics","Logistics"] },
  { name: "Erode",           micro: 86819,  small: 787,  medium: 31,  tier: 2, region: "West",    industries: ["Textiles","Turmeric & Spices","Handlooms","Sugar","Agro Processing"] },
  { name: "Dindigul",        micro: 83813,  small: 476,  medium: 11,  tier: 2, region: "South",   industries: ["Locks","Leather","Textiles","Agro Processing","Spices"] },
  { name: "Krishnagiri",     micro: 82506,  small: 525,  medium: 15,  tier: 2, region: "North",   industries: ["Fruit Processing","Silk","Granite","Poultry","Agro Processing"] },
  { name: "Vellore",         micro: 76920,  small: 444,  medium: 21,  tier: 2, region: "North",   industries: ["Leather","Footwear","Auto Components","Agro Processing"] },
  { name: "Villupuram",      micro: 75109,  small: 326,  medium: 12,  tier: 2, region: "North",   industries: ["Sugar","Rice Mills","Leather","Agro Processing"] },
  { name: "Kanniyakumari",   micro: 74387,  small: 432,  medium: 12,  tier: 2, region: "South",   industries: ["Marine Products","Rubber","Coir","Cashew","Tourism"] },
  { name: "Tirunelveli",     micro: 71603,  small: 399,  medium: 10,  tier: 2, region: "South",   industries: ["Renewable Energy","Rice Mills","Agro Processing"] },
  { name: "Tiruvannamalai",  micro: 69416,  small: 247,  medium: 16,  tier: 2, region: "North",   industries: ["Agro Processing","Rice Mills","Handlooms","Sugar","Tourism"] },
  { name: "Namakkal",        micro: 68009,  small: 674,  medium: 37,  tier: 2, region: "West",    industries: ["Poultry & Eggs","Transport","Textiles","Agro Processing"] },
  { name: "Tuticorin",       micro: 67770,  small: 441,  medium: 20,  tier: 2, region: "South",   industries: ["Salt","Marine Products","Chemicals","Port/Logistics"] },
  { name: "Dharmapuri",      micro: 65420,  small: 231,  medium: 6,   tier: 2, region: "North",   industries: ["Sericulture","Sago","Poultry","Agro Processing"] },
  { name: "Virudhunagar",    micro: 62926,  small: 361,  medium: 15,  tier: 2, region: "South",   industries: ["Fireworks & Crackers","Printing & Packaging","Safety Matches","Textiles"] },
  { name: "Pudukkottai",     micro: 56048,  small: 222,  medium: 5,   tier: 3, region: "Central", industries: ["Cement","Granite","Agro Processing","Marine Products"] },
  { name: "Theni",           micro: 50235,  small: 272,  medium: 7,   tier: 3, region: "South",   industries: ["Spices","Cotton Mills","Agro Processing","Tourism"] },
  { name: "Sivaganga",       micro: 45018,  small: 180,  medium: 7,   tier: 3, region: "South",   industries: ["Cement","Agro Processing","Handlooms","Tourism"] },
  { name: "Thiruvarur",      micro: 43456,  small: 154,  medium: 1,   tier: 3, region: "Central", industries: ["Rice Mills","Bronze Casting","Agro Processing"] },
  { name: "Ramanathapuram",  micro: 41414,  small: 163,  medium: 5,   tier: 3, region: "South",   industries: ["Marine Products","Salt","Agro Processing"] },
  { name: "Tenkasi",         micro: 38291,  small: 131,  medium: 1,   tier: 3, region: "South",   industries: ["Agro Processing","Spices","Rice Mills"] },
  { name: "Tirupathur",      micro: 36906,  small: 80,   medium: 1,   tier: 3, region: "North",   industries: ["Leather","Agro Processing","Poultry"] },
  { name: "Karur",           micro: 34504,  small: 222,  medium: 8,   tier: 3, region: "Central", industries: ["Home Textiles","Textiles","Bus Body Building"] },
  { name: "Ranipet",         micro: 33821,  small: 110,  medium: 4,   tier: 3, region: "North",   industries: ["Leather","Heavy Engineering","Chemicals","Ceramics"] },
  { name: "Kallakurichi",    micro: 30238,  small: 98,   medium: 2,   tier: 3, region: "North",   industries: ["Agro Processing","Rice Mills","Handlooms"] },
  { name: "Nagapattinam",    micro: 29968,  small: 107,  medium: 0,   tier: 3, region: "Central", industries: ["Marine Products","Chemicals","Salt","Rice Mills"] },
  { name: "Mayiladuthurai",  micro: 28360,  small: 70,   medium: 1,   tier: 3, region: "Central", industries: ["Rice Mills","Agro Processing","Tourism"] },
  { name: "The Nilgiris",    micro: 26739,  small: 91,   medium: 6,   tier: 3, region: "West",    industries: ["Tea & Coffee","Essential Oils","Tourism","Spices"] },
  { name: "Ariyalur",        micro: 25037,  small: 110,  medium: 5,   tier: 3, region: "Central", industries: ["Cement","Limestone","Agro Processing"] },
  { name: "Perambalur",      micro: 17519,  small: 113,  medium: 3,   tier: 3, region: "Central", industries: ["Agro Processing","Rice Mills","Dairy"] },
];

const SM = {
  "Textiles":             { s: ["eCommerce SEO","International SEO","Shopify Store","Instagram SMO","GEO"],  i: "🧵" },
  "Knitwear & Hosiery":   { s: ["International SEO","B2B Website","LinkedIn SMO","GEO"],                    i: "👕" },
  "Garment Export":       { s: ["International SEO","B2B Website","GEO","LinkedIn SMO"],                    i: "📦" },
  "Home Textiles":        { s: ["eCommerce SEO","International SEO","Shopify Store","GEO"],                 i: "🛏️" },
  "Leather":              { s: ["International SEO","B2B Website","GEO","LinkedIn SMO"],                    i: "👞" },
  "Footwear":             { s: ["eCommerce SEO","Shopify Store","Instagram SMO","Local SEO"],               i: "👟" },
  "Auto Components":      { s: ["B2B SEO","LinkedIn SMO","B2B Website","GEO"],                              i: "⚙️" },
  "IT/ITES":              { s: ["Technical SEO","LinkedIn SMO","GEO","Content SEO"],                        i: "💻" },
  "Food Processing":      { s: ["Local SEO","eCommerce SEO","Instagram SMO","Google Business"],             i: "🍱" },
  "Chemicals":            { s: ["B2B SEO","B2B Website","LinkedIn SMO","GEO"],                              i: "🧪" },
  "Pharma":               { s: ["B2B SEO","Content SEO","LinkedIn SMO","GEO"],                              i: "💊" },
  "Marine Products":      { s: ["International SEO","B2B Website","GEO"],                                   i: "🐟" },
  "Tourism":              { s: ["Local SEO","Google Business","Instagram SMO","Content SEO"],               i: "🏛️" },
  "Healthcare":           { s: ["Local SEO","Google Business","Content SEO","SMO"],                         i: "🏥" },
  "Electronics":          { s: ["B2B SEO","LinkedIn SMO","Technical SEO","GEO"],                            i: "📱" },
  "Engineering":          { s: ["B2B SEO","LinkedIn SMO","B2B Website","GEO"],                              i: "🔧" },
  "Heavy Engineering":    { s: ["B2B SEO","LinkedIn SMO","B2B Website","GEO"],                              i: "🏗️" },
  "Silk Sarees":          { s: ["eCommerce SEO","Shopify Store","Instagram SMO","GEO"],                     i: "👗" },
  "Handlooms":            { s: ["eCommerce SEO","Shopify Store","Instagram SMO","Local SEO"],               i: "🪡" },
  "Spices":               { s: ["eCommerce SEO","International SEO","Shopify Store","GEO"],                 i: "🌶️" },
  "Poultry & Eggs":       { s: ["B2B SEO","B2B Website","Local SEO"],                                       i: "🥚" },
  "Poultry":              { s: ["B2B SEO","B2B Website","Local SEO"],                                       i: "🐔" },
  "Sugar":                { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🍬" },
  "Agro Processing":      { s: ["Local SEO","B2B Website","eCommerce SEO"],                                 i: "🌾" },
  "Cement":               { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🧱" },
  "Granite":              { s: ["International SEO","B2B Website","GEO"],                                   i: "🪨" },
  "Fireworks & Crackers": { s: ["eCommerce SEO","Shopify Store","Instagram SMO","Local SEO"],               i: "🎆" },
  "Printing & Packaging": { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🖨️" },
  "Tea & Coffee":         { s: ["eCommerce SEO","Shopify Store","Instagram SMO","GEO"],                     i: "☕" },
  "Pumps & Motors":       { s: ["B2B SEO","B2B Website","LinkedIn SMO","GEO"],                              i: "🔩" },
  "Foundry":              { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🔥" },
  "Logistics":            { s: ["B2B SEO","LinkedIn SMO","Local SEO"],                                      i: "🚛" },
  "Renewable Energy":     { s: ["B2B SEO","LinkedIn SMO","Content SEO","GEO"],                              i: "⚡" },
  "Coir":                 { s: ["eCommerce SEO","International SEO","B2B Website"],                         i: "🌴" },
  "Salt":                 { s: ["B2B SEO","B2B Website","International SEO"],                               i: "🧂" },
  "Rubber":               { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🛞" },
  "Locks":                { s: ["eCommerce SEO","B2B SEO","Shopify Store"],                                  i: "🔒" },
  "Tanjore Art":          { s: ["eCommerce SEO","Shopify Store","Instagram SMO","GEO"],                     i: "🎨" },
  "Sericulture":          { s: ["eCommerce SEO","B2B Website","Local SEO"],                                 i: "🦋" },
  "Rice Mills":           { s: ["B2B SEO","B2B Website","Local SEO"],                                       i: "🍚" },
  "Dyeing & Bleaching":   { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🎨" },
  "Sago & Tapioca":       { s: ["B2B SEO","B2B Website","International SEO"],                               i: "🫘" },
  "Sago":                 { s: ["B2B SEO","B2B Website","International SEO"],                               i: "🫘" },
  "Steel":                { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🏭" },
  "Cashew":               { s: ["eCommerce SEO","Shopify Store","International SEO"],                       i: "🥜" },
  "Safety Matches":       { s: ["B2B SEO","B2B Website"],                                                   i: "🔥" },
  "Fruit Processing":     { s: ["eCommerce SEO","Shopify Store","Local SEO","GEO"],                         i: "🥭" },
  "Silk":                 { s: ["eCommerce SEO","Shopify Store","Instagram SMO"],                           i: "🧶" },
  "Turmeric & Spices":    { s: ["eCommerce SEO","International SEO","Shopify Store","GEO"],                 i: "🌿" },
  "Ceramics":             { s: ["eCommerce SEO","B2B Website","Local SEO"],                                 i: "🏺" },
  "Bronze Casting":       { s: ["eCommerce SEO","Shopify Store","Instagram SMO"],                           i: "🔔" },
  "Essential Oils":       { s: ["eCommerce SEO","Shopify Store","Instagram SMO","GEO"],                     i: "🌸" },
  "Bus Body Building":    { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🚌" },
  "Musical Instruments":  { s: ["eCommerce SEO","Shopify Store","Instagram SMO"],                           i: "🎵" },
  "Transport":            { s: ["B2B SEO","Local SEO","Google Business"],                                   i: "🚚" },
  "Dairy":                { s: ["Local SEO","Google Business","Instagram SMO"],                             i: "🥛" },
  "Limestone":            { s: ["B2B SEO","B2B Website"],                                                   i: "🪨" },
  "Cotton Mills":         { s: ["B2B SEO","B2B Website","LinkedIn SMO"],                                    i: "🏭" },
  "Port/Logistics":       { s: ["B2B SEO","LinkedIn SMO","B2B Website"],                                    i: "🚢" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return n.toLocaleString("en-IN"); }

function tierClass(t) {
  if (t === 1) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
  if (t === 2) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
}

function srvClass(s) {
  if (s.includes("SEO"))     return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  if (s.includes("SMO") || s.includes("LinkedIn") || s.includes("Instagram"))
                              return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
  if (s.includes("GEO"))     return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  if (s.includes("Shopify")) return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

function pitchTip(d) {
  if (d.tier === 1)
    return `${d.name} has the highest digital readiness. Lead with full SEO + GEO + SMO packages. These businesses understand digital value — focus on ROI and competitor gaps.`;
  if (d.tier === 2)
    return `${d.name} has strong potential. Start with a website audit or Google Business setup as a foot-in-the-door service, then upsell to monthly SEO packages.`;
  return `${d.name} is an emerging market. Offer affordable one-time services (website build, Google Business Profile) first. Build trust, then propose ongoing SEO.`;
}

function Stars({ tier }) {
  const n = tier === 1 ? 5 : tier === 2 ? 4 : 3;
  return (
    <span className="text-amber-600 dark:text-amber-400" style={{ letterSpacing: -1 }}>
      {"★".repeat(n)}
      <span className="opacity-15">{"★".repeat(5 - n)}</span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SMEPage() {
  const [viewMode,      setViewMode]      = useState("table");
  const [selected,      setSelected]      = useState(null);
  const [search,        setSearch]        = useState("");
  const [tierFilter,    setTierFilter]    = useState("All");
  const [regionFilter,  setRegionFilter]  = useState("All");
  const [industryFilter,setIndustryFilter]= useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [sortCol,       setSortCol]       = useState("total");
  const [sortDir,       setSortDir]       = useState("desc");

  const allIndustries = useMemo(() => [...new Set(DISTRICTS.flatMap(d => d.industries))].sort(), []);
  const allServices   = useMemo(() => [...new Set(Object.values(SM).flatMap(s => s.s))].sort(), []);

  const filtered = useMemo(() => {
    let r = DISTRICTS.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter   !== "All" && d.tier   !== parseInt(tierFilter))    return false;
      if (regionFilter !== "All" && d.region !== regionFilter)            return false;
      if (industryFilter !== "All" && !d.industries.includes(industryFilter)) return false;
      if (serviceFilter  !== "All") return d.industries.some(ind => SM[ind]?.s?.includes(serviceFilter));
      return true;
    });
    return r;
  }, [search, tierFilter, regionFilter, industryFilter, serviceFilter]);

  const sorted = useMemo(() => {
    const r = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      if (sortCol === "name")   return dir * a.name.localeCompare(b.name);
      if (sortCol === "micro")  return dir * (a.micro  - b.micro);
      if (sortCol === "small")  return dir * (a.small  - b.small);
      if (sortCol === "medium") return dir * (a.medium - b.medium);
      // total
      return dir * ((a.micro + a.small + a.medium) - (b.micro + b.small + b.medium));
    });
    return r;
  }, [filtered, sortCol, sortDir]);

  function toggle(name) { setSelected(s => s === name ? null : name); }

  function resetFilters() {
    setSearch(""); setTierFilter("All"); setRegionFilter("All");
    setIndustryFilter("All"); setServiceFilter("All");
    setSortCol("total"); setSortDir("desc");
    setSelected(null);
  }

  const tM  = filtered.reduce((s, d) => s + d.micro,  0);
  const tS  = filtered.reduce((s, d) => s + d.small,  0);
  const tMd = filtered.reduce((s, d) => s + d.medium, 0);
  const tA  = tM + tS + tMd;
  const sel = selected ? DISTRICTS.find(d => d.name === selected) : null;

  const selectCls = "w-full px-2.5 py-2 bg-background border border-border rounded-lg text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/60";

  return (
    <div className="flex flex-1 flex-col gap-0 py-4">
      <style>{`
        .sme-table { width:100%; border-collapse:collapse; font-size:13px; }
        .sme-table thead tr { background:hsl(var(--muted)); }
        .sme-table th { padding:10px 12px; font-weight:600; color:hsl(var(--muted-foreground)); font-size:11px;
          text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid hsl(var(--border)); white-space:nowrap; }
        .sme-table td { padding:10px 12px; }
        .sme-table .tr-r { text-align:right; }
        .sme-table tbody tr { cursor:pointer; transition:background 0.15s; border-left:3px solid transparent; }
        .sme-table tbody tr:hover { background:hsl(var(--accent)) !important; }
        .sme-table tbody tr.row-sel { background:hsl(var(--accent)) !important; border-left-color:#60a5fa; }

      `}</style>

      {/* ── Header ── */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <h1 className="text-xl font-semibold tracking-tight">SME Explorer</h1>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-5">
        {[
          { label:"Showing Districts", value:filtered.length,  color:"text-blue-700 dark:text-blue-400", sub:"of 38" },
          { label:"Total SMEs",        value:fmt(tA),          color:"text-violet-700 dark:text-violet-400", sub:"filtered" },
          { label:"Micro",             value:fmt(tM),          color:"text-emerald-700 dark:text-emerald-400", sub: tA > 0 ? ((tM/tA)*100).toFixed(1)+"%" : "0%" },
          { label:"Small",             value:fmt(tS),          color:"text-amber-700 dark:text-amber-400", sub: tA > 0 ? ((tS/tA)*100).toFixed(1)+"%" : "0%" },
          { label:"Medium",            value:fmt(tMd),         color:"text-pink-700 dark:text-pink-400", sub: tA > 0 ? ((tMd/tA)*100).toFixed(1)+"%" : "0%" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">{c.label}</div>
            <div className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border border-border bg-card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-muted-foreground">🔍 Filters</span>
          <button onClick={resetFilters} className="text-[11px] px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Reset All
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1 font-medium">Search District</label>
            <input className={selectCls} value={search} onChange={e => setSearch(e.target.value)} placeholder="Type district name..." />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1 font-medium">Opportunity Tier</label>
            <select className={selectCls} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="All">All Tiers</option>
              <option value="1">Tier 1 — Highest</option>
              <option value="2">Tier 2 — Strong</option>
              <option value="3">Tier 3 — Moderate</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1 font-medium">Region</label>
            <select className={selectCls} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="All">All Regions</option>
              <option value="North">North TN</option>
              <option value="West">West TN</option>
              <option value="Central">Central TN</option>
              <option value="South">South TN</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1 font-medium">Industry</label>
            <select className={selectCls} value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
              <option value="All">All Industries</option>
              {allIndustries.map(ind => <option key={ind} value={ind}>{SM[ind]?.i || "📍"} {ind}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1 font-medium">Service Needed</label>
            <select className={selectCls} value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
              <option value="All">All Services</option>
              {allServices.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── View Toggle ── */}
      <div className="flex gap-2 mb-4">
        {[["table","📋 Table View"],["cards","🃏 Card View"]].map(([mode, label]) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              viewMode === mode
                ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <div>
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="sme-table">
              <thead>
                <tr>
                  <th>#</th>
                  {[
                    { col: "name",   label: "District", cls: "" },
                    { col: "micro",  label: "Micro",    cls: "tr-r" },
                    { col: "small",  label: "Small",    cls: "tr-r" },
                    { col: "medium", label: "Medium",   cls: "tr-r" },
                    { col: "total",  label: "Total",    cls: "tr-r" },
                  ].map(({ col, label, cls }) => (
                    <th key={col} className={cls}>
                      <button
                        onClick={() => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir(col === "name" || col === "rating" ? "asc" : "desc"); } }}
                        className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors w-full"
                        style={{ justifyContent: cls === "tr-r" ? "flex-end" : "flex-start" }}
                      >
                        {label}
                        {sortCol === col
                          ? sortDir === "asc"
                            ? <ChevronUpIcon size={11} className="text-primary shrink-0" />
                            : <ChevronDownIcon size={11} className="text-primary shrink-0" />
                          : <ArrowUpDownIcon size={11} className="text-muted-foreground/40 shrink-0" />
                        }
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => {
                  const total = d.micro + d.small + d.medium;
                  const isSel = selected === d.name;
                  return (
                    <tr key={d.name}
                      className={`${isSel ? "row-sel" : ""} ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                      onClick={() => toggle(d.name)}>
                      <td className="text-muted-foreground text-[11px] font-mono">{i+1}</td>
                      <td className="font-semibold whitespace-nowrap">
                        {d.name}
                        <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-semibold ${tierClass(d.tier)}`}>T{d.tier}</span>
                      </td>
                      <td className="tr-r text-emerald-700 dark:text-emerald-400 text-xs font-mono">{fmt(d.micro)}</td>
                      <td className="tr-r text-amber-700 dark:text-amber-400 text-xs font-mono">{fmt(d.small)}</td>
                      <td className="tr-r text-pink-700 dark:text-pink-400 text-xs font-mono">{fmt(d.medium)}</td>
                      <td className="tr-r font-bold text-[13px] font-mono">{fmt(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3">
            {filtered.map(d => {
              const total = d.micro + d.small + d.medium;
              const isSel = selected === d.name;
              return (
                <div key={d.name} onClick={() => toggle(d.name)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSel ? "bg-accent border-blue-500" : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[15px]">{d.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${tierClass(d.tier)}`}>Tier {d.tier}</span>
                  </div>
                  <div className="font-mono text-xl font-bold mb-2">{fmt(total)}</div>
                  <div className="flex gap-3 mb-3 text-[11px] text-muted-foreground">
                    <span><span className="text-emerald-700 dark:text-emerald-400">●</span> {fmt(d.micro)}</span>
                    <span><span className="text-amber-700 dark:text-amber-400">●</span> {fmt(d.small)}</span>
                    <span><span className="text-pink-700 dark:text-pink-400">●</span> {fmt(d.medium)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.industries.slice(0, 4).map(ind => (
                      <span key={ind} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                        {SM[ind]?.i || "📍"} {ind}
                      </span>
                    ))}
                    {d.industries.length > 4 && (
                      <span className="text-[10px] text-muted-foreground px-1">+{d.industries.length - 4}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── District Drawer ── */}
      {sel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

            <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-semibold mb-1.5">{sel.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${tierClass(sel.tier)}`}>
                    Tier {sel.tier}
                  </span>
                  <span className="text-xs text-muted-foreground">{sel.region} Tamil Nadu</span>
                  <Stars tier={sel.tier} />
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Total",  val: sel.micro + sel.small + sel.medium, cls: "text-foreground" },
                  { label: "Micro",  val: sel.micro,                          cls: "text-emerald-700 dark:text-emerald-400" },
                  { label: "Small",  val: sel.small,                          cls: "text-amber-700 dark:text-amber-400"   },
                  { label: "Medium", val: sel.medium,                         cls: "text-pink-700 dark:text-pink-400"    },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">{label}</p>
                    <p className={`text-sm font-bold font-mono ${cls}`}>{fmt(val)}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-3">
                  Industries & Recommended Services
                </p>
                <div className="space-y-2">
                  {sel.industries.map(ind => {
                    const m = SM[ind];
                    return (
                      <div key={ind} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                        <p className="text-sm font-semibold mb-2">{m?.i || "📍"} {ind}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m?.s?.map(srv => (
                            <span key={srv} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${srvClass(srv)}`}>
                              {srv}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 mb-2">💡 Pitch Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{pitchTip(sel)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div className="mt-6 pt-4 border-t border-border text-center text-muted-foreground text-[11px] leading-relaxed">
        Data Source: SME-DFO Chennai Annual Report 2023–24 (Udyam Registration) · Tamil Nadu — SEO/SMO/GEO Service Planning
      </div>
    </div>
  );
}
