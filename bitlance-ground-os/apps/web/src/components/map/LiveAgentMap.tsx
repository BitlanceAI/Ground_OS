import { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { Navigation, Users, MapPin, CheckCircle2, Zap } from 'lucide-react';

export interface AgentLocationData {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  status: string;
  lat: number;
  lng: number;
  territory?: string;
  currentCustomer?: string | null;
  phone?: string;
  employeeCode?: string;
  isLiveGPS?: boolean;
  accuracy?: number;
  lastSeenAt?: string;
}

export interface DestinationPlace {
  name: string;
  business: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  status?: string;
}

interface LiveAgentMapProps {
  agents: AgentLocationData[];
  destinationPlace?: DestinationPlace | null;
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: '#10b981',
  EN_ROUTE: '#6366f1',
  AT_LOCATION: '#22d3ee',
  IN_MEETING: '#f59e0b',
  OFFLINE: '#64748b',
};

type MapTheme = 'dark' | 'satellite' | 'streets';

export default function LiveAgentMap({
  agents,
  destinationPlace,
  selectedAgentId: controlledAgentId,
  onSelectAgent
}: LiveAgentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());

  const [activeTheme, setActiveTheme] = useState<MapTheme>('dark');
  const [internalSelectedAgentId, setInternalSelectedAgentId] = useState<string>('all');
  const selectedAgentId = controlledAgentId !== undefined ? controlledAgentId : internalSelectedAgentId;

  // Read configured API key
  const mapsApiKey = (import.meta.env.VITE_MAPS_API_KEY || import.meta.env.VITE_CARTO_API_KEY || '').trim();
  const isGoogleKey = mapsApiKey.startsWith('AIzaSy');

  const getTileConfig = (theme: MapTheme, key: string) => {
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

    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 16,
        className: 'map-tiles',
        attribution: '&copy; Esri'
      }
    };
  };

  // Determine primary agent's initial position
  const primaryAgent = agents.find(a => a.isLiveGPS) || agents[0];
  const initialCenter: [number, number] = primaryAgent && primaryAgent.lat && primaryAgent.lng
    ? [primaryAgent.lat, primaryAgent.lng]
    : [28.5921, 77.0460];

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      const { url, options } = getTileConfig(activeTheme, mapsApiKey);
      const tileLayer = L.tileLayer(url, options).addTo(map);
      tileLayerRef.current = tileLayer;

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
        markerMapRef.current.clear();
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

  // Update markers and render all agents
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then(L => {
      if (!markersLayerRef.current) return;
      markersLayerRef.current.clearLayers();
      markerMapRef.current.clear();

      const boundsPoints: [number, number][] = [];

      // 1. Render all Agents
      const displayAgents = (agents && agents.length > 0)
        ? agents
        : [{
            id: 'cmuqiadpb0003c0qqhzmw60r7',
            firstName: 'Nilesh',
            lastName: 'Somnawane',
            name: 'Nilesh Somnawane',
            status: 'ONLINE',
            lat: 28.5921,
            lng: 77.0460,
            territory: 'Delhi NCR (Dwarka Hub)',
            currentCustomer: destinationPlace?.name || null,
            employeeCode: 'AG001',
          }];

      displayAgents.forEach((agent) => {
        if (!agent.lat || !agent.lng) return;
        boundsPoints.push([agent.lat, agent.lng]);

        const color = STATUS_COLORS[agent.status] || '#10b981';
        const isTarget = selectedAgentId === agent.id;
        const initialStr = agent.firstName ? agent.firstName[0] : (agent.name ? agent.name[0] : 'A');
        const secondInitial = agent.lastName ? agent.lastName[0] : (agent.name?.split(' ')[1]?.[0] || '');

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="
                width:${isTarget ? '44px' : '38px'};
                height:${isTarget ? '44px' : '38px'};
                border-radius:50%;
                background:${color}26;
                border:2.5px solid ${isTarget ? '#fff' : color};
                display:flex;align-items:center;justify-content:center;
                font-family:Inter,sans-serif;font-size:12px;font-weight:800;
                color:#fff;position:relative;
                box-shadow:${isTarget ? `0 0 20px ${color}, 0 0 10px #fff` : `0 0 12px ${color}66`};
                transition:all 0.3s ease;
              ">
                ${initialStr}${secondInitial}
                <div style="
                  position:absolute;top:-3px;right:-3px;
                  width:11px;height:11px;border-radius:50%;
                  background:${color};
                  box-shadow:0 0 8px ${color};
                  border:1.5px solid #0f172a;
                  animation:pulse 1.5s ease-in-out infinite;
                "></div>
              </div>
              <div style="
                background:rgba(9,14,26,0.92);border:1px solid ${isTarget ? '#fff' : color + '88'};
                border-radius:6px;padding:3px 8px;margin-top:4px;
                font-size:11px;color:#fff;font-weight:700;
                font-family:Inter,sans-serif;white-space:nowrap;
                box-shadow:0 2px 10px rgba(0,0,0,0.6);
                display:flex;align-items:center;gap:4px;
              ">
                ${agent.isLiveGPS ? '<span style="color:#10b981;">📍</span>' : ''}
                <span>${agent.firstName || agent.name || 'Agent'}</span>
              </div>
            </div>
          `,
          iconSize: [44, 70],
          iconAnchor: [22, 35],
        });

        const marker = L.marker([agent.lat, agent.lng], { icon }).addTo(markersLayerRef.current);
        markerMapRef.current.set(agent.id, marker);

        marker.on('click', () => {
          handleAgentSelect(agent.id);
        });

        marker.bindPopup(`
          <div style="background:#0d1424;color:#f1f5f9;border:1px solid rgba(99,102,241,0.4);border-radius:10px;padding:14px 16px;min-width:210px;font-family:Inter,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,0.6);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div style="font-weight:800;font-size:14px;color:#fff;">${agent.name || `${agent.firstName} ${agent.lastName}`}</div>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(99,102,241,0.2);color:#818cf8;font-weight:700;">${agent.employeeCode || 'AG001'}</span>
            </div>
            
            ${agent.isLiveGPS ? `
              <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);margin-bottom:8px;">
                ● LIVE DEVICE GPS (${agent.lat.toFixed(4)}, ${agent.lng.toFixed(4)})
              </div>
            ` : `
              <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Coordinates: ${agent.lat.toFixed(4)}, ${agent.lng.toFixed(4)}</div>
            `}

            <div style="font-size:11px;color:#cbd5e1;margin-bottom:8px;">📍 Territory: <strong>${agent.territory || 'Delhi NCR'}</strong></div>
            
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></div>
              <span style="font-size:11px;color:${color};font-weight:700;">${agent.status.replace('_', ' ')}</span>
              ${agent.phone ? `<span style="font-size:11px;color:#94a3b8;margin-left:auto;">${agent.phone}</span>` : ''}
            </div>
            ${agent.currentCustomer ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">Active Meeting: <strong style="color:#fff;">${agent.currentCustomer}</strong></div>` : ''}
          </div>
        `, { className: 'ground-os-popup' });
      });

      // 2. Render Destination Place (Shop / Business)
      if (destinationPlace && destinationPlace.lat && destinationPlace.lng) {
        const destLat = destinationPlace.lat;
        const destLng = destinationPlace.lng;
        boundsPoints.push([destLat, destLng]);

        const placeIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="
                background:linear-gradient(135deg, #f43f5e, #e11d48);
                color:#fff;padding:6px 14px;border-radius:20px;
                font-size:11px;font-weight:800;
                box-shadow:0 0 20px rgba(244,63,94,0.7);
                white-space:nowrap;display:flex;align-items:center;gap:6px;
                border:1px solid rgba(255,255,255,0.35);
              ">
                <span style="font-size:14px;">🏪</span>
                <span>${destinationPlace.business || destinationPlace.name}</span>
              </div>
              <div style="
                width:0;height:0;
                border-left:6px solid transparent;border-right:6px solid transparent;
                border-top:8px solid #e11d48;
              "></div>
            </div>
          `,
          iconSize: [160, 44],
          iconAnchor: [80, 44],
        });

        const destMarker = L.marker([destLat, destLng], { icon: placeIcon }).addTo(markersLayerRef.current);

        destMarker.bindPopup(`
          <div style="background:#0d1424;color:#f1f5f9;border:1px solid rgba(244,63,94,0.4);border-radius:10px;padding:14px;min-width:220px;font-family:Inter,sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:14px;">🏪</span>
              <span style="font-weight:800;font-size:14px;color:#f43f5e;">${destinationPlace.business || destinationPlace.name}</span>
            </div>
            <div style="font-size:12px;color:#e2e8f0;margin-bottom:4px;">Client: <strong>${destinationPlace.name}</strong></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">📍 ${destinationPlace.address}</div>
            <div style="display:inline-flex;padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;background:rgba(244,63,94,0.15);color:#f43f5e;border:1px solid rgba(244,63,94,0.3);">
              ACTIVE VISIT DESTINATION
            </div>
          </div>
        `, { className: 'ground-os-popup' });

        // 3. Draw Route Path from Primary Agent to Destination
        if (displayAgents.length > 0) {
          const firstAgent = displayAgents[0];
          L.polyline(
            [[firstAgent.lat, firstAgent.lng], [destLat, destLng]],
            {
              color: '#818cf8',
              weight: 3.5,
              dashArray: '8, 8',
              opacity: 0.9,
            }
          ).addTo(markersLayerRef.current);
        }
      }

      // Handle focus and bounds
      if (selectedAgentId && selectedAgentId !== 'all') {
        const target = displayAgents.find(a => a.id === selectedAgentId);
        if (target && target.lat && target.lng) {
          mapInstanceRef.current.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
          const m = markerMapRef.current.get(target.id);
          if (m) m.openPopup();
        }
      } else {
        if (boundsPoints.length > 1) {
          const b = L.latLngBounds(boundsPoints);
          if (b.getNorthEast().distanceTo(b.getSouthWest()) < 800) {
            mapInstanceRef.current.setView(boundsPoints[0], 15);
          } else {
            mapInstanceRef.current.fitBounds(b, { padding: [50, 50], maxZoom: 16 });
          }
        } else if (boundsPoints.length === 1) {
          mapInstanceRef.current.setView(boundsPoints[0], 15);
        }
      }
    });
  }, [agents, destinationPlace, selectedAgentId]);

  // Handler for agent dropdown selection
  const handleAgentSelect = (agentId: string) => {
    if (onSelectAgent) {
      onSelectAgent(agentId);
    } else {
      setInternalSelectedAgentId(agentId);
    }

    if (!mapInstanceRef.current) return;

    if (agentId === 'all') {
      const validPoints: [number, number][] = agents
        .filter(a => a.lat && a.lng)
        .map(a => [a.lat, a.lng]);
      if (destinationPlace?.lat && destinationPlace?.lng) {
        validPoints.push([destinationPlace.lat, destinationPlace.lng]);
      }

      import('leaflet').then(L => {
        if (validPoints.length > 1) {
          mapInstanceRef.current.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50], maxZoom: 16 });
        } else if (validPoints.length === 1) {
          mapInstanceRef.current.flyTo(validPoints[0], 15, { duration: 1.2 });
        }
      });
    } else {
      const targetAgent = agents.find(a => a.id === agentId);
      if (targetAgent && targetAgent.lat && targetAgent.lng) {
        mapInstanceRef.current.flyTo([targetAgent.lat, targetAgent.lng], 16, { duration: 1.2 });
        const marker = markerMapRef.current.get(agentId);
        if (marker) {
          setTimeout(() => marker.openPopup(), 1200);
        }
      }
    }
  };

  const handleRecenterOnLiveGPS = () => {
    const liveAgent = agents.find(a => a.isLiveGPS) || agents[0];
    if (liveAgent && liveAgent.lat && liveAgent.lng && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([liveAgent.lat, liveAgent.lng], 16, { duration: 1.2 });
      handleAgentSelect(liveAgent.id);
    }
  };

  return (
    <div className="map-container" style={{ height: 400, minHeight: 400, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} id="live-agent-map" />

      {/* Top Controls Overlay Bar: Agent Shift Dropdown + Recenter + Layers */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {/* Left: Agent Shift Dropdown Selector */}
        <div style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(9, 14, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          padding: '4px 10px',
        }}>
          <Users size={14} color="var(--color-brand-light)" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Live Agent:</span>
          
          <select
            value={selectedAgentId}
            onChange={(e) => handleAgentSelect(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '220px',
            }}
          >
            <option value="all" style={{ background: '#0f172a', color: '#fff' }}>
              🌐 All Active Agents ({agents.length})
            </option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id} style={{ background: '#0f172a', color: '#fff' }}>
                👔 {ag.name || ag.firstName} {ag.isLiveGPS ? '📍 (Live GPS)' : `(${ag.status})`}
              </option>
            ))}
          </select>

          {/* Quick Recenter Button */}
          <button
            onClick={handleRecenterOnLiveGPS}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
            }}
            title="Recenter view on live GPS agent"
          >
            <Navigation size={11} fill="#fff" />
            <span>Shift Location</span>
          </button>
        </div>

        {/* Right: Map Layer Switcher (Dark, Satellite, Streets) */}
        <div style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(9, 14, 26, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          padding: '3px 5px',
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
          font-weight: 600;
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
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
