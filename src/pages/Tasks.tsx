import { useEffect, useState } from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, Calendar, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
interface FormState { title: string; description: string; priority: Priority; due_date: string; }
const defaultForm: FormState = { title: '', description: '', priority: 'medium', due_date: '' };

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  urgent: { color: '#ff5757', bg: '#ff575720', label: 'Urgent' },
  high: { color: '#f97316', bg: '#f9731620', label: 'High' },
  medium: { color: '#f5c518', bg: '#f5c51820', label: 'Medium' },
  low: { color: '#34d399', bg: '#34d39920', label: 'Low' },
};

export default function Tasks() {
  const { user, isGuest } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => { loadTasks(); }, [user, isGuest]);

  function getGuestData() { return JSON.parse(localStorage.getItem('focusforge_guest_data') || '{"habits":[],"tasks":[]}'); }
  function saveGuestData(data: { habits: unknown[]; tasks: Task[] }) { localStorage.setItem('focusforge_guest_data', JSON.stringify(data)); }

  async function loadTasks() {
    if (isGuest) {
      const data = getGuestData();
      setTasks(data.tasks);
      setLoading(false);
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    if (isGuest) {
      const data = getGuestData();
      const newTask: Task = { id: Date.now().toString(), user_id: 'guest', ...form, completed: false, due_date: form.due_date || null, created_at: new Date().toISOString() };
      data.tasks.unshift(newTask);
      saveGuestData(data);
      setTasks(data.tasks);
      setSaving(false);
      setShowForm(false);
      setForm(defaultForm);
      return;
    }
    await supabase.from('tasks').insert({ user_id: user!.id, ...form, due_date: form.due_date || null });
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    loadTasks();
  }

  async function toggleTask(task: Task) {
    if (isGuest) {
      const data = getGuestData();
      data.tasks = data.tasks.map((t: Task) => t.id === task.id ? { ...t, completed: !t.completed } : t);
      saveGuestData(data);
      setTasks(data.tasks);
      return;
    }
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
  }

  async function deleteTask(id: string) {
    if (isGuest) {
      const data = getGuestData();
      data.tasks = data.tasks.filter((t: Task) => t.id !== id);
      saveGuestData(data);
      setTasks(data.tasks);
      return;
    }
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(ts => ts.filter(t => t.id !== id));
  }

  const filtered = tasks.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed);
  const activePriorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
  const grouped = activePriorities.reduce((acc, p) => {
    acc[p] = filtered.filter(t => t.priority === p);
    return acc;
  }, {} as Record<Priority, Task[]>);

  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const isOverdue = (t: Task) => !t.completed && t.due_date && new Date(t.due_date) < new Date();

  return (
    <div className="flex-1 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Tasks</h1>
            <p className="text-white/40 text-sm mt-1">{activeCount} active · {completedCount} completed</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'New Task'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 border border-[#60a5fa]/20 animate-slide-up">
            <h3 className="font-bold text-white mb-4">Add New Task</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Task Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" className="input-field" />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details..." className="input-field resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Priority</label>
                  <div className="relative">
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="input-field appearance-none pr-10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {activePriorities.map(p => <option key={p} value={p} style={{ background: '#1a1a2e' }}>{PRIORITY_CONFIG[p].label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="input-field" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Add Task'}
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-[#60a5fa] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              {f} {f === 'all' ? `(${tasks.length})` : f === 'active' ? `(${activeCount})` : `(${completedCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <CheckSquare size={48} className="text-white/15 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">{filter === 'completed' ? 'No completed tasks' : 'No tasks here!'}</h3>
            <p className="text-white/40 mb-6">{filter === 'all' ? 'Start organizing your work by adding your first task.' : filter === 'active' ? 'All tasks are completed!' : 'Complete some tasks to see them here.'}</p>
            {filter !== 'completed' && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add Task</button>}
          </div>
        ) : (
          <div className="space-y-6">
            {activePriorities.map(priority => {
              const pTasks = grouped[priority];
              if (pTasks.length === 0) return null;
              const cfg = PRIORITY_CONFIG[priority];
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">{cfg.label} Priority</span>
                    <span className="text-white/30 text-xs">({pTasks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pTasks.map(task => (
                      <div key={task.id} className={`card flex items-start gap-3 habit-card-hover ${task.completed ? 'opacity-60' : ''}`} style={{ borderColor: isOverdue(task) ? '#ff575730' : undefined }}>
                        <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0 transition-all hover:scale-110">
                          {task.completed
                            ? <CheckCircle2 size={22} className="text-[#22c55e]" />
                            : <Circle size={22} className="text-white/20 hover:text-white/50" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium transition-all ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>{task.title}</p>
                          {task.description && <p className="text-white/40 text-sm mt-0.5 line-clamp-2">{task.description}</p>}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                            {task.due_date && (
                              <div className={`flex items-center gap-1 text-xs ${isOverdue(task) ? 'text-red-400' : 'text-white/40'}`}>
                                {isOverdue(task) ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                                {isOverdue(task) ? 'Overdue: ' : ''}{new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-all shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
