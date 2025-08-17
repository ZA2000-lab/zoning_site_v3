# STR Zoning + Listings — St. George, UT (Next.js + Leaflet)

## Quick start
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Environment (Vercel → Project Settings → Env Vars)
- `RAPIDAPI_KEY` = your RapidAPI key
- `RAPIDAPI_HOST` = `realtor.p.rapidapi.com`

## API routes
- `/api/realtor` — live listings via Realtor.com (RapidAPI). Supports `min_price`, `max_price`, `beds_min`, `baths_min`.
- `/api/zoning/stg` — St. George zoning (ArcGIS layer 11).
- `/api/zoning/county?layer=0` — County zoning (unincorporated = layer 0).

## Notes
- Zoning coloring highlights likely STR zones (e.g., PDR-STR / RRST) in green; others amber. Always verify eligibility with city/county.
