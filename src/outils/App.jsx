import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Timer,
  QrCode,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../shared/AppShell';
import { useCloudState, haptic } from '../shared/telegram';

const TABS = [
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'qr', label: 'QR & Liens', icon: QrCode },
];

const MODES = [
  { id: 'focus', label: 'Focus', minutes: 25 },
  { id: 'short', label: 'Pause', minutes: 5 },
  { id: 'long', label: 'Longue', minutes: 15 },
];

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio restrictions
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('focus');

  // --- Pomodoro ---
  const [modeId, setModeId] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const todayKey = new Date().toISOString().slice(0, 10);
  const [stats, setStats] = useCloudState('tg_app3_pomodoro', { date: todayKey, count: 0 });
  const intervalRef = useRef(null);

  const activeMode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const totalSeconds = activeMode.minutes * 60;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const sessionsToday = stats.date === todayKey ? stats.count : 0;

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playBeep();
          haptic('success');
          if (modeId === 'focus') {
            setStats((s) => ({
              date: todayKey,
              count: (s.date === todayKey ? s.count : 0) + 1,
            }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, modeId, todayKey, setStats]);

  const switchMode = (m) => {
    haptic('light');
    setRunning(false);
    setModeId(m.id);
    setSecondsLeft(m.minutes * 60);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- QR Code & Links ---
  const [qrInput, setQrInput] = useState('https://t.me/');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrHistory, setQrHistory] = useCloudState('tg_app3_qr_history', []);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const text = qrInput.trim();
    if (!text) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(text, { width: 512, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [qrInput]);

  const saveToHistory = () => {
    const text = qrInput.trim();
    if (!text) return;
    haptic('success');
    setQrHistory((prev) => [text, ...prev.filter((item) => item !== text)].slice(0, 8));
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    saveToHistory();
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-telegram-${Date.now()}.png`;
    a.click();
  };

  const copyQrText = async () => {
    if (!qrInput.trim()) return;
    saveToHistory();
    try {
      await navigator.clipboard.writeText(qrInput.trim());
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } catch {
      // Ignore clipboard failure
    }
  };

  const radius = 84;
  const circumference = 2 * Math.PI * radius;

  return (
    <AppShell
      title="Focus & QR Outils"
      subtitle="Minuteur Pomodoro & Générateur QR"
      icon={Timer}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'focus' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m)}
                className="py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: modeId === m.id ? 'var(--tg-button)' : 'var(--tg-section-bg)',
                  color: modeId === m.id ? 'var(--tg-button-text)' : 'var(--tg-hint)',
                }}
              >
                {m.label} ({m.minutes}m)
              </button>
            ))}
          </div>

          <div className="tg-card rounded-3xl p-6 flex flex-col items-center gap-5">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--tg-secondary-bg)"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--tg-button)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">
                  {formatTimer(secondsLeft)}
                </span>
                <span className="text-xs mt-1" style={{ color: 'var(--tg-hint)' }}>
                  {activeMode.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  haptic('medium');
                  if (secondsLeft === 0) setSecondsLeft(totalSeconds);
                  setRunning((r) => !r);
                }}
                className="tg-btn flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? 'Pause' : 'Démarrer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setRunning(false);
                  setSecondsLeft(totalSeconds);
                }}
                className="tg-input p-3 rounded-2xl cursor-pointer"
                title="Réinitialiser"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="tg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">Sessions Focus aujourd’hui</p>
              <p className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                Sauvegardé automatiquement sur Telegram
              </p>
            </div>
            <span className="text-2xl font-extrabold" style={{ color: 'var(--tg-accent)' }}>
              {sessionsToday}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="space-y-4">
          <div className="tg-card rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold block">Texte, URL ou lien Telegram (t.me/...)</label>
            <textarea
              rows={2}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Colle un lien, numéro WhatsApp, texte..."
              className="tg-input w-full rounded-xl px-3 py-2 text-sm resize-none"
            />

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <img src={qrDataUrl} alt="QR Code généré" className="w-48 h-48" />
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={downloadQr}
                    className="tg-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Télécharger PNG
                  </button>
                  <button
                    type="button"
                    onClick={copyQrText}
                    className="tg-input py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedUrl ? 'Copié !' : 'Copier le texte'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {qrHistory.length > 0 && (
            <div className="tg-card rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Historique récent</p>
                <button
                  type="button"
                  onClick={() => setQrHistory([])}
                  className="text-[11px] cursor-pointer"
                  style={{ color: 'var(--tg-destructive)' }}
                >
                  Effacer
                </button>
              </div>
              <div className="space-y-1.5">
                {qrHistory.map((item) => (
                  <div key={item} className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setQrInput(item);
                      }}
                      className="truncate text-left flex-1 py-1 cursor-pointer"
                      style={{ color: 'var(--tg-accent)' }}
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrHistory((prev) => prev.filter((x) => x !== item))}
                      className="p-1 cursor-pointer"
                      style={{ color: 'var(--tg-hint)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
