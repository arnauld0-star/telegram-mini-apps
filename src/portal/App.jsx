import { CheckSquare, Wallet, Timer, ExternalLink, Bot } from 'lucide-react';
import { AppShell } from '../shared/AppShell';

const APPS = [
  {
    id: 'notes',
    href: './notes/',
    title: 'App 1 — Notes, Tâches & Habitudes',
    desc: 'Gestionnaire de tâches, notes rapides et suivi d’habitudes synchronisés sur Telegram Cloud.',
    icon: CheckSquare,
    badge: '/notes/',
  },
  {
    id: 'budget',
    href: './budget/',
    title: 'App 2 — Budget & Mini-Devis',
    desc: 'Suivi entrées/sorties en FCFA/EUR/USD et créateur de devis express prêts à envoyer.',
    icon: Wallet,
    badge: '/budget/',
  },
  {
    id: 'outils',
    href: './outils/',
    title: 'App 3 — Focus Pomodoro & QR Code',
    desc: 'Minuteur Focus + générateur instantané de QR Codes PNG & liens de partage.',
    icon: Timer,
    badge: '/outils/',
  },
];

export default function App() {
  return (
    <AppShell
      title="Mes Mini Apps Telegram"
      subtitle="Portail des 3 applications"
      icon={Bot}
    >
      <div className="tg-card rounded-2xl p-4 space-y-1.5">
        <p className="text-sm font-semibold">3 Bots · 1 Dépôt GitHub Pages</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--tg-hint)' }}>
          Chaque carte ci-dessous correspond à une Mini App indépendante que tu peux relier à un bot distinct dans @BotFather.
        </p>
      </div>

      <div className="space-y-3">
        {APPS.map((app) => {
          const Icon = app.icon;
          return (
            <a
              key={app.id}
              href={app.href}
              className="tg-card rounded-2xl p-4 flex items-start gap-3.5 transition-transform active:scale-[0.99] block"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--tg-button) 15%, transparent)',
                  color: 'var(--tg-accent)',
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold truncate">{app.title}</h2>
                  <ExternalLink className="w-4 h-4 shrink-0" style={{ color: 'var(--tg-hint)' }} />
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--tg-hint)' }}>
                  {app.desc}
                </p>
                <span
                  className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-accent)',
                  }}
                >
                  {app.badge}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </AppShell>
  );
}
