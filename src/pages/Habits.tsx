import { useEffect, useState } from 'react';
import { Target, Plus, Flame, Trash2, CheckCircle, Circle, CreditCard as Edit3, X, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Habit } from '../types';

const HABIT_COLORS = ['#f5c518', '#ff5757', '#60a5fa', '#34d399', '#f97316', '#a78bfa', '#fb7185', '#2dd4bf'];
const HABIT_ICONS = [
  { key: 'target', emoji: '🎯', label: 'Target' },
  { key: 'brain', emoji: '🧠', label: 'Brain' },
  { key: 'heart', emoji: '❤️', label: 'Health' },
  { key: 'book', emoji: '📚', label: 'Read' },
  { key: 'run', emoji: '🏃', label: 'Exercise' },
  { key: 'water', emoji: '💧', label: 'Water' },
  { key: 'sleep', emoji: '😴', label: 'Sleep' },
  { key: 'code', emoji: '💻', label: 'Code' },
  { key: 'meditate', emoji: '🧘', label: 'Meditate' },
  { key: 'food', emoji: '🥗', label: 'Eat Well' },
  { key: 'music', emoji: '🎵', label: 'Music' },
  { key: 'sun', emoji: '☀️', label: 'Morning' },
];

interface FormState { name: string; description: string; color: string; icon: string; frequency: 'daily' | 'weekly'; }
const defaultForm: FormState = { name: '', description: '', color: '#f5c518', icon: 'target', frequency: 'daily' };

function getEmoji(key: string) {
  return HABIT_ICONS.find(i => i.key === key)?.emoji || '✨';
}

