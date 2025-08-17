import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const mapRef = useRef(null)
  const [markers, setMarkers] = useState([])
  const [layers, setLayers] = useState({ stg:null, county:null })
  const [info, setInfo] = useState('Fetching live listings…')

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return
      const L = (await import('leaflet')).default
      const map = L.map('map').setView([37.0965, -113.5684], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      mapRef.current = { L, map }
      await Promise.all([toggleStGeorge(true), toggleCounty(false)])
      await loadListings({})
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadListings({ min_price, max_price, beds_min, baths_min }) {
    const { L, map } = mapRef.current
    setInfo('Fetching live listings…')
    markers.forEach(m => map.removeLayer(m))
    const params = new URLSearchParams()
    if (min_price) params.set('min_price', String(min_price))
    if (max_price) params.set('max_price', String(max_price))
    if (beds_min)  params.set('beds_min',  String(beds_min))
    if (baths_min) params.set('baths_min', String(baths_min))
    const res = await fetch('/api/realtor?' + params.toString())
    const data = await res.json()
    const ms = (data.listings || []).map(l => {
      const m = L.marker([l.geo.lat, l.geo.lng]).addTo(map).bindPopup(`
        <div style="min-width:220px">
          <div style="font-weight:700;margin-bottom:4px">$${(l.price||0).toLocaleString()}</div>
          <div style="font-size:12px;opacity:.8;margin-bottom:6px">${l.beds ?? '?'} bd • ${l.baths ?? '?'} ba</div>
          ${l.photo ? `<img src="${l.photo}" style="width:100%;border-radius:8px" />` : ''}
          <div style="font-size:12px;opacity:.7;margin-top:6px">${l.address.line || ''}, ${l.address.city || ''}</div>
        </div>`)
      return m
    })
    setMarkers(ms)
    setInfo(data.source === 'live' ? `Live Realtor.com listings — ${data.count} results` : 'Could not fetch live data (check your key).')
  }

  async function toggleStGeorge(on) {
    const { L, map } = mapRef.current
    if (layers.stg) { map.removeLayer(layers.stg); setLayers(s => ({...s, stg:null})) }
    if (!on) return
    const geo = await fetch('/api/zoning/stg').then(r => r.json())
    const stgLayer = mapRef.current.L.geoJSON(geo, {
      style: f => {
        const z = (f.properties?.ZONE || f.properties?.ZONING || '').toUpperCase()
        if (z.includes('PDR-STR') || z.includes('RRST')) return { color:'#15a34a', weight:1, fillOpacity:.25 }
        return { color:'#f59e0b', weight:.7, fillOpacity:.12 }
      },
      onEachFeature: (f, lyr) => {
        const p = f.properties || {}
        lyr.bindPopup(`<b>${p.ZONE || p.ZONING || 'Zone'}</b>`)
      }
    }).addTo(map)
    setLayers(s => ({...s, stg: stgLayer}))
  }

  async function toggleCounty(on) {
    const { L, map } = mapRef.current
    if (layers.county) { map.removeLayer(layers.county); setLayers(s => ({...s, county:null})) }
    if (!on) return
    const geo = await fetch('/api/zoning/county?layer=0').then(r => r.json())
    const countyLayer = mapRef.current.L.geoJSON(geo, { style:{ color:'#3b82f6', weight:.6, fillOpacity:.10 } }).addTo(map)
    setLayers(s => ({...s, county: countyLayer}))
  }

  function handleApply() {
    const min = document.getElementById('minPrice').value
    const max = document.getElementById('maxPrice').value
    const bd  = document.getElementById('bedsMin').value
    const ba  = document.getElementById('bathsMin').value
    loadListings({
      min_price: min ? Number(min) : undefined,
      max_price: max ? Number(max) : undefined,
      beds_min:  bd  ? Number(bd)  : undefined,
      baths_min: ba  ? Number(ba)  : undefined
    })
  }
  function handleReset() {
    ['minPrice','maxPrice','bedsMin','bathsMin'].forEach(id => document.getElementById(id).value = '')
    loadListings({})
  }

  return (
    <>
      <Head>
        <title>STR Zoning + Listings — St. George, UT</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      </Head>
      <div className="banner">
        {info} — Always verify STR eligibility with city/county.{' '}
        <a className="link" href="https://www.washco.utah.gov/assessor/short-term-rental-license/" target="_blank" rel="noreferrer">County license</a> ·{' '}
        <a className="link" href="https://www.sgcity.org/municode/" target="_blank" rel="noreferrer">St. George STR code</a> ·{' '}
        <a className="link" href="https://washingtoncity.org/developmentservices/building/short-term-rentals" target="_blank" rel="noreferrer">Washington City STR</a>
      </div>

      <div id="map" style={{ width:'100vw', height:'100vh' }} />

      <div className="panel">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <strong>Search & Filters</strong>
          <span style={{fontSize:12,opacity:.7}}>St. George, UT</span>
        </div>

        <div className="row" style={{marginBottom:8}}>
          <div style={{flex:1}}>
            <div className="label">Min Price</div>
            <input id="minPrice" className="input" type="number" placeholder="300000" />
          </div>
          <div style={{flex:1}}>
            <div className="label">Max Price</div>
            <input id="maxPrice" className="input" type="number" placeholder="1000000" />
          </div>
        </div>

        <div className="row" style={{marginBottom:8}}>
          <div style={{flex:1}}>
            <div className="label">Min Beds</div>
            <input id="bedsMin" className="input" type="number" placeholder="3" />
          </div>
          <div style={{flex:1}}>
            <div className="label">Min Baths</div>
            <input id="bathsMin" className="input" type="number" placeholder="2" />
          </div>
        </div>

        <div className="row" style={{justifyContent:'space-between', marginBottom:10}}>
          <button className="btn" onClick={handleApply}>Apply</button>
          <button className="btn" onClick={handleReset}>Reset</button>
        </div>

        <div style={{borderTop:'1px solid #1e2936', margin:'10px 0'}} />

        <div className="row" style={{justifyContent:'space-between'}}>
          <label className="row" style={{gap:6}}>
            <input type="checkbox" defaultChecked onChange={e => toggleStGeorge(e.target.checked)} />
            <span>St. George Zoning</span>
          </label>
          <label className="row" style={{gap:6}}>
            <input type="checkbox" onChange={e => toggleCounty(e.target.checked)} />
            <span>Unincorporated County</span>
          </label>
        </div>
      </div>
    </>
  )
}
