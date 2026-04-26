import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserX, Eye, EyeOff, Zap, Target, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { signIn, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate('/dashboard');
  }

  function handleGuest() {
    signInAsGuest();
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#070710] flex relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#f5c518]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#ff5757]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1a1a35]/50 rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative">
        <div className="max-w-md text-center">
          <div className="relative mb-10 animate-float">
            <div className="w-40 h-40 mx-auto relative">
              <div className="w-40 h-40 rounded-full bg-[#1e1e35] border-2 border-[#f5c518]/20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f5c518]/10 to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex gap-5">
                    <div className="w-8 h-8 rounded-full bg-[#f5c518] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#0a0a0f]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#f5c518] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#0a0a0f]" />
                    </div>
                  </div>
                  <div className="w-14 h-2 bg-[#f5c518] rounded-full" />
                </div>
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#ff5757] flex items-center justify-center animate-bounce-in">
                <Zap size={18} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            HEY! <span className="text-gradient">Welcome</span><br />back!
          </h1>
          <p className="text-white/50 text-lg mb-8">It's time to forge some habits. Your future self is waiting.</p>

          <div className="flex flex-col gap-3">
            {[
              { icon: Target, text: 'Track habits with streaks', color: '#f5c518' },
              { icon: Brain, text: 'AI-powered insights', color: '#60a5fa' },
              { icon: Zap, text: 'Deep focus sessions', color: '#ff5757' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-white/70 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="text-3xl font-black text-gradient">FocusForge</div>
            <p className="text-white/50 text-sm mt-1">AI Habit Tracker & Productivity Suite</p>
          </div>

          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Sign In</h2>
              <p className="text-white/40 text-sm mt-1">Welcome back to your productivity hub</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="input-field pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button onClick={handleGuest} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/25 transition-all text-sm">
              <UserX size={16} />
              Continue as Guest
            </button>

            <div className="mt-3 text-center">
              <p className="text-white/30 text-xs">Guest data is stored locally and not permanent</p>
            </div>

            <p className="text-center text-white/40 text-sm mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#f5c518] hover:text-[#e6b800] font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
