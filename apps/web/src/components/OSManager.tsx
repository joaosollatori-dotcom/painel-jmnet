import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Wrench, Calendar, User, MapPin, Clock, CheckCircle, Warning, X } from '@phosphor-icons/react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon as any,
    shadowUrl: markerShadow as any,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface OS {
    id: string;
    tipo: string;
    status: string;
    descricao: string;
    prioridade: string;
    dataAgendamento?: string;
    assinante: {
        nome: string;
        enderecos: Array<{
            logradouro: string;
            numero: string;
            latitude: number;
            longitude: number;
        }>
    };
    tecnico?: { name: string };
}

function MapFlyTo({ pos }: { pos: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (pos) map.flyTo(pos, 15);
    }, [pos, map]);
    return null;
}

const OSManager: React.FC = () => {
    const [oss, setOss] = useState<OS[]>([]);
    const [selectedOS, setSelectedOS] = useState<OS | null>(null);
    const [view, setView] = useState<'list' | 'map'>('list');
    const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]);

    const handleSelectOS = (os: OS) => {
        setSelectedOS(os);
        setMapCenter([os.assinante.enderecos[0].latitude, os.assinante.enderecos[0].longitude]);
        setView('map');
    };

    // Mock data for initial visualization
    useEffect(() => {
        const mockOS: OS[] = [
            {
                id: '1',
                tipo: 'INSTALACAO',
                status: 'ABERTA',
                descricao: 'Instalação de fibra 500mb',
                prioridade: 'ALTA',
                assinante: {
                    nome: 'Marcos Oliveira',
                    enderecos: [{ logradouro: 'Rua das Flores', numero: '123', latitude: -23.5505, longitude: -46.6333 }]
                }
            },
            {
                id: '2',
                tipo: 'REPARO',
                status: 'EM_EXECUCAO',
                descricao: 'Sem sinal de internet',
                prioridade: 'URGENTE',
                dataAgendamento: new Date().toISOString(),
                tecnico: { name: 'Ricardo Silva' },
                assinante: {
                    nome: 'Ana Paula',
                    enderecos: [{ logradouro: 'Av Central', numero: '500', latitude: -23.5555, longitude: -46.6393 }]
                }
            },
            {
                id: '3',
                tipo: 'RETIRADA',
                status: 'ABERTA',
                descricao: 'Cancelamento definitivo',
                prioridade: 'BAIXA',
                assinante: {
                    nome: 'João das Neves',
                    enderecos: [{ logradouro: 'Rua do Gelo', numero: '7', latitude: -23.5615, longitude: -46.6233 }]
                }
            }
        ];
        setOss(mockOS);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTA': return '#3b82f6';
            case 'EM_EXECUCAO': return '#f59e0b';
            case 'FINALIZADA': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <div className="os-manager-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-main)' }}>
            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 800 }}>Ordens de Serviço</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gerenciamento de campo e agendamento técnico.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-muted)', padding: '4px', borderRadius: ' var(--radius-md)', border: '1px solid var(--border)' }}>
                    <button onClick={() => setView('list')} style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: view === 'list' ? 'var(--accent)' : 'transparent', color: view === 'list' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>Lista</button>
                    <button onClick={() => setView('map')} style={{ padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: view === 'map' ? 'var(--accent)' : 'transparent', color: view === 'map' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>Mapa</button>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {view === 'list' ? (
                    <div className="ic-sidebar-scroll" style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', alignContent: 'start' }}>
                        {oss.map(os => (
                            <div key={os.id} onClick={() => handleSelectOS(os)} className="os-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', background: `${getStatusColor(os.status)}20`, color: getStatusColor(os.status), fontWeight: 700 }}>{os.status}</span>
                                    <span style={{ color: os.prioridade === 'URGENTE' ? '#ef4444' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }}>{os.prioridade}</span>
                                </div>
                                <div style={{ borderLeft: `3px solid ${getStatusColor(os.status)}`, paddingLeft: '12px' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{os.tipo}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{os.descricao}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '4px' }}>
                                        <User size={16} color="var(--accent)" weight="fill" />
                                        <strong style={{ color: 'var(--text-primary)' }}>{os.assinante.nome}</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <MapPin size={16} weight="fill" />
                                        <span>{os.assinante.enderecos[0].logradouro}, {os.assinante.enderecos[0].numero}</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <Calendar size={16} />
                                        <span>{os.dataAgendamento ? new Date(os.dataAgendamento).toLocaleDateString() : 'Aguardando agendamento'}</span>
                                    </div>
                                    <button style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                        Gerenciar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ flex: 1, position: 'relative' }}>
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <MapFlyTo pos={mapCenter} />
                            {oss.map(os => (
                                <Marker key={os.id} position={[os.assinante.enderecos[0].latitude, os.assinante.enderecos[0].longitude]}>
                                    <Popup minWidth={200}>
                                        <div style={{ color: '#1a1a1a', padding: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <strong style={{ color: 'var(--accent)' }}>{os.tipo}</strong>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{os.status}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}><strong>Cliente:</strong> {os.assinante.nome}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#555' }}>{os.assinante.enderecos[0].logradouro}</div>
                                            <button style={{ width: '100%', marginTop: '10px', padding: '6px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Atribuir Técnico</button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OSManager;
