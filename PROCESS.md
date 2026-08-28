# Process overview

A reading-guide to how Orbit came together.

## What I built

Orbit: a one-tap arcade game where you click, or press space, to launch a
satellite onto a ring spinning around a planet. Land far enough from every
satellite already on the ring — touch one and the round ends. Clear a round's
target count without a collision and the ring resets tighter and spins faster
for the next one; clear five rounds and you win outright. Everything you need
is visible before you touch anything: the ring turning, a pulsing launch pad,
and a translucent preview showing exactly where the next click will land. A
loss and a win look and read as distinct events — a collision shakes the
screen and leaves the two overlapping shots in red; a win floods the ring
gold. The single number the game is built around is `minSeparation`, the
angular gap a new satellite must keep from every other one — everything else
(the ring narrowing, the rotation speeding up, a round's target count) is that
one number changing over time.

## The moments that mattered

1. **The ring can look full and still refuse to call it full.** After a few
   rounds of real play, a screenshot showed the ring visibly packed — every
   satellite edge-to-edge with barely a gap anywhere — yet the next click was
   still forced through, and the resulting collision looked exactly like an
   ordinary loss. I sent that screenshot over and pushed back on the
   assumption behind my own first framing of the problem: I'd asked for a win
   condition to be designed, as if the game had none, but the more useful
   question turned out to be why a ring that visibly looked full wasn't being
   treated as full by whatever check already decided that. That reframing —
   bug in an existing check, not a missing feature — pointed the fix at the
   actual cause: the check compared the satellite count against an idealised,
   evenly-spaced capacity, which real, unevenly-timed clicks never match. The
   fix instead measures the true widest remaining gap on the ring, with unit
   tests pinning its behaviour at the exact boundary a satellite can still
   fit. I confirmed it by playing again with the same kind of uneven spacing
   that broke it originally, and watched the ring flash and reset into the
   next round without ever being forced into an unavoidable collision.
   [`5669eef`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-chajie0824/commit/5669eef)

2. **A loss with nothing visibly touching.** On an early playthrough, shots
   were failing well before they looked close to another satellite — the
   satellites on screen were small fixed dots, but the actual rule judged
   distance across a much wider angular arc. I flagged it as the most serious
   problem so far, since a loss that doesn't visibly match what happened
   breaks the game's basic fairness. The fix that would have been fastest —
   shrinking the collision rule to match the dots — would have quietly made
   the one rule the game is tested on more forgiving than intended, so I
   asked instead for the drawing to match the rule rather than the other way
   round. Every satellite and the shot preview now render as a wedge exactly
   `minSeparation` wide. I checked it by looking at a losing shot afterwards:
   the failed wedge visibly overlapped the satellite it clipped, the same
   overlap the collision check had computed.
   [`a6c8bd1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-chajie0824/commit/a6c8bd1)
