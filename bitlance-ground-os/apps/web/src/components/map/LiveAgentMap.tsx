import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Layers } from 'lucide-react';

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

type MapTheme = 'dark' | 'satellite' | 'streets';

export default function LiveAgentMap({ agents }: LiveAgentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeTheme, setActiveTheme] = useState<MapTheme>('dark');

  // Read configured API key
  const mapsApiKey = (import.meta.env.VITE_MAPS_API_KEY || import.meta.env.VITE_CARTO_API_KEY || '').trim();
  const isGoogleKey = mapsApiKey.startsWith('AIzaSy');

  const getTileConfig = (theme: MapTheme, key: string) => {
    // If user provided a Google Maps API Key
    if (key && key.startsWith('AIzaSy')) {
      if (theme === 'satellite') {
        return {
          url: `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${key}`,
          options: {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20,
            className: 'map-tiles',
            attribution: '&copy; Google Maps'
          }
        };
      }
      if (theme === 'streets') {
        return {
          url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${key}`,
          options: {
            subdomains: ['0', '1', '2', '3'],
            maxZoom: 20,
            className: 'map-tiles',
            attribution: '&copy; Google Maps'
          }
        };
      }
      // Default: Google Dark theme
      return {
        url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${key}`,
        options: {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          className: 'map-tiles google-map-tiles',
          attribution: '&copy; Google Maps'
        }
      };
    }

    // If Carto API key
    if (key) {
      return {
        url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${key}`,
        options: {
          subdomains: 'abcd',
          maxZoom: 20,
          className: 'map-tiles',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }
      };
    }

    // Fallback unmetered clean dark canvas
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 16,
        className: 'map-tiles',
        attribution: '&copy; Esri'
      }
    };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      const map = L.map(mapRef.current, {
        center: [19.12, 72.84],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      const { url, options } = getTileConfig(activeTheme, mapsApiKey);
      const tileLayer = L.tileLayer(url, options).addTo(map);
      tileLayerRef.current = tileLayer;

      // Create a layer group for dynamic markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then(L => {
      if (!mapInstanceRef.current) return;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const { url, options } = getTileConfig(activeTheme, mapsApiKey);
      const newLayer = L.tileLayer(url, options).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    });
  }, [activeTheme, mapsApiKey]);

  // Update markers when agents change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then(L => {
      if (!markersLayerRef.current) return;
      markersLayerRef.current.clearLayers();

      if (!agents || agents.length === 0) return;

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
                ${agent.firstName?.[0] || 'A'}${agent.lastName?.[0] || ''}
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

        const marker = L.marker([agent.lat, agent.lng], { icon }).addTo(markersLayerRef.current);

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
    });
  }, [agents]);

  return (
    <div className="map-container" style={{ flex: 1, minHeight: 380, position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 380 }} id="live-agent-map" />

      {/* Layer selector bar */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(9, 14, 26, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '3px 4px',
      }}>
        {isGoogleKey && (
          <span style={{ fontSize: '10px', color: '#94a3b8', padding: '0 6px', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            Google Maps
          </span>
        )}
        <button
          className={`btn-layer ${activeTheme === 'dark' ? 'active' : ''}`}
          onClick={() => setActiveTheme('dark')}
          title="Dark mode map"
        >
          Dark
        </button>
        <button
          className={`btn-layer ${activeTheme === 'satellite' ? 'active' : ''}`}
          onClick={() => setActiveTheme('satellite')}
          title="Satellite imagery"
        >
          Satellite
        </button>
        <button
          className={`btn-layer ${activeTheme === 'streets' ? 'active' : ''}`}
          onClick={() => setActiveTheme('streets')}
          title="Standard streets view"
        >
          Streets
        </button>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper { background:transparent !important; box-shadow:none !important; padding:0 !important; }
        .leaflet-popup-tip { display:none; }
        .leaflet-popup-close-button { color:#94a3b8 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .btn-layer {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-layer:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-layer.active {
          color: #fff;
          background: var(--color-brand, #6366f1);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
