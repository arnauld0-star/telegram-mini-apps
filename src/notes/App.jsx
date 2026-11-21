import { useMemo, useState } from 'react';
import {
  CheckSquare,
  StickyNote,
  Flame,
  Plus,
  Trash2,
  Pin,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { AppShell } from '../shared/AppShell';
import { useCloudState, haptic, confirmAction } from '../shared/telegram';

const TABS = [
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'habits', label: 'Habitudes', icon: Flame },
];

const PRIORITIES = [
  { id: 'high', label: 'Haute', color: '#ef4444' },
  { id: 'normal', label: 'Normale', color: '#3b82f6' },
  { id: 'low', label: 'Basse', color: '#6b7280' },
];

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      short: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase(),
    });
  }
  return days;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks');

  // --- Tasks ---
  const [tasks, setTasks] = useCloudState('tg_app1_tasks', []);
  const [taskInput, setTaskInput] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskFilter, setTaskFilter] = useState('all');

  // --- Notes ---
  const [notes, setNotes] = useCloudState('tg_app1_notes', []);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteQuery, setNoteQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // --- Habits ---
  const [habits, setHabits] = useCloudState('tg_app1_habits', [
    { id: 'h1', name: 'Boire 1,5 L d’eau', dates: [] },
    { id: 'h2', name: '30 min de lecture / veille', dates: [] },
  ]);
  const [habitInput, setHabitInput] = useState('');

  const last7Days = useMemo(() => getLast7Days(), []);
  const todayIso = last7Days[last7Days.length - 1].iso;

  const addTask = (e) => {
    e.preventDefault();
    const text = taskInput.trim();
    if (!text) return;
    haptic('light');
    setTasks((prev) => [
      { id: `${Date.now()}`, text, priority: taskPriority, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setTaskInput('');
  };

  const toggleTask = (id) => {
    haptic('success');
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id) => {
    haptic('warning');
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearDoneTasks = async () => {
    const ok = await confirmAction('Supprimer toutes les tâches terminées ?');
    if (!ok) return;
    haptic('medium');
    setTasks((prev) => prev.filter((t) => !t.done));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === 'todo') return !t.done;
      if (taskFilter === 'done') return t.done;
      return true;
    });
  }, [tasks, taskFilter]);

  const addNote = (e) => {
    e.preventDefault();
    const title = noteTitle.trim();
    const body = noteBody.trim();
    if (!title && !body) return;
    haptic('success');
    setNotes((prev) => [
      {
        id: `${Date.now()}`,
        title: title || 'Note rapide',
        body,
        pinned: false,
        updatedAt: new Date().toLocaleDateString('fr-FR'),
      },
      ...prev,
    ]);
    setNoteTitle('');
    setNoteBody('');
  };

  const togglePinNote = (id) => {
    haptic('light');
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const copyNote = async (note) => {
    const text = note.body ? `${note.title}\n\n${note.body}` : note.title;
    try {
      await navigator.clipboard.writeText(text);
      haptic('success');
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Ignore clipboard failure in restricted webviews
    }
  };

  const sortedNotes = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    return notes
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, noteQuery]);

  const addHabit = (e) => {
    e.preventDefault();
    const name = habitInput.trim();
    if (!name) return;
    haptic('success');
    setHabits((prev) => [...prev, { id: `${Date.now()}`, name, dates: [] }]);
    setHabitInput('');
  };

  const toggleHabitDate = (habitId, dateIso) => {
    haptic('success');
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.dates.includes(dateIso);
        return {
          ...h,
          dates: exists ? h.dates.filter((d) => d !== dateIso) : [...h.dates, dateIso],
        };
      })
    );
  };

  return (
    <AppShell
      title="Notes & Productivité"
      subtitle="Tâches, notes rapides & habitudes"
      icon={CheckSquare}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <form onSubmit={addTask} className="tg-card rounded-2xl p-3.5 space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Nouvelle tâche à faire..."
                className="tg-input flex-1 rounded-xl px-3 py-2 text-sm"
              />
              <button type="submit" className="tg-btn rounded-xl px-3.5 py-2 flex items-center justify-center cursor-pointer">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span style={{ color: 'var(--tg-hint)' }}>Priorité :</span>
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTaskPriority(p.id)}
                  className="px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                  style={{
                    backgroundColor: taskPriority === p.id ? p.color : 'var(--tg-secondary-bg)',
                    color: taskPriority === p.id ? '#fff' : 'var(--tg-hint)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>

          <div className="flex items-center justify-between text-xs">
            <div className="flex gap-1.5">
              {[
                { id: 'all', label: `Toutes (${tasks.length})` },
                { id: 'todo', label: `À faire (${tasks.filter((t) => !t.done).length})` },
                { id: 'done', label: `Faites (${tasks.filter((t) => t.done).length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTaskFilter(f.id)}
                  className="px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                  style={{
                    backgroundColor: taskFilter === f.id ? 'var(--tg-button)' : 'var(--tg-section-bg)',
                    color: taskFilter === f.id ? 'var(--tg-button-text)' : 'var(--tg-hint)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {tasks.some((t) => t.done) && (
              <button
                type="button"
                onClick={clearDoneTasks}
                className="font-medium cursor-pointer"
                style={{ color: 'var(--tg-destructive)' }}
              >
                Nettoyer
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="tg-card rounded-2xl p-6 text-center text-xs" style={{ color: 'var(--tg-hint)' }}>
              Aucune tâche ici. Ajoute ta première tâche ci-dessus !
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const prio = PRIORITIES.find((p) => p.id === task.priority) ?? PRIORITIES[1];
                return (
                  <div key={task.id} className="tg-card rounded-2xl p-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer"
                      style={{
                        borderColor: task.done ? 'var(--tg-button)' : 'var(--tg-hint)',
                        backgroundColor: task.done ? 'var(--tg-button)' : 'transparent',
                        color: '#fff',
                      }}
                    >
                      {task.done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm break-words ${task.done ? 'line-through opacity-50' : ''}`}>
                        {task.text}
                      </p>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: prio.color }}
                      />
                      <span className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                        {prio.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
                      style={{ color: 'var(--tg-destructive)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={addNote} className="tg-card rounded-2xl p-3.5 space-y-2.5">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Titre de la note..."
              className="tg-input w-full rounded-xl px-3 py-2 text-sm font-medium"
            />
            <textarea
              rows={3}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Idée, mémo, numéro, texte à garder..."
              className="tg-input w-full rounded-xl px-3 py-2 text-sm resize-none"
            />
            <button type="submit" className="tg-btn w-full rounded-xl py-2 text-sm font-semibold cursor-pointer">
              Enregistrer la note
            </button>
          </form>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tg-hint)' }} />
            <input
              type="text"
              value={noteQuery}
              onChange={(e) => setNoteQuery(e.target.value)}
              placeholder="Rechercher dans mes notes..."
              className="tg-input w-full rounded-xl pl-9 pr-3 py-2 text-sm"
            />
          </div>

          {sortedNotes.length === 0 ? (
            <div className="tg-card rounded-2xl p-6 text-center text-xs" style={{ color: 'var(--tg-hint)' }}>
              Aucune note enregistrée.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedNotes.map((note) => (
                <div key={note.id} className="tg-card rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold break-words">{note.title}</h3>
                      <span className="text-[11px]" style={{ color: 'var(--tg-hint)' }}>
                        {note.updatedAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePinNote(note.id)}
                        className="p-1.5 rounded-lg cursor-pointer"
                        style={{ color: note.pinned ? 'var(--tg-accent)' : 'var(--tg-hint)' }}
                        title="Épingler"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyNote(note)}
                        className="p-1.5 rounded-lg cursor-pointer"
                        style={{ color: 'var(--tg-hint)' }}
                        title="Copier"
                      >
                        {copiedId === note.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                        className="p-1.5 rounded-lg cursor-pointer"
                        style={{ color: 'var(--tg-destructive)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {note.body && (
                    <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--tg-text)' }}>
                      {note.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'habits' && (
        <div className="space-y-4">
          <form onSubmit={addHabit} className="tg-card rounded-2xl p-3.5 flex gap-2">
            <input
              type="text"
              value={habitInput}
              onChange={(e) => setHabitInput(e.target.value)}
              placeholder="Nouvelle habitude quotidienne..."
              className="tg-input flex-1 rounded-xl px-3 py-2 text-sm"
            />
            <button type="submit" className="tg-btn rounded-xl px-3.5 py-2 cursor-pointer">
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="space-y-2.5">
            {habits.map((habit) => {
              const doneToday = habit.dates.includes(todayIso);
              return (
                <div key={habit.id} className="tg-card rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{habit.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: doneToday
                            ? 'color-mix(in srgb, #22c55e 16%, transparent)'
                            : 'var(--tg-secondary-bg)',
                          color: doneToday ? '#16a34a' : 'var(--tg-hint)',
                        }}
                      >
                        {habit.dates.length} j
                      </span>
                      <button
                        type="button"
                        onClick={() => setHabits((prev) => prev.filter((h) => h.id !== habit.id))}
                        className="p-1 cursor-pointer"
                        style={{ color: 'var(--tg-destructive)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {last7Days.map((day) => {
                      const active = habit.dates.includes(day.iso);
                      const isToday = day.iso === todayIso;
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() => toggleHabitDate(habit.id, day.iso)}
                          className="py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer border"
                          style={{
                            backgroundColor: active ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
                            color: active ? 'var(--tg-button-text)' : 'var(--tg-hint)',
                            borderColor: isToday ? 'var(--tg-accent)' : 'transparent',
                          }}
                        >
                          <span>{day.short}</span>
                          <span>{day.iso.slice(8)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
