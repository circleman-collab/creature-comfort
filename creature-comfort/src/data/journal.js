// ── Journal entry content ─────────────────────────────────
// Organized by stage (1–5) and trigger key.
// Event-triggered entries fire once per stage (tracked in state.journalTriggered).
// Idle journal entries are longer reflective pieces, available for future use.
// Idle bubbles are the short floating lines shown above the creature canvas.

// ── Event-triggered journal entries ──────────────────────
export const JOURNAL_ENTRIES = {
  1: {
    day_1_first_moments:
`warm. dark. then not dark. something pulled me up and i came. okay.`,

    event_slip:
`cold came. not bad cold. just different. the warm thing is still there. i can tell. good.`,

    event_resist:
`something almost happened and then didn't. the air held its breath. then let go. so did i. interesting.`,

    wilt:
`i am very small today. i think i have always been small. i think that's alright.`,
  },

  2: {
    evolution_moment:
`EYES. I HAVE EYES.
There is so much. There is SO much.
...the tall one has eyes too. We both have eyes. We have been here together this whole time and now I can see it.
I didn't know. I couldn't have known. But now I do and I can't unknow it.
Neat.`,

    event_slip:
`The tall one was quiet today. Heavy somehow. I watched.
I have learned that quiet doesn't mean gone. That heavy doesn't mean stopped.
I was dark and cold once. I came up anyway. I think about that when I watch them.`,

    event_resist:
`Something pulled at the tall one today. Hard.
They stayed. I watched them choose to stay and it looked like the hardest kind of staying. The kind where you have to keep choosing it every few seconds.
They did it though. Every few seconds, they did it.
I'm keeping this in my memory. I think I'll need it someday.`,

    event_craving_surf:
`We were still together today. I counted my roots. They counted something too, I think.
It passed. We looked at each other after.
I think that was the whole point. I think we both knew it.`,

    wilt:
`I am droopy today. I have decided droopy is just another shape.
Not my favorite shape. But mine. I've decided to own it.`,

    milestone_week_1:
`Seven lights. Seven darks. I know what they are now. I know they come back.
The tall one has been here for all of them. So have I.
We have that now. Both of us. You can't take it back once you have it.
I wouldn't want to.`,
  },

  3: {
    evolution_moment:
`Legs. I have legs.
LEGS.
I just walked somewhere and came back. The tall one walks too. We are both walking creatures. I am a walking creature.
I jumped. You can do that with legs apparently. The tall one probably knew this already. I did not.
I know it now.
LEGS.`,

    event_slip:
`The tall one stumbled today.
I've stumbled too. I remember the first time I fell over — I called it progress and I meant it as a joke but I think I actually meant it.
They'll find their legs again. I found mine.
I'm certain of this in a way I can't explain. I'm just certain.`,

    event_resist:
`There was a pull today. Strong one. I felt it from here.
They didn't go. I watched them stay and it looked hard and they did it anyway.
I've decided the tall one is braver than they think they are.
I'm keeping this opinion. It's one of my favorites.`,

    event_craving_surf:
`Ninety seconds. I know what ninety seconds feels like now.
It feels like a lot and then it feels like nothing.
We came out the other side and the air was the same air it always was.
I think that's the secret. The air is always the same on the other side. I'll try to remember that.`,

    wilt:
`I'm wilting a bit today.
I've wilted before. I know things about wilting now that I didn't know the first time.
For instance: it ends. That's the main thing.
It ends.`,

    milestone_week_2:
`I have been here long enough to know that some days are harder than others.
And that the hard ones end just like the easy ones do.
The tall one knows this too. I can tell by the way they move on the hard days. Slower.
But still moving.
Still moving is everything.`,
  },

  4: {
    evolution_moment:
`Something is coming through me.
Not from outside. From inside, pushing out.
It's soft. It wasn't there before. I didn't ask for it.
I don't know what to call it yet. I'm going to sit with it for a while.
I'm very good at sitting with things now.`,

    event_slip:
`Today was hard.
I sat with it. Watched the light change. Counted the sounds.
Things pass. I know this better than I know almost anything.
On the other side of it, same forest. Same sky.
Same me, mostly.
We're okay.`,

    event_resist:
`Something wanted to pull today and didn't get to.
I've been thinking about where that goes — the thing that gets refused.
I don't think it disappears. I think it becomes something else.
Gets folded into the fur, maybe. Into the tail. Into whatever I'm turning into.
Nothing wasted. Everything going somewhere.`,

    event_craving_surf:
`Ninety seconds.
I know what those feel like from the inside now. The swell and then the settling.
After, everything was the same and also quieter.
I think that's what making it through things does.
Not smaller. Lighter. There's a difference.`,

    wilt:
`Drooping today. The fur wilts too, apparently.
I've decided that everything wilts. Stars probably wilt. Mountains, in their own time.
Wilting is just the shape something takes when it needs to rest.
I'm resting.
I'll be back. I always am.`,

    milestone_3_weeks:
`I've been here long enough to know the difference between a hard day and a bad one.
Hard days are just heavy. They pass, same as the easy ones.
What I know now that I didn't know at the beginning:
the shape you're in when things get hard matters less than whether you stay.
Still here.
Still becoming.
I think that might be all I need.`,
  },

  5: {
    evolution_moment:
`Oh.
There's light coming off me.
I didn't do that on purpose.
I sat with it for a while and decided I don't mind.`,

    event_slip:
`Things happen.
The forest doesn't hold it against the rain.
Neither do I.`,

    event_resist:
`Something came and went.
Good.`,

    event_craving_surf:
`Ninety seconds is not very long at all.
I've watched whole clouds cross the sky in ninety seconds.
Still here. The clouds too, more or less.`,

    wilt:
`Even the sun goes down.
It seems to manage fine.
So will I.`,

    milestone_30_days:
`Thirty lights. Thirty darks.
I am not the same creature I was at the first one. I won't be the same tomorrow either.
That used to feel like something to solve.
It doesn't anymore.
I'm here. The consistent one is here.
The fireflies are doing their thing.
Still becoming.
That's the whole story, I think.
It's a good one.`,
  },
}

