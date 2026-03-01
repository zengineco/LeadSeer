import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Settings, History, Download, Trash2, CheckCircle,
  XCircle, AlertTriangle, ChevronRight, Star, Phone, MapPin,
  Globe, Zap, BarChart2, RefreshCw, Folder, Eye, EyeOff,
  Filter, TrendingUp, Shield, ExternalLink
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

function useStorage() {
  const load = useCallback(async (key) => {
    if (isElectron) {
      if (key === 'config') return window.electronAPI.loadConfig();
      if (key === 'history') return window.electronAPI.loadHistory();
    }
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }, []);
  const save = useCallback(async (key, val) => {
    if (isElectron) {
      if (key === 'config') return window.electronAPI.saveConfig(val);
      if (key === 'history') return window.electronAPI.saveHistory(val);
    }
    localStorage.setItem(key, JSON.stringify(val));
  }, []);
  return { load, save };
}

function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => escape(r[k])).join(','))].join('\n');
}

async function placesTextSearch(apiKey, query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

async function placeDetails(apiKey, placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,business_status,formatted_phone_number,opening_hours&key=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

const CHAINS = ["mcdonald","subway","starbucks","walmart","cvs","walgreens","7-eleven","shell","bp","exxon","chevron","dollar","domino","pizza hut","dunkin","kfc","burger king","chipotle","taco bell","wendy","popeyes","chick-fil","panda express","little caesar","five guys"];

// ── Sub-components ────────────────────────────────────────────────────────────

function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="26" cy="26" r="20" stroke="#00c2ff" strokeWidth="3" />
      <circle cx="26" cy="26" r="12" stroke="#00c2ff" strokeWidth="1.5" strokeDasharray="2 3" />
      <rect x="19" y="22" width="14" height="12" rx="1.5" stroke="#00c2ff" strokeWidth="1.5" />
      <rect x="22" y="26" width="4" height="8" rx="0.5" fill="#00c2ff" />
      <circle cx="18" cy="20" r="2" fill="#f0b429" />
      <circle cx="34" cy="18" r="1.5" fill="#00e5a0" />
      <line x1="40" y1="40" x2="57" y2="57" stroke="#00c2ff" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 16 L16 11 L18 16" stroke="#00c2ff" strokeWidth="1" fill="none" />
    </svg>
  );
}

