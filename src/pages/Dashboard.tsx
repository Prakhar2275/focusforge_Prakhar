import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, CheckSquare, Timer, TrendingUp, Flame, Zap, Plus, ArrowRight, Award, Brain, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Habit, Task } from '../types';

interface Stats {
  totalHabits: number;
  completedToday: number;
  activeTasks: number;
  totalFocusMinutes: number;
  longestStreak: number;
}

const MOTIVATIONAL_QUOTES = [
  "Every habit is a vote for the person you want to become.",
  "Small steps, done consistently, create extraordinary results.",
  "The secret of your success is found in your daily routine.",
  "You don't rise to your goals. You fall to your systems.",
  "Discipline is choosing between what you want now and what you want most.",
];

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalHabits: 0, completedToday: 0, activeTasks: 0, totalFocusMinutes: 0, longestStreak: 0 });
  const [recentHabits, setRecentHabits] = useState<Habit[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const quote = MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (isGuest) {
      const data = JSON.parse(localStorage.getItem('focusforge_guest_data') || '{"habits":[],"tasks":[]}');
      setRecentHabits(data.habits.slice(0, 4));
      setUrgentTasks(data.tasks.filter((t: Task) => !t.completed).slice(0, 3));
      setStats({
        totalHabits: data.habits.length,
        completedToday: data.habits.filter((h: Habit) => h.completed_today).length,
        activeTasks: data.tasks.filter((t: Task) => !t.completed).length,
        totalFocusMinutes: 0,
        longestStreak: data.habits.reduce((m: number, h: Habit) => Math.max(m, h.streak || 0), 0),
      });
      setLoading(false);
      return;
    }
    if (!user) return;
    loadData();
  }, [user, isGuest]);

  async function loadData() {
    const [habitsRes, tasksRes, sessionsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user!.id).limit(4),
      supabase.from('tasks').select('*').eq('user_id', user!.id).eq('completed', false).limit(3),
      supabase.from('focus_sessions').select('duration_minutes').eq('user_id', user!.id).eq('completed', true),
    ]);

    const habits = habitsRes.data || [];
    const tasks = tasksRes.data || [];
    const sessions = sessionsRes.data || [];

    const allHabitsRes = await supabase.from('habits').select('streak, completed_today').eq('user_id', user!.id);
    const allHabits = allHabitsRes.data || [];

    setRecentHabits(habits as Habit[]);
    setUrgentTasks(tasks as Task[]);
    setStats({
      totalHabits: allHabits.length,
      completedToday: allHabits.filter(h => h.completed_today).length,
      activeTasks: tasks.length,
      totalFocusMinutes: sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0),
      longestStreak: allHabits.reduce((m, h) => Math.max(m, h.streak || 0), 0),
    });
    setLoading(false);
  }

  const completionRate = stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0;

  const statCards = [
    { label: 'Habits Today', value: `${stats.completedToday}/${stats.totalHabits}`, icon: Target, color: '#f5c518', bg: '#f5c51820', sub: `${completionRate}% complete` },
    { label: 'Active Tasks', value: stats.activeTasks, icon: CheckSquare, color: '#60a5fa', bg: '#60a5fa20', sub: 'pending completion' },
    { label: 'Focus Hours', value: `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m`, icon: Timer, color: '#34d399', bg: '#34d39920', sub: 'total focused time' },
    { label: 'Best Streak', value: `${stats.longestStreak}d`, icon: Flame, color: '#ff5757', bg: '#ff575720', sub: 'days in a row' },
  ];

  const priorityColors: Record<string, string> = { urgent: '#ff5757', high: '#f97316', medium: '#f5c518', low: '#34d399' };

  return (
    <div className="flex-1 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-white/40 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl font-black text-white">{user?.name?.split(' ')[0] || 'There'} <span className="text-gradient">✦</span></h1>
            <p className="text-white/50 text-sm mt-2 italic max-w-md">"{quote}"</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 glass rounded-xl px-4 py-2">
            <Star size={14} className="text-[#f5c518]" />
            <span className="text-white/60 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {isGuest && (
          <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <Zap size={16} className="text-amber-400 shrink-0" />
            <p className="text-amber-300/80 text-sm">You're in guest mode. <Link to="/signup" className="underline text-amber-300 hover:text-amber-200">Create an account</Link> to save your data permanently.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
            <div key={label} className="card habit-card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-black text-white mb-1">{loading ? '—' : value}</div>
              <div className="text-xs text-white/50 font-medium">{label}</div>
              <div className="text-xs text-white/30 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {stats.totalHabits > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm font-medium">Today's Progress</span>
              <span className="text-[#f5c518] text-sm font-bold">{completionRate}%</span>
            </div>
            <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #f5c518, #ff8c42)' }}
              />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#f5c518]" />
                <h3 className="font-bold text-white">Today's Habits</h3>
              </div>
              <Link to="/habits" className="text-xs text-white/40 hover:text-[#f5c518] flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : recentHabits.length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No habits yet</p>
                <Link to="/habits" className="inline-flex items-center gap-2 mt-3 text-[#f5c518] text-sm hover:text-[#e6b800] transition-colors">
                  <Plus size={14} /> Add your first habit
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentHabits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/6 transition-all">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: habit.color + '22' }}>
                      {habit.icon === 'target' ? '🎯' : habit.icon === 'brain' ? '🧠' : habit.icon === 'heart' ? '❤️' : habit.icon === 'book' ? '📚' : habit.icon === 'run' ? '🏃' : '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{habit.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Flame size={11} className="text-orange-400" />
                        <span className="text-white/40 text-xs">{habit.streak || 0} day streak</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${habit.completed_today ? 'bg-[#22c55e] border-[#22c55e]' : 'border-white/20'}`}>
                      {habit.completed_today && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-[#60a5fa]" />
                <h3 className="font-bold text-white">Priority Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs text-white/40 hover:text-[#60a5fa] flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : urgentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">All caught up!</p>
                <Link to="/tasks" className="inline-flex items-center gap-2 mt-3 text-[#60a5fa] text-sm hover:text-blue-300 transition-colors">
                  <Plus size={14} /> Add a task
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/6 transition-all">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: priorityColors[task.priority] || '#888' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: priorityColors[task.priority] + '22', color: priorityColors[task.priority] }}>
                          {task.priority}
                        </span>
                        {task.due_date && <span className="text-white/30 text-xs">{new Date(task.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/focus" className="card hover:border-[#ff5757]/30 transition-all group hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-[#ff5757]/20 flex items-center justify-center mb-4">
              <Timer size={22} className="text-[#ff5757]" />
            </div>
            <h3 className="font-bold text-white mb-1">Start Focus</h3>
            <p className="text-white/40 text-sm">Deep work session</p>
            <ArrowRight size={16} className="text-[#ff5757] mt-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/ai-chat" className="card hover:border-[#a78bfa]/30 transition-all group hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-[#a78bfa]/20 flex items-center justify-center mb-4">
              <Brain size={22} className="text-[#a78bfa]" />
            </div>
            <h3 className="font-bold text-white mb-1">AI Coach</h3>
            <p className="text-white/40 text-sm">Get personalized advice</p>
            <ArrowRight size={16} className="text-[#a78bfa] mt-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/analytics" className="card hover:border-[#34d399]/30 transition-all group hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-[#34d399]/20 flex items-center justify-center mb-4">
              <TrendingUp size={22} className="text-[#34d399]" />
            </div>
            <h3 className="font-bold text-white mb-1">Analytics</h3>
            <p className="text-white/40 text-sm">Track your progress</p>
            <ArrowRight size={16} className="text-[#34d399] mt-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {stats.longestStreak >= 7 && (
          <div className="mt-6 card border border-[#f5c518]/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#f5c518]/20 flex items-center justify-center">
                <Award size={24} className="text-[#f5c518]" />
              </div>
              <div>
                <p className="text-[#f5c518] font-bold">Achievement Unlocked!</p>
                <p className="text-white/60 text-sm">{stats.longestStreak} day streak — You're on fire! Keep it up!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
