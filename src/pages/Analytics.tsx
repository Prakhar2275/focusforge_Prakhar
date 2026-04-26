import { useEffect, useState } from 'react';
import { TrendingUp, Target, Timer, CheckSquare, Flame, Award, BarChart3, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalHabits: number;
  completedToday: number;
  totalTasks: number;
  completedTasks: number;
  totalFocusMinutes: number;
  focusSessions: number;
  avgTabSwitches: number;
  longestStreak: number;
  weeklyCompletion: number[];
  habitBreakdown: { name: string; streak: number; color: string; completed: boolean }[];
  recentSessions: { duration: number; completed: boolean; tab_switches: number; started_at: string }[];
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof TrendingUp; color: string }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-white/50 text-sm font-medium">{label}</div>
      {sub && <div className="text-white/30 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const { user, isGuest } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user, isGuest]);

  async function loadAnalytics() {
    if (isGuest) {
      const guestRaw = localStorage.getItem('focusforge_guest_data');
      const guestData = guestRaw ? JSON.parse(guestRaw) : { habits: [], tasks: [] };
      setData({
        totalHabits: guestData.habits.length,
        completedToday: guestData.habits.filter((h: { completed_today: boolean }) => h.completed_today).length,
        totalTasks: guestData.tasks.length,
        completedTasks: guestData.tasks.filter((t: { completed: boolean }) => t.completed).length,
        totalFocusMinutes: 0,
        focusSessions: 0,
        avgTabSwitches: 0,
        longestStreak: guestData.habits.reduce((m: number, h: { streak?: number }) => Math.max(m, h.streak || 0), 0),
        weeklyCompletion: [0, 0, 0, 0, 0, 0, 0],
        habitBreakdown: guestData.habits.slice(0, 6).map((h: { name: string; streak: number; color: string; completed_today: boolean }) => ({ name: h.name, streak: h.streak || 0, color: h.color, completed: h.completed_today })),
        recentSessions: [],
      });
      setLoading(false);
      return;
    }

    if (!user) return;

    const [habitsRes, tasksRes, sessionsRes, completionsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('completed').eq('user_id', user.id),
      supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
      supabase.from('habit_completions').select('completed_at').eq('user_id', user.id),
    ]);

    const habits = habitsRes.data || [];
    const tasks = tasksRes.data || [];
    const sessions = sessionsRes.data || [];
    const completions = completionsRes.data || [];

    const now = new Date();
    const weeklyCompletion = Array(7).fill(0);
    completions.forEach((c: { completed_at: string }) => {
      const d = new Date(c.completed_at);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        const dayIndex = (now.getDay() - diffDays + 7) % 7;
        weeklyCompletion[dayIndex]++;
      }
    });

    const completedSessions = sessions.filter((s: { completed: boolean }) => s.completed);

    setData({
      totalHabits: habits.length,
      completedToday: habits.filter((h: { completed_today: boolean }) => h.completed_today).length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: { completed: boolean }) => t.completed).length,
      totalFocusMinutes: completedSessions.reduce((s: number, sess: { duration_minutes: number }) => s + (sess.duration_minutes || 0), 0),
      focusSessions: completedSessions.length,
      avgTabSwitches: sessions.length > 0 ? Math.round(sessions.reduce((s: number, sess: { tab_switches: number }) => s + (sess.tab_switches || 0), 0) / sessions.length * 10) / 10 : 0,
      longestStreak: habits.reduce((m: number, h: { streak?: number }) => Math.max(m, (h as { streak?: number }).streak || 0), 0),
      weeklyCompletion,
      habitBreakdown: habits.slice(0, 6).map((h: { name: string; streak?: number; color: string; completed_today: boolean }) => ({ name: h.name, streak: h.streak || 0, color: h.color, completed: h.completed_today })),
      recentSessions: sessions.slice(0, 5).map((s: { duration_minutes: number; completed: boolean; tab_switches: number; started_at: string }) => ({
        duration: s.duration_minutes,
        completed: s.completed,
        tab_switches: s.tab_switches,
        started_at: s.started_at,
      })),
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const taskCompletion = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
  const habitCompletion = data.totalHabits > 0 ? Math.round((data.completedToday / data.totalHabits) * 100) : 0;
  const focusHours = Math.floor(data.totalFocusMinutes / 60);
  const focusMins = data.totalFocusMinutes % 60;
  const maxWeekly = Math.max(...data.weeklyCompletion, 1);
  const todayDayIndex = new Date().getDay();

  return (
    <div className="flex-1 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Your productivity insights</p>
          </div>
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
            <Calendar size={14} className="text-white/40" />
            <span className="text-white/50 text-sm">All time</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Habits Today" value={`${data.completedToday}/${data.totalHabits}`} sub={`${habitCompletion}% done`} icon={Target} color="#f5c518" />
          <StatCard label="Tasks Done" value={`${data.completedTasks}/${data.totalTasks}`} sub={`${taskCompletion}% complete`} icon={CheckSquare} color="#60a5fa" />
          <StatCard label="Focus Time" value={`${focusHours}h ${focusMins}m`} sub={`${data.focusSessions} sessions`} icon={Timer} color="#34d399" />
          <StatCard label="Best Streak" value={`${data.longestStreak}d`} sub="longest run" icon={Flame} color="#ff5757" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <Activity size={16} className="text-[#f5c518]" /> Weekly Habit Activity
            </h3>
            <div className="flex items-end gap-2 h-32">
              {data.weeklyCompletion.map((count, i) => {
                const isToday = i === todayDayIndex;
                const height = maxWeekly > 0 ? (count / maxWeekly) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end" style={{ height: 96 }}>
                      <div
                        className="w-full rounded-t-lg transition-all duration-700"
                        style={{
                          height: `${Math.max(height, count > 0 ? 8 : 2)}%`,
                          background: isToday ? 'linear-gradient(180deg, #f5c518, #e6b800)' : count > 0 ? 'rgba(245,197,24,0.3)' : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-[#f5c518]' : 'text-white/30'}`}>{DAYS[i]}</span>
                    {count > 0 && <span className="text-xs text-white/40">{count}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#60a5fa]" /> Completion Rates
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Habits Today', value: habitCompletion, color: '#f5c518', detail: `${data.completedToday}/${data.totalHabits}` },
                { label: 'Tasks Overall', value: taskCompletion, color: '#60a5fa', detail: `${data.completedTasks}/${data.totalTasks}` },
                { label: 'Focus Success', value: data.focusSessions > 0 ? 100 : 0, color: '#34d399', detail: `${data.focusSessions} completed` },
              ].map(({ label, value, color, detail }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/60 text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">{detail}</span>
                      <span className="font-bold text-sm" style={{ color }}>{value}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {data.habitBreakdown.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                <Target size={16} className="text-[#f5c518]" /> Habit Streaks
              </h3>
              <div className="space-y-3">
                {data.habitBreakdown.map(habit => (
                  <div key={habit.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: habit.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium truncate ${habit.completed ? 'text-white/80' : 'text-white/50'}`}>{habit.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Flame size={12} className="text-orange-400" />
                          <span className="text-white/60 text-xs font-bold">{habit.streak}d</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%`, background: habit.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <Timer size={16} className="text-[#34d399]" /> Focus Sessions
            </h3>
            {data.recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Timer size={32} className="text-white/15 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No focus sessions yet</p>
                <p className="text-white/30 text-xs mt-1">Start your first session to see data here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/4 rounded-xl">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${session.completed ? 'bg-[#34d399]' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{session.duration} min session</p>
                      <p className="text-white/40 text-xs">{new Date(session.started_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-medium ${session.completed ? 'text-[#34d399]' : 'text-red-400'}`}>
                        {session.completed ? 'Complete' : 'Cancelled'}
                      </span>
                      {session.tab_switches > 0 && (
                        <p className="text-orange-400/70 text-xs">{session.tab_switches} switches</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {data.longestStreak >= 3 && (
          <div className="mt-6 card border border-[#f5c518]/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f5c518]/20 flex items-center justify-center shrink-0">
              <Award size={24} className="text-[#f5c518]" />
            </div>
            <div>
              <p className="text-white font-bold">Streak Milestone</p>
              <p className="text-white/50 text-sm">Your longest streak is <span className="text-[#f5c518] font-bold">{data.longestStreak} days</span>. Keep compounding those wins!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