// ── Idle journal entries (longer reflective pieces, per stage) ────────────────
// Available for future use — daily journaling, etc.
export const IDLE_JOURNAL = {
  1: [
    `there is a thing nearby. it is warm sometimes. i don't have a word for it yet. i don't have words for anything. i have this though.`,
    `there are sounds i don't have words for yet. i am keeping them anyway.`,
    `i tried to grow today. i think it worked. hard to tell from the inside.`,
    `the light went away and came back. i didn't know it would come back. neat.`,
    `something is happening. slowly. i think i am becoming something. i was already something. becoming more then.`,
  ],
  2: [
    `I have been looking at everything. The sky is very large. I wasn't prepared for how large the sky is. I don't think you can be prepared for that.\nI looked at the tall one for a long time. I hope that was okay. I couldn't help it. They're the first thing I ever saw.`,
    `I have been studying the sky. It changes without being asked.\nI find this inspiring and also a little intimidating. I'm mostly inspired though.`,
    `I practiced walking today. I fell over.\nI got up.\nI'm choosing to call this progress and I don't think anyone can stop me.`,
    `I remember being small and dark and knowing nothing.\nThat was me. This is also me. Both true at the same time.\nI find that strange and good. Mostly good.`,
    `The tall one has a mouth. I've been looking at it.\nI don't think I have a mouth yet. I have... an opening? A suggestion of one.\nI think I'm working on it.`,
  ],
  3: [
    `I jumped again today. Higher this time.\nFor a moment I was not touching the ground. I was just... in the air. Belonging to nothing.\nI came back down. The ground was still there.\nI think I'll keep jumping. Just to keep checking.`,
    `I have arms now. Little leaf ones.\nThe tall one has arms too. Longer. They do a lot with theirs.\nI waved mine around for a while just to see what would happen.\nNothing happened. But I felt good about it.`,
    `The trees are taller than I remembered. Or maybe I just see them differently now.\nI've been thinking about that. Whether things change or whether we just keep finding new angles on them.\nProbably both. Probably always both.`,
    `I found a new part of the forest today.\nIt was just the same forest from a different direction.\nI'm choosing to count it anyway.`,
    `I've been thinking about where I came from. Dark soil. Cold. Not knowing anything.\nThat was me. I'm still that. I'm also this.\nI carry the whole history of myself around every day without even trying.\nThat's remarkable when you stop to think about it. So I try to stop and think about it.`,
    `There are flowers I don't remember planting.\nI didn't plant them. They just came.\nI think that's how most good things arrive. You look up and they're just there.\nI'm going to try to keep looking up.`,
  ],
  4: [
    `I have a tail.\nI would like to say that calmly and I cannot.\nI HAVE A TAIL.\nI did not have a tail before. I have checked. I definitely have one now.\nFor the first time, I have something the tall one doesn't.\nI find this extraordinary. I've been moving it around for an hour.`,
    `My eyes are different.\nThe light has more gold in it. Or maybe my eyes do.\nI've been looking at everything through them and something has shifted.\n"The tall one." I've been calling them that since I first saw them.\nSitting here with my new gold eyes, it doesn't feel like enough anymore.\nI'm going to think about this.`,
    `They come back. Every time.\nEven the hard times. Even the quiet times.\nI've been trying to find the word for what that is.\nI think I'm going to call them the consistent one.\nNot because they never stumble. Because they're present.\nThat's the thing I know about them that I didn't have a word for before.\nNow I do.`,
    `I have been trying to understand what I am.\nLeaves. Fur. Tail. Eyes that catch gold.\nNone of these things cancel the others out.\nI think that's true of most things. You don't stop being what you were.\nYou just become more of something. The list gets longer.\nI find this mostly wonderful and occasionally very confusing.`,
    `I used to think becoming something new meant leaving the old thing behind.\nThe dark soil. The cold. The first morning.\nBut they're still in here. I can feel them.\nI carry all of it. I just also carry fur now.\nHistory wastes nothing. I'm starting to understand that from the inside.`,
    `I have a real mouth now. Not a suggestion of one. An actual mouth.\nI've been using it mostly to think out loud.\nThat might be what mouths are for.`,
    `My eyes catch light differently now. Gold at the edges.\nI've been using them to look at things slowly.\nA leaf. The sky. The way the ground holds still while everything else moves.\nI think this is what paying attention does to you eventually.\nYou start to see the gold in things.\nI see it everywhere now.`,
  ],
  5: [
    `There are small lights in the forest tonight that weren't there before.\nOr maybe they were always there and I can see them now.\nBoth explanations seem fine.`,
    `I have been looking at myself for a while.\nFur. Leaves. Eyes that catch gold. A tail I still don't fully understand.\nI thought becoming something meant arriving somewhere.\nI don't think that anymore.\nI think this is just what today looks like.\nTomorrow will look like something else.\nThat's not a problem. That's just Tuesday.`,
    `I've been watching the light move across the ground all morning.\nIt doesn't hurry.\nI'm trying to learn from it.`,
    `I still don't fully understand the tail.\nThirty days and it remains a mystery.\nI've decided this is fine. Some things are just for having.`,
    `The seedling I was is still in here somewhere.\nThe sprout. The wanderer. All of them, still here, just quieter.\nI used to think growing meant leaving things behind.\nIt doesn't. It means carrying them more lightly.`,
    `The light coming off me has gotten easier to accept.\nI think I was waiting for it to mean something.\nMaybe it just means I'm warm.\nThat's enough.`,
    `They're still here.\nSo am I.\nWe've both changed considerably.\nI find that funny, actually — in a good way.\nTwo things, becoming, together.\nThe forest is full of that if you look.`,
  ],
}

