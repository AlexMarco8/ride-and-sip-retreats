import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
}

const RouteMap = ({ points, className = "" }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);

    // Draw route line
    L.polyline(latLngs, {
      color: "hsl(35, 80%, 55%)",
      weight: 3,
      opacity: 0.8,
    }).addTo(map);

    // Add markers
    points.forEach((point, i) => {
      const isFirst = i === 0;
      const isLast = i === points.length - 1;

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: ${isFirst || isLast ? 28 : 22}px;
          height: ${isFirst || isLast ? 28 : 22}px;
          border-radius: 50%;
          background: ${isFirst ? 'hsl(142, 60%, 45%)' : isLast ? 'hsl(0, 70%, 55%)' : 'hsl(35, 80%, 55%)'};
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
        ">${i + 1}</div>`,
        iconSize: [isFirst || isLast ? 28 : 22, isFirst || isLast ? 28 : 22],
        iconAnchor: [(isFirst || isLast ? 28 : 22) / 2, (isFirst || isLast ? 28 : 22) / 2],
      });

      L.marker([point.lat, point.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${i + 1}. ${point.name}</strong>`);
    });

    // Fit bounds
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [30, 30] });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <div ref={mapRef} style={{ height: "300px", width: "100%" }} />
      <div className="bg-card/80 px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {points.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: i === 0 ? 'hsl(142,60%,45%)' : i === points.length - 1 ? 'hsl(0,70%,55%)' : 'hsl(35,80%,55%)' }}
            >{i + 1}</span>
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RouteMap;
