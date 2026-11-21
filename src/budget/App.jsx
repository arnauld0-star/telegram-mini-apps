import { useMemo, useState } from 'react';
import {
  Wallet,
  FileText,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { AppShell } from '../shared/AppShell';
import { useCloudState, haptic, confirmAction } from '../shared/telegram';

const TABS = [
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'quotes', label: 'Mini-Devis', icon: FileText },
  { id: 'settings', label: 'Réglages', icon: Settings },
];

const CURRENCIES = {
  XOF: { code: 'XOF', symbol: 'FCFA', label: 'FCFA (XOF)', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (€)', decimals: 2 },
  USD: { code: 'USD', symbol: '$', label: 'Dollar ($)', decimals: 2 },
};

const CATEGORIES = ['Ventes / Presta', 'Alimentation', 'Transport', 'Télécom / Data', 'Loyer / Charges', 'Autre'];

function formatMoney(amount, currencyCode) {
  const cfg = CURRENCIES[currencyCode] ?? CURRENCIES.XOF;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(Number(amount) || 0);
  return `${formatted} ${cfg.symbol}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('budget');
  const [currency, setCurrency] = useCloudState('tg_app2_currency', 'XOF');

  // --- Budget state ---
  const [transactions, setTransactions] = useCloudState('tg_app2_tx', []);
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txLabel, setTxLabel] = useState('');
  const [txCategory, setTxCategory] = useState(CATEGORIES[1]);

  // --- Mini-Devis state ---
  const [quotes, setQuotes] = useCloudState('tg_app2_quotes', []);
  const [clientName, setClientName] = useState('');
  const [quoteTitle, setQuoteTitle] = useState('');
  const [items, setItems] = useState([{ id: '1', name: '', qty: 1, price: '' }]);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = {};
    for (const tx of transactions) {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += val;
      } else {
        expense += val;
        byCategory[tx.category] = (byCategory[tx.category] || 0) + val;
      }
    }
    return { income, expense, balance: income - expense, byCategory };
  }, [transactions]);

  const addTransaction = (e) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) return;
    haptic('success');
    setTransactions((prev) => [
      {
        id: `${Date.now()}`,
        type: txType,
        amount,
        label: txLabel.trim() || txCategory,
        category: txCategory,
        date: new Date().toLocaleDateString('fr-FR'),
      },
      ...prev,
    ]);
    setTxAmount('');
    setTxLabel('');
  };

  const quoteTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  }, [items]);

  const addQuoteLine = () => {
    haptic('light');
    setItems((prev) => [...prev, { id: `${Date.now()}`, name: '', qty: 1, price: '' }]);
  };

  const updateQuoteLine = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const buildQuoteText = (q) => {
    const lines = q.items
      .filter((it) => it.name.trim() || Number(it.price) > 0)
      .map(
        (it) =>
          `• ${it.name || 'Prestation'} (${it.qty} × ${formatMoney(it.price, q.currency)}) = ${formatMoney(
            (Number(it.qty) || 0) * (Number(it.price) || 0),
            q.currency
          )}`
      );
    return [
      `📄 DEVIS : ${q.title || 'Prestation'}`,
      `👤 Client : ${q.client || 'Non précisé'}`,
      `📅 Date : ${q.date}`,
      '',
      ...lines,
      '',
      `💰 TOTAL : ${formatMoney(q.total, q.currency)}`,
    ].join('\n');
  };

  const saveAndCopyQuote = async () => {
    const validItems = items.filter((it) => it.name.trim() || Number(it.price) > 0);
    if (validItems.length === 0) return;
    const newQuote = {
      id: `${Date.now()}`,
      client: clientName.trim() || 'Client',
      title: quoteTitle.trim() || 'Devis rapide',
      items: validItems,
      total: quoteTotal,
      currency,
      date: new Date().toLocaleDateString('fr-FR'),
    };
    setQuotes((prev) => [newQuote, ...prev.slice(0, 14)]);
    haptic('success');
    try {
      await navigator.clipboard.writeText(buildQuoteText(newQuote));
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const exportCsv = () => {
    const header = 'Date,Type,Categorie,Libelle,Montant,Devise\n';
    const rows = transactions
      .map((t) => `${t.date},${t.type},${t.category},"${t.label.replace(/"/g, '""')}",${t.amount},${currency}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-telegram-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    haptic('success');
  };

  return (
    <AppShell
      title="Budget & Mini-Devis"
      subtitle={`Devise : ${CURRENCIES[currency]?.label ?? currency}`}
      icon={Wallet}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="tg-card rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>Solde net</p>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: summary.balance >= 0 ? '#16a34a' : 'var(--tg-destructive)' }}
              >
                {formatMoney(summary.balance, currency)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--tg-border)' }}>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>Entrées</p>
                  <p className="text-xs font-bold">{formatMoney(summary.income, currency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>Dépenses</p>
                  <p className="text-xs font-bold">{formatMoney(summary.expense, currency)}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={addTransaction} className="tg-card rounded-2xl p-3.5 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTxType('expense');
                  setTxCategory(CATEGORIES[1]);
                }}
                className="py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: txType === 'expense' ? '#ef4444' : 'var(--tg-secondary-bg)',
                  color: txType === 'expense' ? '#fff' : 'var(--tg-hint)',
                }}
              >
                − Dépense
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('income');
                  setTxCategory(CATEGORIES[0]);
                }}
                className="py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: txType === 'income' ? '#16a34a' : 'var(--tg-secondary-bg)',
                  color: txType === 'income' ? '#fff' : 'var(--tg-hint)',
                }}
              >
                + Revenu
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder={`Montant (${CURRENCIES[currency]?.symbol})`}
                className="tg-input flex-1 rounded-xl px-3 py-2 text-sm"
                required
              />
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="tg-input rounded-xl px-2.5 py-2 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={txLabel}
                onChange={(e) => setTxLabel(e.target.value)}
                placeholder="Description (ex: Déjeuner, Client X...)"
                className="tg-input flex-1 rounded-xl px-3 py-2 text-sm"
              />
              <button type="submit" className="tg-btn rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer">
                Ajouter
              </button>
            </div>
          </form>

          {summary.expense > 0 && (
            <div className="tg-card rounded-2xl p-3.5 space-y-2">
              <p className="text-xs font-bold">Répartition des dépenses</p>
              {Object.entries(summary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => {
                  const pct = Math.round((amt / summary.expense) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>{cat}</span>
                        <span className="font-semibold">{formatMoney(amt, currency)} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-secondary-bg)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--tg-button)' }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="tg-card rounded-2xl p-6 text-center text-xs" style={{ color: 'var(--tg-hint)' }}>
                Aucune opération enregistrée pour le moment.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="tg-card rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{tx.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                      {tx.category} · {tx.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-sm font-bold"
                      style={{ color: tx.type === 'income' ? '#16a34a' : 'var(--tg-destructive)' }}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {formatMoney(tx.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTransactions((prev) => prev.filter((item) => item.id !== tx.id))}
                      className="p-1 cursor-pointer"
                      style={{ color: 'var(--tg-hint)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="tg-card rounded-2xl p-3.5 space-y-2.5">
            <p className="text-xs font-bold">Nouveau Mini-Devis</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client"
                className="tg-input rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={quoteTitle}
                onChange={(e) => setQuoteTitle(e.target.value)}
                placeholder="Objet du devis"
                className="tg-input rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 pt-1">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-1.5 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateQuoteLine(item.id, 'name', e.target.value)}
                    placeholder="Article / Service"
                    className="tg-input col-span-6 rounded-xl px-2.5 py-2 text-xs"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQuoteLine(item.id, 'qty', e.target.value)}
                    placeholder="Qté"
                    className="tg-input col-span-2 rounded-xl px-2 py-2 text-xs text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) => updateQuoteLine(item.id, 'price', e.target.value)}
                    placeholder="Prix"
                    className="tg-input col-span-3 rounded-xl px-2 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== item.id) : prev))}
                    className="col-span-1 flex justify-center cursor-pointer"
                    style={{ color: 'var(--tg-destructive)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuoteLine}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
              style={{ color: 'var(--tg-accent)' }}
            >
              <Plus className="w-4 h-4" /> Ajouter une ligne
            </button>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--tg-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--tg-hint)' }}>Total devis</span>
              <span className="text-base font-extrabold">{formatMoney(quoteTotal, currency)}</span>
            </div>

            <button
              type="button"
              onClick={saveAndCopyQuote}
              className="tg-btn w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedQuote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedQuote ? 'Devis sauvegardé & copié !' : 'Sauvegarder et copier pour Telegram'}
            </button>
          </div>

          {quotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold px-1">Devis récents</p>
              {quotes.map((q) => (
                <div key={q.id} className="tg-card rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{q.title} · {q.client}</p>
                    <p className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                      {q.date} · {formatMoney(q.total, q.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(buildQuoteText(q))}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--tg-accent)' }}
                      title="Recopier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuotes((prev) => prev.filter((item) => item.id !== q.id))}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--tg-destructive)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="tg-card rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold">Devise par défaut</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(CURRENCIES).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setCurrency(c.code);
                  }}
                  className="py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: currency === c.code ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                    color: currency === c.code ? 'var(--tg-button-text)' : 'var(--tg-text)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tg-card rounded-2xl p-4 space-y-2.5">
            <p className="text-sm font-bold">Export & Réinitialisation</p>
            <button
              type="button"
              onClick={exportCsv}
              disabled={transactions.length === 0}
              className="tg-btn w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exporter les transactions (CSV)
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirmAction('Effacer toutes les transactions enregistrées ?');
                if (ok) {
                  haptic('warning');
                  setTransactions([]);
                }
              }}
              className="w-full rounded-xl py-2 text-xs font-semibold cursor-pointer"
              style={{ color: 'var(--tg-destructive)', backgroundColor: 'var(--tg-secondary-bg)' }}
            >
              Effacer toutes les transactions
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
