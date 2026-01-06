---
title: "Optimising the bejeezus out of max(x, 0)"
publicationDate: 2026-01-25
description: "Or \"Why you should just give up and use the stdlib.\""
---

Hayoh hayah pa'am... I was writing some code that needed to compute `max(x, 0)` quite a lot.
It's also relevant that this was for a university course *all about* optimisation.

So I figured, exactly how quick can you make `max(x, 0)`?

# Assumptions & Background
Before we embark on the fun stuff, I should expound on what and why first.

We're dealing with doubles. Specifically, IEEE 754 standard 64 bit floating point numbers. This is an arbitrary
choice, but being floating-point allows you to do some funny bit tricks, and I was originally working with doubles
anyway.

Also, it's always `max(x, 0)`. Not `max(x, y)`. We always know that one of the numbers we're comparing with
is zero - this is the core reason why I got into optimising it in the first place, because if you're comparing
arbitrary numbers, you basically have to just compare-and-branch.

All my testing was done with some extremely hand-rolled assembly wrappers. This is relevant, because it's the only way
to "beat" the standard library - more on that later.

# Versions & Times
I wrote three version of `max(x, 0)` in C++ first. The first one is the basic do-it-by-branching setup, but fixes a constant `0.0`, which might<sup>[*citation needed*]</sup> let the compiler make things faster.

The second one uses some cooked bit tricks - because the first bit of a floating-point number is the sign, we can effectively mask out the entire number based on whether or not it's negative.
Basically, you can get the first bit (the sign bit!) and transform it using only negations into a mask that is all 1s for a positive number, or all 0s for a negative number.

The third one uses the `VMAXPD` vector intrinsic, because intrinsic instructions are usually quick - but we'll have to see whether lengthy vector setup you need makes a difference.

Check it out:
```cpp
inline const double branching_max(const double& x) {
  if (x > 0.0) return x;
  return 0.0;
}

inline const double bit_max(const double &x) {
  std::uint64_t y; std::memcpy(&y, &x, sizeof(double));
  y = y & -!(y & (1ULL << 63));
  double z; std::memcpy(&z, &y, sizeof(double));

  return z;
}

inline const double vector_max(const double& x) {
  double v[4];
  _mm256_storeu_pd(v, _mm256_max_pd(_mm256_set1_pd(x), _mm256_setzero_pd()));
  return v[0];
}
```
(You'll note the wacky extra crap in the `bit_max()` version - this is to ensure it still typechecks, because it turns out compilers really don't like you casting from `double` to `uint64_t` and back anymore - even with pointer-casts and such. The compiler is smart enough to remove the memcpy calls anyway.)

# Phew
Ok, so, what did I find?

Firstly, if you're just writing C++ code, as I was originally... you can't beat the stdlib.
It doesn't matter how hard you optimise - `std::max()` just compiles into less instructions, even if you write
the exact same code yourself. I think this is to do with some magical pragmas that enable the compiler to skip a bunch
of security checks (e.g. stack canaries) but I was unable to replicate it, no matter how hard I tried.

But, if you're hand-rolling it, or you're doing it inline, you can make it much quicker by not branching.

Ve'hem ẖayu be'osher va'osher ad etzem hayom haz.