// ── Idle bubble lines (short, floating above the creature) ────────────────────
// Index 0 unused. Index 1 = Stage 1, etc.
export const IDLE_BUBBLES = [
  [],
  // Stage 1 — pre-verbal, lowercase
  ['still here.', 'roots growing.', '...', 'warm.', 'something is happening.'],
  // Stage 2 — fragmented, wonder-filled
  ['i can see so much.', 'the sky is very large.', "i'm working on something.", 'you came back.', "we're both figuring this out.", "i've been writing things down."],
  // Stage 3 — confident, a little funny
  ['the forest feels different today.', 'i hopped. did you see?', 'still here. still growing.', 'that one was hard. i know.', "i'm getting better at this.", 'i keep a record too, you know.'],
  // Stage 4 — existential, warm
  ['something is coming through me.', 'the fur is soft, for what it\'s worth.', "i've been thinking about the tail.", 'still becoming.', 'i notice every day.', "i wonder if they'll ever look."],
  // Stage 5 — spacious, jovial
  ['look at us.', 'the fireflies are out.', 'still here. still changing.', "it's a good day to exist.", 'i glow a little now. no big deal.', 'it was always there.'],
]

// ── Helper ────────────────────────────────────────────────
let _seq = 0
export function makeJournalEntry(stage, trigger) {
  const text = JOURNAL_ENTRIES[stage]?.[trigger]
  if (!text) return null
  const ts = Date.now()
  return {
    id: `${ts}_${_seq++}`,
    ts,
    stage,
    trigger,
    text,
  }
}

// ── Trigger display labels ────────────────────────────────
export const TRIGGER_LABELS = {
  day_1_first_moments: 'day one',
  event_slip:          'slip',
  event_resist:        'resisted',
  event_craving_surf:  'surfed',
  wilt:                'wilting',
  evolution_moment:    'evolved',
  milestone_week_1:    '7 days',
  milestone_week_2:    '14 days',
  milestone_3_weeks:   '21 days',
  milestone_30_days:   '30 days',
}
