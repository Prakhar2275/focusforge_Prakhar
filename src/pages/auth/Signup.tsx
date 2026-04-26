import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Chrome, UserX, Eye, EyeOff, Rocket, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Signup() {
  const { signUp, signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, name);
    setLoading(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) setError(err);
  }

  function handleGuest() {
    signInAsGuest();
    navigate('/dashboard');
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-white/50">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070710] flex relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#f5c518]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative">
        <div className="max-w-md text-center">
          <div className="relative mb-10">
            <div className="w-44 h-44 mx-auto relative animate-float">
              <div className="w-44 h-44 rounded-full bg-[#1e2035] border-2 border-[#22c55e]/20 flex items-center justify-center">
                <div className="relative">
                  <Rocket size={60} className="text-[#f5c518]" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff5757] flex items-center justify-center text-white text-xs font-bold">!</div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            Oh yeah,<br /><span className="text-gradient">you ready?!</span>
          </h1>
          <p className="text-white/50 text-lg mb-8">Start building awesome habits today. Your journey begins here.</p>

          <div className="flex flex-col gap-3">
            {[
              'Build streaks that last',
              'AI coach learns your patterns',
              'Focus sessions that protect your time',
              'Analytics to visualize growth',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <CheckCircle size={16} className="text-[#22c55e] shrink-0" />
                <span className="text-white/70 text-sm font-medium">{item}</span>
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
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-white/40 text-sm mt-1">Join thousands building better habits</p>
            </div>

            <button onClick={handleGoogle} disabled={googleLoading} className="btn-secondary w-full mb-4">
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : <Chrome size={18} />}
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">or create with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-white/60 text-sm font-medium mb-2 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="input-field pl-11"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    placeholder="Min. 6 characters"
                    className="input-field pl-11 pr-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: i <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strengthColors[passwordStrength] || 'rgba(255,255,255,0.3)' }}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : "Let's Start!"}
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

            <p className="text-center text-white/40 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#f5c518] hover:text-[#e6b800] font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
