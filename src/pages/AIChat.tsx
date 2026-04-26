import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Trash2, Sparkles, RotateCcw, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Message { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hey! I'm your AI productivity coach. I can help you build better habits, optimize your focus sessions, manage tasks, and stay motivated. What's on your mind today?",
  created_at: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  "Give me a morning routine",
  "How to build a reading habit?",
  "Tips for deep focus",
  "How to stop procrastinating?",
  "Best habits for productivity",
  "Motivate me!",
];

const AI_RESPONSES: Record<string, string> = {
  morning: `**Great morning routine for productivity:**\n\n1. **Wake up at a consistent time** — your circadian rhythm loves routine\n2. **No phone for 30 min** — protect your morning mental clarity\n3. **Hydrate** — drink 500ml water before coffee\n4. **Move** — 10-20 min walk or light exercise\n5. **Review your top 3 tasks** for the day\n6. **Deep work block** — tackle your hardest task before 10am\n\nConsistency beats perfection. Start with just 2-3 of these!`,
  reading: `**Building a reading habit that sticks:**\n\n• **Start tiny** — 5 pages per day, not 50\n• **Same time, same place** — habit stacks to existing routines (e.g., after coffee)\n• **Keep the book visible** — out of sight, out of mind\n• **Track your streak** — momentum is motivating\n• **Read physical books** before bed — better sleep too\n• **Don't break the streak** — even 1 page counts\n\nThe goal is building the *identity* of a reader first. The volume follows naturally.`,
  focus: `**Deep focus techniques that work:**\n\n**The Pomodoro Method:** 25 min work → 5 min break, repeat 4x → 20 min break\n\n**Environment design:**\n• Remove phone from workspace entirely\n• Use noise-canceling headphones\n• Browser extensions to block distractions\n• A dedicated "focus" playlist\n\n**Mindset:**\n• Commit to just *starting* — momentum follows\n• One task at a time, no multitasking\n• Track your sessions with FocusForge!\n\nConsistency over intensity. 2 deep hours beats 8 distracted hours.`,
  procrastinate: `**Science-backed procrastination busters:**\n\n**The 2-minute rule:** If it takes less than 2 minutes, do it NOW.\n\n**Implementation intentions:** Instead of "I'll exercise", say "I'll exercise at 7am in the living room"\n\n**Temptation bundling:** Pair tasks you dislike with things you enjoy\n\n**The 5-second rule:** Count 5-4-3-2-1 and physically move\n\n**Shrink the task:** "I'll just open the document" — starting is the hardest part\n\n**Root causes:** Often procrastination = fear of failure, perfectionism, or task overwhelm. Identify which one!`,
  productivity: `**Top habits of highly productive people:**\n\n1. **Time blocking** — schedule specific tasks, not just goals\n2. **Weekly reviews** — reflect, adjust, plan ahead\n3. **Single-tasking** — monotasking is 40% more efficient than multitasking\n4. **Energy management** — schedule hard tasks during peak energy\n5. **Digital sunset** — no screens 1h before bed\n6. **Done list** — track what you accomplished (not just what's left)\n7. **Saying no** — protecting your time is a productivity skill\n\nPick 1-2 to implement this week, not all 7!`,
  motivate: `**YOU'VE GOT THIS!** 🔥\n\nRemember why you started. The version of you that takes action today is the version you'll be proud of tomorrow.\n\n*"You don't rise to the level of your goals, you fall to the level of your systems."* — James Clear\n\nHere's what I see in your FocusForge data:\n• Every habit check you complete is a vote for who you're becoming\n• Every focus session is neural rewiring — your brain is literally changing\n• Every task completed builds momentum\n\n**Start with the smallest possible step right now.** Not tomorrow. Not after coffee. NOW. What's one tiny action you can take in the next 5 minutes?`,
  habit: `**The science of habit formation:**\n\n**The Habit Loop:** Cue → Routine → Reward\n\n**To build new habits:**\n• Make it obvious (cue placement)\n• Make it attractive (habit stacking with enjoyable things)\n• Make it easy (reduce friction, start tiny)\n• Make it satisfying (immediate reward)\n\n**Identity-based habits work best:**\nInstead of "I want to read more" → "I am a reader"\nInstead of "I want to exercise" → "I am someone who moves daily"\n\n**The 2-day rule:** Never miss twice. One missed day is human, two in a row becomes a new habit.`,
  default: `That's a great question! Based on productivity research and habit science, here's what I'd recommend:\n\n**Focus on systems, not goals.** Goals tell you where to go; systems are what actually get you there.\n\n**Key principles:**\n1. Start smaller than you think — tiny habits compound exponentially\n2. Environment design beats willpower every time\n3. Track your progress — what gets measured gets managed\n4. Celebrate small wins — dopamine drives behavior\n\nWould you like me to dive deeper into any specific area? I can help with habit building, focus techniques, task prioritization, or motivation strategies!`,
};

function generateResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('morning') || lower.includes('routine') || lower.includes('wake')) return AI_RESPONSES.morning;
  if (lower.includes('read')) return AI_RESPONSES.reading;
  if (lower.includes('focus') || lower.includes('deep work') || lower.includes('concentrate')) return AI_RESPONSES.focus;
  if (lower.includes('procrastinat') || lower.includes('start') || lower.includes('lazy')) return AI_RESPONSES.procrastinate;
  if (lower.includes('productiv') || lower.includes('efficient') || lower.includes('best habit')) return AI_RESPONSES.productivity;
  if (lower.includes('motiv') || lower.includes('inspire') || lower.includes('help me')) return AI_RESPONSES.motivate;
  if (lower.includes('habit') || lower.includes('build') || lower.includes('routine')) return AI_RESPONSES.habit;
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return "Hey there! Great to see you. Ready to crush your goals today? What can I help you with — habits, focus, tasks, or just need some motivation?";
  if (lower.includes('thanks') || lower.includes('thank you')) return "You're welcome! Remember — consistency beats intensity. Keep showing up every day, and the results will follow. Anything else I can help with?";
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnout')) return "**Signs of burnout need attention!**\n\n• **Rest is productive** — your brain consolidates learning during rest\n• Take a real break today — not just a 5 min phone scroll\n• Review your commitments — are you doing too much?\n• Prioritize sleep (7-9 hours) above everything\n• Single tasking reduces cognitive load significantly\n\nSometimes the most productive thing is to slow down. Be kind to yourself today!";
  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('rest')) return "**Optimizing your sleep for productivity:**\n\n• **Consistent schedule** — same bedtime/wake time, even weekends\n• **Digital sunset** — no screens 1h before bed (blue light disrupts melatonin)\n• **Cool room** — 65-68°F / 18-20°C is optimal for sleep\n• **No caffeine after 2pm** — caffeine has a 5-6 hour half-life\n• **Wind-down routine** — reading, stretching, or journaling\n\nSleep is when your brain consolidates habits and clears waste. It's your #1 productivity tool!";
  return AI_RESPONSES.default;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const parts = msg.content.split(/\*\*(.*?)\*\*/g);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUser ? 'bg-[#f5c518]/20' : 'bg-[#a78bfa]/20'}`}>
        {isUser ? <User size={16} className="text-[#f5c518]" /> : <Bot size={16} className="text-[#a78bfa]" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-[#f5c518] text-black rounded-tr-sm font-medium' : 'glass text-white/85 rounded-tl-sm'}`}>
        {isUser ? msg.content : parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : <span key={i}>{part}</span>)}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { user, isGuest } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isGuest && user) loadMessages();
  }, [user, isGuest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function loadMessages() {
    const { data } = await supabase.from('chat_messages').select('*').eq('user_id', user!.id).order('created_at').limit(50);
    if (data && data.length > 0) {
      setMessages([INITIAL_MESSAGE, ...(data as Message[])]);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, created_at: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setThinking(true);

    if (!isGuest && user) {
      await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content });
    }

    await new Promise(r => setTimeout(r, 800 + Math.random() * 800));

    const response = generateResponse(content);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, created_at: new Date().toISOString() };
    setMessages(m => [...m, aiMsg]);
    setThinking(false);

    if (!isGuest && user) {
      await supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: response });
    }
  }

  async function clearHistory() {
    if (!isGuest && user) {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
    }
    setMessages([INITIAL_MESSAGE]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex-1 flex flex-col h-screen lg:h-auto animate-fade-in overflow-hidden">
      <div className="p-6 lg:p-8 pb-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <Brain size={22} className="text-[#a78bfa]" />
              <h1 className="text-3xl font-black text-white">AI Coach</h1>
              <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Online</span>
              </div>
            </div>
            <p className="text-white/40 text-sm mt-1">Your personal productivity intelligence</p>
          </div>
          <button onClick={clearHistory} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Clear chat">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 pt-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {thinking && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/20 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[#a78bfa]" />
              </div>
              <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#a78bfa]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="p-4 lg:p-6 pt-2 border-t border-white/8">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="shrink-0 text-xs px-3 py-1.5 glass rounded-lg text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5">
                <Sparkles size={10} className="text-[#a78bfa]" />
                {p}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me about habits, focus, productivity..."
              className="input-field flex-1"
              disabled={thinking}
            />
            <button type="submit" disabled={!input.trim() || thinking} className="btn-primary px-5 shrink-0 disabled:opacity-40">
              {thinking ? <RotateCcw size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
