import { useEffect, useState } from 'react';
import { initTelegram, haptic } from './telegram';

export function AppShell({ title, subtitle, icon: Icon, tabs, activeTab, onTabChange, children }) {
  const [tgInfo, setTgInfo] = useState({ isTelegram: false, user: null });

  useEffect(() => {
    setTgInfo(initTelegram());
  }, []);

  const displayName = tgInfo.user
    ? `${tgInfo.user.first_name}${tgInfo.user.username ? ` (@${tgInfo.user.username})` : ''}`
    : null;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto pb-20">
      <header className="sticky top-0 z-20 px-4 pt-3 pb-3 backdrop-blur-md border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--tg-section-bg) 92%, transparent)',
          borderColor: 'var(--tg-border)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'color-mix(in srgb, var(--tg-button) 15%, transparent)', color: 'var(--tg-accent)' }}
              >
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
              <p className="text-xs truncate" style={{ color: 'var(--tg-hint)' }}>
                {displayName ? `Compte : ${displayName}` : subtitle}
              </p>
            </div>
          </div>

          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: tgInfo.isTelegram
                ? 'color-mix(in srgb, #22c55e 16%, transparent)'
                : 'color-mix(in srgb, var(--tg-hint) 16%, transparent)',
              color: tgInfo.isTelegram ? '#16a34a' : 'var(--tg-hint)',
            }}
          >
            {tgInfo.isTelegram ? 'Telegram Cloud' : 'Aperçu Web'}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">{children}</main>

      {tabs && tabs.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-20 border-t max-w-md mx-auto"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--tg-section-bg) 96%, transparent)',
            borderColor: 'var(--tg-border)',
          }}
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    onTabChange(tab.id);
                  }}
                  className="flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-opacity cursor-pointer"
                  style={{ color: isActive ? 'var(--tg-accent)' : 'var(--tg-hint)' }}
                >
                  <TabIcon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
