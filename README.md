# KCMPICKS - Sports Betting Tracker

> Track your picks. Beat the odds.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Authentication > Providers** and enable:
   - Email (enabled by default)
   - Google (add your OAuth credentials)
4. Copy `.env.example` to `.env.local` and add your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google + Email)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State:** Zustand

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── picks/        # Picks management
│   │   ├── live/         # Live scores
│   │   ├── stats/        # Statistics
│   │   ├── profile/      # User profile
│   │   └── leaderboard/  # Rankings
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # TopAppBar, BottomNavbar, FAB
│   └── ui/               # Reusable UI components
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── utils/            # Utility functions
│   └── constants/        # Sports data, achievements
└── types/                # TypeScript types
```

## 🎨 Design System

The design follows the "Digital Arena" aesthetic:
- **Fonts:** Space Grotesk (headlines), Inter (body)
- **Primary:** #0066FF (Electric Blue)
- **Tertiary:** #00e479 (Neon Green)
- **Surface:** #131318 (Deep Dark)
- **Glassmorphism** effects throughout
- **Mobile-first** with bottom navigation

## 📱 Features

- ✅ Landing page with live ticker
- ✅ Login/Register with Google OAuth
- ✅ Dashboard with stats & charts
- ✅ Live scores with real-time updates
- ✅ Picks management (CRUD)
- ✅ Statistics & analytics
- ✅ Profile with achievements
- ✅ Leaderboard rankings
- ✅ Dark theme (Digital Arena)
- ✅ Responsive mobile-first design

## 🏈 Supported Sports

- NBA
- NFL
- MLB
- Soccer
- UFC
- College Football
- College Basketball
- Women's Basketball (WNBA)

## 📄 License

Private - KCMPICKS
