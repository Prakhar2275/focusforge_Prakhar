# FocusForge

AI-powered habit tracker and productivity suite built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- Habit tracking with streaks and daily progress
- Task management with priority levels and due dates
- Focus Mode (Pomodoro-style) with tab-switch detection
- AI productivity coach with contextual responses
- Analytics dashboard with weekly activity charts
- Guest mode (local storage) — no account required
- Email/password authentication via Supabase

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/focusforge.git
cd focusforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

Run the migration file in your Supabase SQL editor:

```
supabase/migrations/20260412183416_create_focusforge_tables.sql
```

### 5. Run the dev server

```bash
npm run dev
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (auth + database)
- React Router v6
- Lucide React icons