export default function Habits() {
  const { user, isGuest } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadHabits();
  }, [user, isGuest]);

  function getGuestData() {
    return JSON.parse(localStorage.getItem('focusforge_guest_data') || '{"habits":[],"tasks":[]}');
  }
  function saveGuestData(data: { habits: Habit[]; tasks: unknown[] }) {
    localStorage.setItem('focusforge_guest_data', JSON.stringify(data));
  }

  async function loadHabits() {
    if (isGuest) {
      const data = getGuestData();
      setHabits(data.habits);
      setLoading(false);
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setHabits((data as Habit[]) || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Habit name is required'); return; }
    setSaving(true);

    if (isGuest) {
      const data = getGuestData();
      if (editingId) {
        data.habits = data.habits.map((h: Habit) => h.id === editingId ? { ...h, ...form } : h);
      } else {
        const newHabit: Habit = { id: Date.now().toString(), user_id: 'guest', ...form, streak: 0, best_streak: 0, completed_today: false, last_completed: null, created_at: new Date().toISOString() };
        data.habits.unshift(newHabit);
      }
      saveGuestData(data);
      setHabits(data.habits);
      setSaving(false);
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      return;
    }

    if (editingId) {
      await supabase.from('habits').update({ name: form.name, description: form.description, color: form.color, icon: form.icon, frequency: form.frequency }).eq('id', editingId);
    } else {
      await supabase.from('habits').insert({ user_id: user!.id, ...form });
    }
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    setEditingId(null);
    loadHabits();
  }

  async function toggleComplete(habit: Habit) {
    const newCompleted = !habit.completed_today;
    const today = new Date().toISOString().split('T')[0];

    if (isGuest) {
      const data = getGuestData();
      data.habits = data.habits.map((h: Habit) => {
        if (h.id !== habit.id) return h;
        const newStreak = newCompleted ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1);
        return { ...h, completed_today: newCompleted, last_completed: newCompleted ? today : h.last_completed, streak: newStreak, best_streak: Math.max(h.best_streak || 0, newStreak) };
      });
      saveGuestData(data);
      setHabits(data.habits);
      return;
    }

    const newStreak = newCompleted ? (habit.streak || 0) + 1 : Math.max(0, (habit.streak || 0) - 1);
    await supabase.from('habits').update({
      completed_today: newCompleted,
      last_completed: newCompleted ? today : habit.last_completed,
      streak: newStreak,
      best_streak: Math.max(habit.best_streak || 0, newStreak),
    }).eq('id', habit.id);

    if (newCompleted) {
      await supabase.from('habit_completions').insert({ habit_id: habit.id, user_id: user!.id });
    }
    loadHabits();
  }

  async function deleteHabit(id: string) {
    if (isGuest) {
      const data = getGuestData();
      data.habits = data.habits.filter((h: Habit) => h.id !== id);
      saveGuestData(data);
      setHabits(data.habits);
      return;
    }
    await supabase.from('habits').delete().eq('id', id);
    setHabits(h => h.filter(x => x.id !== id));
  }

  function startEdit(habit: Habit) {
    setForm({ name: habit.name, description: habit.description, color: habit.color, icon: habit.icon, frequency: habit.frequency as 'daily' | 'weekly' });
    setEditingId(habit.id);
    setShowForm(true);
  }

  const completedCount = habits.filter(h => h.completed_today).length;
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="flex-1 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Habits</h1>
            <p className="text-white/40 text-sm mt-1">{completedCount}/{habits.length} completed today</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setForm(defaultForm); setEditingId(null); }} className="btn-primary">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'New Habit'}
          </button>
        </div>

        {habits.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Daily Progress</span>
              <span className="text-[#f5c518] font-bold text-sm">{pct}%</span>
            </div>
            <div className="h-3 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f5c518,#ff8c42)' }} />
            </div>
            {pct === 100 && <p className="text-[#22c55e] text-sm font-bold mt-2 text-center animate-bounce-in">All habits complete! Amazing job! 🎉</p>}
          </div>
        )}

        {showForm && (
          <div className="card mb-6 border border-[#f5c518]/20 animate-slide-up">
            <h3 className="font-bold text-white mb-4">{editingId ? 'Edit Habit' : 'Create New Habit'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Habit Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Morning Meditation" className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this habit involve?" className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {HABIT_ICONS.map(({ key, emoji, label }) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, icon: key }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xl transition-all ${form.icon === key ? 'bg-[#f5c518]/20 border border-[#f5c518]/40' : 'bg-white/5 hover:bg-white/10'}`}
                      title={label}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Frequency</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setForm(ff => ({ ...ff, frequency: f }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${form.frequency === f ? 'bg-[#f5c518] text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : (editingId ? 'Update Habit' : 'Create Habit')}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-4xl">🎯</div>
            <h3 className="text-white font-bold text-xl mb-2">No habits yet</h3>
            <p className="text-white/40 mb-6">Start building your routine. Small actions, compounded daily, create remarkable results.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add First Habit</button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => (
              <div key={habit.id} className={`card habit-card-hover flex items-center gap-4 cursor-pointer ${habit.completed_today ? 'border-[#22c55e]/20' : ''}`} style={{ borderColor: habit.completed_today ? habit.color + '30' : undefined }}>
                <button onClick={() => toggleComplete(habit)} className="shrink-0 transition-all hover:scale-110">
                  {habit.completed_today
                    ? <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: habit.color }}><CheckCircle size={22} className="text-[#0a0a0f]" /></div>
                    : <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: habit.color + '60' }}><Circle size={22} className="text-white/20" /></div>
                  }
                </button>
                <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center shrink-0" style={{ background: habit.color + '20' }}>
                  {getEmoji(habit.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold transition-all ${habit.completed_today ? 'line-through text-white/40' : 'text-white'}`}>{habit.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40 capitalize">{habit.frequency}</span>
                  </div>
                  {habit.description && <p className="text-white/40 text-sm truncate mt-0.5">{habit.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-400" />
                      <span className="text-white/50 text-xs">{habit.streak || 0} day streak</span>
                    </div>
                    {habit.best_streak > 0 && (
                      <div className="flex items-center gap-1">
                        <ChevronUp size={12} className="text-[#f5c518]" />
                        <span className="text-white/30 text-xs">best: {habit.best_streak}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(habit)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteHabit(habit.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
