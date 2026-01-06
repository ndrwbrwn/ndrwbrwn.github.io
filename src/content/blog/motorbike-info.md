---
title: "The SWM Gran Milano 440"
publicationDate: 2026-01-26
description: "Owning a motorbike without a lick of dealer support."
cover: "../../images/swm-gm.jpg"
coverAlt: "An image with a side-view of a single-cylinder motorbike."
---

Yeki bud, yeki nabud... I decided to buy a motorbike. Specifically an SWM Gran Milano 440.
These bikes are great, and I would highly recommend them to anyone who's mildly mechanical
and interested in getting into motorbikes: single-cylinder with minimal gadgetry means they're
easy to work on, but 440cc means they're not completely incapable of highway riding.

Anyway I've done a bunch of stuff to mine and I've learned a lot of things along the way, and
I feel like there's benefit in these things being online *somewhere*, in the vain hope that the
next poor sod who tries to work on the same stuff might possibly find this post and learn from it.

## Tools
**Get a 14mm deep socket.** Mine is 1/4" but it doesn't really matter. Lots of things require
taking the seat off, and if you have a 14mm deep socket you can just do that, instead of having to
fiddle with the rear mudguard first.

**Get a spark plug spanner.** I got [this](https://www.wemoto.com.au/bike/swm/gran-milano/440/2016/16416/spark-plug-spanner) one, which is handy also because the tip of it is a 12mm hex; this is the
exact size needed to take out the front axle.

## Torque Specs
I haven't been able to find a full shop manual for these. If you have, please, for the love of god,
send it to me and I will love you forever. But in lieu of that, I've just been tightening things with
slightly-increasing torque numbers until it feels about the same effort to get them as it was
originally.

Some of these numbers are:
- Tappet cover small bolts: 9Nm
- Tappet cover main bolt: 60Nm
- Valve covers: 35Nm
- Top engine mount, chassis-side bolts: 40Nm
- Top engine mount, engine-side bolt: 60Nm

## Wire Colours
Towards the back of the bike, relevant wire colours include:
- Green: ground
- Brown: tail light (always on)
- Green w. yellow stripe: brake light
- Teal: right indicator
- Red: left indicator

And towards the front:
- Brown: daytime running light (also always on)
- White: headlight (on with ignition)
- Blue: high beam

## Finding Parts
I don't have a suuuper great source of parts here. If you need something super specific to the bike,
good luck. For bolts, especially tappet-cover-bolts (easy to break, if you don't know torque
specs...), I've used [Pro-Bolt Australia](https://www.probolt-australia.com/).

I do have one super specific recommendation: the rocker arm adjusting screws (and corresponding
lock nuts) are M7, therefore very tricky to find. Turns out, though, the *old* Yamaha XT250 also
had M7 rocker-arm-adjuster screws, so if you go to a Yamaha dealership you can still get them
that way. (Part number will be edited in here soon.)

## Particular Issues
There's a few specific things that I've done that were weird. Here they are.

### Single-seat brake light
It always dies (the triangle one). Unfortunately it's a sealed unit
so you can't just replace the bulb. When I bought my bike, it was already dead, so I figured it
couldn't get worse and I cut it open. *Turns out*, the reason they always die, is that the
inward-facing LEDs for the actual brake light (not the tail light) get hot. Too hot. There's
2x2x2 resistors (2 PCBs with 2 banks of 2 resistors) attached to them, and of those, 7/8 had
*melted off the PCB*. Nice one.

Anyway, I managed to kludge together a fix. It results in a slightly lower wattage (and
therefore dimmer) brake light, which may be unsafe, but it still seems highly visible enough for
my personal risk assessment, so YMMV. The strategy I followed was:
- Saw the light apart through the black plastic piece. Try and make this cut fairly clean.
- Drill a ~10mm hole through the back of the reflector cup.
- Buy a bright red W5W / T10 LED -- I got [this](https://www.ledperf.com.au/led-bulb-t10-xtrem-hp-red-w5w-p-426.html). Red is better than white, because it means 100% of the wattage input is getting translated into light-that-you-can-see-outside-the-housing.
- Put said bright-red bulb into any T10 socket you can buy, and poke this through the drilled hole.
- Carefully splice and solder the T10 socket into the existing brake light cables.
- To refit the cut-in-half housing, take three M8 nuts and bolts.
- For the nuts, find a high-strength glue product. I used high-temp JB-weld, because I can manually force it to "set" by heating the metal nuts with a soldering iron.
- Using the high-strength glue product of your choice, glue one nut into each of the three corners of the main light (i.e. the bit that's still attached to the clear plastic).
- Then, drill 3x 8mm holes in the other bit, lined up with those nuts. You should be able to feed the M8 bolts through now, and tighten them up against the glued-in-place nuts.
- I recommend whacking a bunch of silicone sealant over the whole thing once it's retightened, just to prevent water getting in and ruining all your hard work.

Voila! Hopefully, with a bit of dumb ingenuity, you have now fixed your SWM GM 440's original
single-seat brake light, thus saving you the cost of buying a whole new rear seat assembly.

### Side panels
They often fall off. The traditional way to resolve this is with a bunch of twisted-up-wire
that ties them on. Alternatively, I've tried fixing this by using silicone sealant to bodge-together
some "custom" rubber inserts that are substantially tighter, and this also seems to have worked.

Qesse ye mā be sar resid, kalāqe be xunaš naresid.
