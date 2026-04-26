export interface User {
  id: string;
  email?: string;
  name?: string;
  provider: 'local' | 'google' | 'guest';
  avatar?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  color: string;
  icon: string;
  streak: number;
  best_streak: number;
  completed_today: boolean;
  last_completed: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  completed: boolean;
  tab_switches: number;
  started_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface GuestData {
  habits: Habit[];
  tasks: Task[];
}
