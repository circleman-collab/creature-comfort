# Creature Comfort

A quit companion. Your creature grows as you do.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import your repo
3. Framework: Vite (auto-detected)
4. Click Deploy

That's it. Vercel handles everything. You'll get a URL you can open in Safari and add to your home screen.

## Add to iPhone home screen

1. Open your Vercel URL in Safari
2. Tap the Share button
3. "Add to Home Screen"
4. It runs full-screen, no browser chrome

## Project structure

```
src/
  hooks/
    useStore.js       — state, persistence, all game logic
  utils/
    pixelRenderer.js  — canvas pixel art engine
  components/
    CreatureCanvas.jsx — animated canvas wrapper
    BottomNav.jsx      — tab navigation
  screens/
    Onboarding.jsx     — first-run flow
    Home.jsx           — creature + timer + actions
    CravingSurf.jsx    — 90s breathing timer
    Intentions.jsx     — why you're doing this
    Stats.jsx          — all data, log, history
  App.jsx              — root, orchestration
  index.css            — design system, variables
```

## Creature stages

| Stage | Trigger        | Form                          |
|-------|---------------|-------------------------------|
| 1     | Start         | Seedling, just a sprout       |
| 2     | 3 days clean  | Sprout with eyes + root-feet  |
| 3     | 1 week clean  | Leafy creature, can hop       |
| 4     | 2 weeks clean | Fur growing through the leaves|
| 5     | 1 month clean | Full animal, glowing, lush    |

## Grace mechanic

One slip: creature wilts within its current stage. Recovers with clean time.
Two slips within 3 hours: creature drops a stage.
Clean time always heals. Rewards are bigger than punishments.

## Roadmap (v2)

- [ ] Real sprite sheets / hand-drawn pixel art
- [ ] Craving mini-game
- [ ] NewGame+ (transitory habit second arc)
- [ ] Endgame: "help someone else" mechanic
- [ ] Social: creatures visiting other users
- [ ] Push notifications
- [ ] Supabase backend for social features
