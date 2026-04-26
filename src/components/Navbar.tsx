import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Timer, MessageSquare, BarChart3, LogOut, ChevronDown, Zap, Menu, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Target, label: 'Habits' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/focus', icon: Timer, label: 'Focus Mode' },
  { to: '/ai-chat', icon: MessageSquare, label: 'AI Coach' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Navbar() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const avatar = user?.avatar || null;
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <aside className={`fixed left-0 top-0 h-full w-64 glass border-r border-white/8 z-40 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f5c518] flex items-center justify-center">
              <Zap size={20} className="text-[#0a0a0f]" />
            </div>
            <div>
              <p className="font-black text-white text-lg leading-none">FocusForge</p>
              <p className="text-white/30 text-xs mt-0.5">Productivity Suite</p>
            </div>
          </div>
        </div>

        {isGuest && (
          <div className="mx-4 mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs">Guest mode — data not permanently saved</p>
          </div>
        )}

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/6 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#f5c518]/20 border border-[#f5c518]/30 flex items-center justify-center text-[#f5c518] font-bold text-sm shrink-0">
                {avatar ? <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : initials}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-white/40 text-xs truncate">{isGuest ? 'Guest Mode' : (user?.email || '')}</p>
              </div>
              <ChevronDown size={14} className={`text-white/30 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-xl overflow-hidden border border-white/10 animate-slide-up">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                >
                  <LogOut size={16} />
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center text-white"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}
