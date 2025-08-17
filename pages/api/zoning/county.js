export default async function handler(req, res) {
  try {
    const layer = req.query.layer || '0'; // 0: Unincorporated
    const base = `https://agisprodvm.washco.utah.gov/arcgis/rest/services/Zoning/MapServer/${layer}/query`;
    const qs = new URLSearchParams({ where: '1=1', outFields: '*', outSR: '4326', f: 'geojson' });
    const r = await fetch(`${base}?${qs.toString()}`);
    if (!r.ok) throw new Error(await r.text());
    const geo = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(geo);
  } catch (e) {
    res.status(200).json({ type:'FeatureCollection', features:[], error:String(e) });
  }
}
