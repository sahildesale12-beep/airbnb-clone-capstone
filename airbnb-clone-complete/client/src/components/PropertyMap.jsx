import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { money } from '../utils/format';

export default function PropertyMap({ properties = [] }) {
  const points = properties.filter((p) => Number.isFinite(p.location?.lat) && Number.isFinite(p.location?.lng));
  const center = points.length ? [points[0].location.lat, points[0].location.lng] : [22.9734, 78.6569];
  return <div className="map-frame"><MapContainer center={center} zoom={5} scrollWheelZoom className="map-container"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{points.map((p) => <CircleMarker key={p._id} center={[p.location.lat, p.location.lng]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#FF385C', fillOpacity: 1 }}><Popup><div className="map-popup"><strong>{p.title}</strong><br/>{p.location.city}<br/>{money(p.price)} / night<br/><Link to={`/properties/${p._id}`}>View stay →</Link></div></Popup></CircleMarker>)}</MapContainer>{!points.length && <p className="map-empty">Map coordinates are not available for these results.</p>}</div>;
}
