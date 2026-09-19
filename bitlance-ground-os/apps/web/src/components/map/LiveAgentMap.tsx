import { useEffect, useRef } from 'react';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  lat: number;
  lng: number;
  territory: string;
  currentCustomer: string | null;
}

interface LiveAgentMapProps {
  agents: Agent[];
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: '#10b981',
  EN_ROUTE: '#6366f1',
  AT_LOCATION: '#22d3ee',
  IN_MEETING: '#f59e0b',
  OFFLINE: '#64748b',
};

export default function LiveAgentMap({ agents }: LiveAgentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (!mapRef.current) return;
      
      const map = L.map(mapRef.current, {
        center: [19.12, 72.84],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      // OpenStreetMap with CSS filter for dark theme (to bypass Carto API key requirement)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'map-tiles',
        keepBuffer: 4,
      }).addTo(map);

      mapInstanceRef.current = map;
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      // Add agent markers
      agents.forEach(agent => {
        const color = STATUS_COLORS[agent.status] || '#64748b';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center">
              <div style="
                width:36px;height:36px;border-radius:50%;
                background:${color}22;
                border:2px solid ${color};
                display:flex;align-items:center;justify-content:center;
                font-family:Inter,sans-serif;font-size:11px;font-weight:700;
                color:${color};position:relative;
              ">
                ${agent.firstName[0]}${agent.lastName[0]}
                ${agent.status === 'IN_MEETING' ? `
                  <div style="
                    position:absolute;top:-4px;right:-4px;
                    width:10px;height:10px;border-radius:50%;
                    background:#f59e0b;
                    box-shadow:0 0 8px #f59e0b;
                    animation:pulse 1.5s ease-in-out infinite;
                  "></div>
                ` : ''}
              </div>
              <div style="
                background:rgba(9,14,26,0.9);border:1px solid ${color}44;
                border-radius:6px;padding:2px 6px;margin-top:4px;
                font-size:10px;color:${color};font-weight:600;
                font-family:Inter,sans-serif;white-space:nowrap;
              ">${agent.firstName}</div>
            </div>
          `,
          iconSize: [36, 60],
          iconAnchor: [18, 30],
        });

        const marker = L.marker([agent.lat, agent.lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="background:#0d1424;color:#f1f5f9;border:1px solid rgba(99,102,241,0.3);border-radius:10px;padding:14px;min-width:180px;font-family:Inter,sans-serif;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${agent.firstName} ${agent.lastName}</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">${agent.territory}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></div>
              <span style="font-size:11px;color:${color};font-weight:600;">${agent.status.replace('_', ' ')}</span>
            </div>
            ${agent.currentCustomer ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">With: ${agent.currentCustomer}</div>` : ''}
          </div>
        `, { className: 'ground-os-popup' });
      });

      // Lifestyle Grand project marker
      const projectIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background:linear-gradient(135deg,#6366f1,#4f46e5);
            color:#fff;padding:4px 10px;border-radius:20px;
            font-size:11px;font-weight:700;
            font-family:'Outfit',Inter,sans-serif;
            box-shadow:0 0 16px rgba(99,102,241,0.6);
            white-space:nowrap;
          ">🏢 Lifestyle Grand</div>
        `,
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });
      L.marker([19.136, 72.8278], { icon: projectIcon }).addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="map-container" style={{ flex: 1, minHeight: 380 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 380 }} id="live-agent-map" />
      <style>{`
        .leaflet-popup-content-wrapper { background:transparent !important; box-shadow:none !important; padding:0 !important; }
        .leaflet-popup-tip { display:none; }
        .leaflet-popup-close-button { color:#94a3b8 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
