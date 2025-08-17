export default async function handler(req, res) {
  try {
    const { min_price, max_price, beds_min, baths_min, limit } = req.query;
    const url = new URL('https://realtor.p.rapidapi.com/properties/v2/list-for-sale');
    url.searchParams.set('city', 'St George');
    url.searchParams.set('state_code', 'UT');
    url.searchParams.set('sort', 'newest');
    url.searchParams.set('limit', String(limit || 50));
    if (min_price) url.searchParams.set('price_min', String(min_price));
    if (max_price) url.searchParams.set('price_max', String(max_price));
    if (beds_min)  url.searchParams.set('beds_min',  String(beds_min));
    if (baths_min) url.searchParams.set('baths_min', String(baths_min));

    const r = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'realtor.p.rapidapi.com'
      }
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(200).json({ source: 'error', status: r.status, body: text, listings: [] });
    }
    const data = await r.json();
    const listings = (data.properties || []).map(p => ({
      id: p.property_id || p.listing_id || Math.random().toString(36).slice(2),
      price: p.price ?? null,
      beds: p.beds ?? null,
      baths: p.baths ?? p.baths_full ?? null,
      photo: p.thumbnail || (p.photos && p.photos[0] && (p.photos[0].href || p.photos[0])) || null,
      address: {
        line: p.address?.line || '',
        city: p.address?.city || '',
        state: p.address?.state_code || '',
        postalCode: p.address?.postal_code || ''
      },
      geo: { lat: p.address?.lat ?? null, lng: p.address?.lon ?? null }
    })).filter(l => l.geo.lat && l.geo.lng);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ source: 'live', count: listings.length, listings });
  } catch (e) {
    res.status(200).json({ source: 'error', message: String(e), listings: [] });
  }
}