function Badge({ children, variant = 'default' }) {
  const colors = {
    default: { bg: 'rgba(0,194,255,0.1)', color: '#00c2ff', border: 'rgba(0,194,255,0.2)' },
    success: { bg: 'rgba(0,229,160,0.1)', color: '#00e5a0', border: 'rgba(0,229,160,0.2)' },
    warning: { bg: 'rgba(240,180,41,0.1)', color: '#f0b429', border: 'rgba(240,180,41,0.2)' },
    danger: { bg: 'rgba(255,77,109,0.1)', color: '#ff4d6d', border: 'rgba(255,77,109,0.2)' },
  };
  const c = colors[variant] || colors.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
      fontFamily: 'var(--font-display)',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', icon, disabled, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.03em',
    borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition)', border: '1px solid transparent',
    opacity: disabled ? 0.45 : 1,
    ...style
  };
  const sizes = { sm: { padding: '6px 12px', fontSize: 12 }, md: { padding: '10px 18px', fontSize: 13 }, lg: { padding: '13px 24px', fontSize: 14 } };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--navy)', borderColor: 'var(--accent)', boxShadow: '0 0 20px rgba(0,194,255,0.25)' },
    secondary: { background: 'var(--surface-raised)', color: 'var(--text-primary)', borderColor: 'var(--navy-border)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
    danger: { background: 'rgba(255,77,109,0.12)', color: '#ff4d6d', borderColor: 'rgba(255,77,109,0.3)' },
    success: { background: 'rgba(0,229,160,0.12)', color: '#00e5a0', borderColor: 'rgba(0,229,160,0.3)' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {icon && icon}{children}
    </button>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--navy-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: glow ? 'var(--shadow-accent)' : 'var(--shadow-sm)',
      ...(glow && { borderColor: 'rgba(0,194,255,0.25)' }),
      ...style
    }}>{children}</div>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className="animate-in" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: t.type === 'success' ? 'rgba(0,229,160,0.15)' : t.type === 'error' ? 'rgba(255,77,109,0.15)' : 'var(--surface-raised)',
          border: `1px solid ${t.type === 'success' ? 'rgba(0,229,160,0.3)' : t.type === 'error' ? 'rgba(255,77,109,0.3)' : 'var(--navy-border)'}`,
          color: 'var(--text-primary)', fontSize: 13, maxWidth: 320,
          boxShadow: 'var(--shadow-md)'
        }}>
          {t.type === 'success' && <CheckCircle size={16} color="#00e5a0" />}
          {t.type === 'error' && <XCircle size={16} color="#ff4d6d" />}
          {t.type === 'info' && <AlertTriangle size={16} color="#f0b429" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function StarRating({ value }) {
  if (!value || value === 'N/A') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const n = parseFloat(value);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Star size={12} fill="#f0b429" color="#f0b429" />
      <span style={{ color: '#f0b429', fontWeight: 600 }}>{n.toFixed(1)}</span>
    </span>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ config, onSave, onClose }) {
  const [local, setLocal] = useState({ ...config });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const storage = useStorage();

  const handleSave = async () => {
    await storage.save('config', local);
    onSave(local);
    onClose();
  };

  const testAPI = async () => {
    if (!local.api_key) return;
    setTesting(true); setTestResult(null);
    try {
      const r = await placesTextSearch(local.api_key, 'restaurant in New York');
      if (r.status === 'OK') setTestResult({ ok: true, msg: 'API key valid ✓' });
      else setTestResult({ ok: false, msg: r.error_message || r.status });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  const pickFolder = async () => {
    if (!isElectron) return;
    const folder = await window.electronAPI.pickFolder();
    if (folder) setLocal(l => ({ ...l, save_location: folder }));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-in" style={{
        width: 560, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--navy-mid)', border: '1px solid var(--navy-border)',
        borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Settings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Configure your LeadSeer preferences</p>
          </div>
          <Btn variant="ghost" onClick={onClose} size="sm">✕</Btn>
        </div>

        {/* API Key */}
        <section style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>
            Google Maps API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={local.api_key}
              onChange={e => setLocal(l => ({ ...l, api_key: e.target.value }))}
              placeholder="AIza..."
              style={{ paddingRight: 44 }}
            />
            <button onClick={() => setShowKey(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none'
            }}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn variant="secondary" size="sm" onClick={testAPI} disabled={testing || !local.api_key}
              icon={testing ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}>
              {testing ? 'Testing…' : 'Test Key'}
            </Btn>
            {testResult && (
              <span style={{ fontSize: 12, color: testResult.ok ? '#00e5a0' : '#ff4d6d', display: 'flex', alignItems: 'center', gap: 4 }}>
                {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {testResult.msg}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Get your key at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>console.cloud.google.com</a>. Enable the Places API.
          </p>
        </section>

        {/* Filters */}
        <section style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase' }}>
            Search Filters
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>Min. Reviews</label>
              <input type="number" min={0} max={200} value={local.min_reviews}
                onChange={e => setLocal(l => ({ ...l, min_reviews: +e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>Max Results</label>
              <input type="number" min={5} max={60} step={5} value={local.max_results}
                onChange={e => setLocal(l => ({ ...l, max_results: +e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>
                <span>Min. Rating</span>
                <span style={{ color: '#f0b429', fontWeight: 600 }}>{local.min_rating}★</span>
              </label>
              <input type="range" min={1} max={5} step={0.5} value={local.min_rating}
                onChange={e => setLocal(l => ({ ...l, min_rating: +e.target.value }))} style={{ width: '100%' }} />
            </div>
          </div>
        </section>

        {/* Export */}
        <section style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase' }}>
            Export Settings
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input type="checkbox" id="auto_save" checked={local.auto_save}
              onChange={e => setLocal(l => ({ ...l, auto_save: e.target.checked }))} />
            <label htmlFor="auto_save" style={{ cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }}>
              Auto-save results after each search
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={local.save_location} onChange={e => setLocal(l => ({ ...l, save_location: e.target.value }))}
              placeholder="./leads" style={{ flex: 1 }} />
            {isElectron && (
              <Btn variant="secondary" size="sm" icon={<Folder size={13} />} onClick={pickFolder}>Browse</Btn>
            )}
          </div>
        </section>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} icon={<CheckCircle size={14} />}>Save Settings</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Results Table ─────────────────────────────────────────────────────────────
function ResultsTable({ results }) {
  const openMaps = (url) => {
    if (isElectron) window.electronAPI?.openPath?.(url);
    else window.open(url, '_blank');
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Business', 'Phone', 'Rating', 'Reviews', 'Address', 'Maps'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
                letterSpacing: '0.06em', color: 'var(--text-secondary)',
                textTransform: 'uppercase', borderBottom: '1px solid var(--navy-border)',
                background: 'var(--navy-mid)', whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="animate-in" style={{
              animationDelay: `${i * 30}ms`,
              borderBottom: '1px solid rgba(30,58,85,0.5)',
              transition: 'background var(--transition)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--success)', flexShrink: 0,
                    boxShadow: '0 0 8px var(--success)'
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r['Business Name']}</span>
                </div>
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {r.Phone !== 'N/A' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={12} color="var(--accent)" />{r.Phone}
                  </span>
                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </td>
              <td style={{ padding: '12px 14px' }}><StarRating value={r.Rating} /></td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {r.Reviews > 0 ? <Badge>{r.Reviews}</Badge> : '—'}
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: 220 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={11} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.Address}</span>
                </span>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <button onClick={() => openMaps(r['Maps Link'])} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                  background: 'var(--accent-dim)', border: '1px solid rgba(0,194,255,0.2)',
                  padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                  transition: 'background var(--transition)'
                }}>
                  <ExternalLink size={11} />View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryPanel({ history, onClear }) {
  const searches = history.searches || [];

  if (!searches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <History size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No searches yet</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Your search history will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Search History</h3>
        <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={onClear}>Clear All</Btn>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {searches.map((s, i) => (
          <div key={i} className="animate-in" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', background: 'var(--surface)',
            border: '1px solid var(--navy-border)', borderRadius: 'var(--radius-sm)',
            animationDelay: `${i * 20}ms`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-dim)', border: '1px solid rgba(0,194,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Search size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.category} <span style={{ color: 'var(--text-muted)' }}>in</span> {s.zip}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(s.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <Badge variant={s.results > 0 ? 'success' : 'default'}>
              {s.results} leads
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  api_key: '',
  min_reviews: 5,
  min_rating: 3.5,
  max_results: 20,
  auto_save: true,
  save_location: './leads',
};
const DEFAULT_HISTORY = { searches: [], api_calls: 0, total_prospects: 0 };

export default function App() {
  const storage = useStorage();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [history, setHistory] = useState(DEFAULT_HISTORY);
  const [tab, setTab] = useState('search');
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastRef = useRef(0);

  // Search state
  const [zipCode, setZipCode] = useState('');
  const [category, setCategory] = useState('');
  const [excludeChains, setExcludeChains] = useState(true);
  const [highValueOnly, setHighValueOnly] = useState(false);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    storage.load('config').then(c => c && setConfig({ ...DEFAULT_CONFIG, ...c }));
    storage.load('history').then(h => h && setHistory({ ...DEFAULT_HISTORY, ...h }));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const saveHistory = useCallback(async (h) => {
    setHistory(h);
    await storage.save('history', h);
  }, [storage]);

  const handleSearch = async () => {
    if (!config.api_key) { toast('Please add your Google Maps API key in Settings', 'error'); setShowSettings(true); return; }
    if (!zipCode.trim() || !category.trim()) { toast('Enter both a ZIP code and business category', 'info'); return; }

    setSearching(true); setResults(null); setProgress(0);

    try {
      setProgressLabel('Searching Google Places…');
      const searchRes = await placesTextSearch(config.api_key, `${category} in ${zipCode}`);

      if (searchRes.status !== 'OK') {
        toast(`API Error: ${searchRes.error_message || searchRes.status}`, 'error');
        setSearching(false); return;
      }

      const places = (searchRes.results || []).slice(0, config.max_results);
      const prospects = [];

      for (let i = 0; i < places.length; i++) {
        const place = places[i];
        setProgress(((i + 1) / places.length) * 100);
        setProgressLabel(`Checking ${place.name || 'business'} (${i + 1}/${places.length})…`);

        const detailsRes = await placeDetails(config.api_key, place.place_id);
        if (detailsRes.status !== 'OK') continue;
        const details = detailsRes.result || {};

        const hasWebsite = !!details.website;
        const isOperational = details.business_status === 'OPERATIONAL';
        if (hasWebsite || !isOperational) continue;

        const rating = place.rating || 0;
        const reviews = place.user_ratings_total || 0;
        const name = place.name || '';

        if (highValueOnly && (rating < config.min_rating || reviews < config.min_reviews)) continue;
        if (excludeChains && CHAINS.some(c => name.toLowerCase().includes(c))) continue;

        prospects.push({
          'Business Name': name,
          'Phone': details.formatted_phone_number || 'N/A',
          'Rating': rating || 'N/A',
          'Reviews': reviews,
          'Address': place.formatted_address || 'N/A',
          'Maps Link': `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          'Notes': '',
        });
      }

      prospects.sort((a, b) => (b.Reviews || 0) - (a.Reviews || 0));
      setResults(prospects);

      // Update history
      const newHistory = {
        ...history,
        api_calls: (history.api_calls || 0) + places.length + 1,
        total_prospects: (history.total_prospects || 0) + prospects.length,
        searches: [
          { timestamp: new Date().toISOString(), zip: zipCode, category, results: prospects.length },
          ...(history.searches || [])
        ].slice(0, 50)
      };
      await saveHistory(newHistory);

      if (prospects.length > 0) {
        toast(`Found ${prospects.length} businesses without websites!`, 'success');
        if (config.auto_save) {
          const csv = toCSV(prospects);
          const filename = `leadseer_${zipCode}_${category.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
          if (isElectron) {
            const r = await window.electronAPI.autoSaveCSV({ dir: config.save_location, filename, csvContent: csv });
            if (r?.success) toast(`Auto-saved to ${r.filePath}`, 'info');
          }
        }
      } else {
        toast('No businesses without websites found. Try different filters.', 'info');
      }
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }

    setSearching(false);
    setProgress(0);
    setProgressLabel('');
  };

  const handleDownload = async () => {
    if (!results?.length) return;
    const csv = toCSV(results);
    const filename = `leadseer_${zipCode}_${category.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;

    if (isElectron) {
      const r = await window.electronAPI.saveCSV({ defaultName: filename, csvContent: csv });
      if (r?.success) toast(`Saved to ${r.filePath}`, 'success');
    } else {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearHistory = async () => {
    const h = { searches: [], api_calls: 0, total_prospects: 0 };
    await saveHistory(h);
    toast('History cleared', 'info');
  };

  const TABS = [
    { id: 'search', label: 'Search', icon: <Search size={15} /> },
    { id: 'history', label: 'History', icon: <History size={15} /> },
  ];

  return (
    <div className="noise" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 60, flexShrink: 0,
        background: 'rgba(13,27,42,0.95)', borderBottom: '1px solid var(--navy-border)',
        backdropFilter: 'blur(12px)',
        WebkitAppRegion: 'drag',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, WebkitAppRegion: 'no-drag' }}>
          <LogoMark size={36} />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
              letterSpacing: '0.05em', color: 'var(--text-primary)',
              lineHeight: 1.1
            }}>LEADSEER</div>
            <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
              Finding Hidden Business Gems
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              background: tab === t.id ? 'var(--surface-raised)' : 'transparent',
              border: `1px solid ${tab === t.id ? 'var(--navy-border)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all var(--transition)'
            }}>{t.icon}{t.label}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, WebkitAppRegion: 'no-drag' }}>
          <div style={{ display: 'flex', gap: 20, marginRight: 8 }}>
            {[
              { label: 'API Calls', value: history.api_calls || 0 },
              { label: 'Total Leads', value: history.total_prospects || 0 },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--accent)', lineHeight: 1 }}>{m.value.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <Btn variant="secondary" size="sm" icon={<Settings size={14} />} onClick={() => setShowSettings(true)}>
            Settings
          </Btn>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 28 }} className="grid-bg">
        {tab === 'search' && (
          <div className="animate-in">
            {/* Search card */}
            <Card glow style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                  Find Businesses <span style={{ color: 'var(--accent)' }}>Without Websites</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Every result is a sales opportunity — local businesses that need your digital services.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    ZIP Code
                  </label>
                  <input
                    value={zipCode} onChange={e => setZipCode(e.target.value)}
                    placeholder="e.g., 33904"
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Business Category
                  </label>
                  <input
                    value={category} onChange={e => setCategory(e.target.value)}
                    placeholder="e.g., Plumbers, Landscapers, Salons…"
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Btn
                  variant="primary"
                  size="md"
                  onClick={handleSearch}
                  disabled={searching}
                  icon={searching ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
                  style={{ height: 42, whiteSpace: 'nowrap' }}
                >
                  {searching ? 'Scanning…' : 'Find Leads'}
                </Btn>
              </div>

              {/* Advanced filters */}
              <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--navy-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <input type="checkbox" checked={excludeChains} onChange={e => setExcludeChains(e.target.checked)} />
                  <Shield size={13} />Exclude chain businesses
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <input type="checkbox" checked={highValueOnly} onChange={e => setHighValueOnly(e.target.checked)} />
                  <Filter size={13} />High-value only ({config.min_reviews}+ reviews · {config.min_rating}★+)
                </label>
              </div>

              {/* Progress */}
              {searching && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{progressLabel}</span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--navy-border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: 'var(--accent)',
                      width: `${progress}%`, transition: 'width 0.3s ease',
                      boxShadow: '0 0 12px var(--accent)'
                    }} />
                  </div>
                </div>
              )}
            </Card>

            {/* Results */}
            {results !== null && (
              <Card className="animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                      Results
                    </h3>
                    <Badge variant={results.length > 0 ? 'success' : 'default'}>
                      {results.length} {results.length === 1 ? 'lead' : 'leads'} found
                    </Badge>
                    {results.length > 0 && (
                      <Badge variant="warning">
                        <Globe size={10} />No website detected
                      </Badge>
                    )}
                  </div>
                  {results.length > 0 && (
                    <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleDownload}>
                      Export CSV
                    </Btn>
                  )}
                </div>

                {results.length > 0
                  ? <ResultsTable results={results} />
                  : (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      <TrendingUp size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <p>No businesses without websites found in this search.</p>
                      <p style={{ fontSize: 12, marginTop: 6 }}>Try disabling filters or searching a different category.</p>
                    </div>
                  )}
              </Card>
            )}

            {/* Empty state */}
            {results === null && !searching && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <LogoMark size={64} />
                  <div style={{
                    position: 'absolute', inset: -8, borderRadius: '50%',
                    border: '1px solid rgba(0,194,255,0.15)', animation: 'pulse 3s ease infinite'
                  }} />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Ready to find hidden gems
                </p>
                <p style={{ fontSize: 13 }}>Enter a ZIP code and business category to discover leads</p>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="animate-in">
            <HistoryPanel history={history} onClear={clearHistory} />
          </div>
        )}
      </main>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          config={config}
          onSave={(c) => setConfig({ ...DEFAULT_CONFIG, ...c })}
          onClose={() => setShowSettings(false)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
