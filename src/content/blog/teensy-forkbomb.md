---
title: "The world's smallest forkbomb"
publicationDate: 2024-01-25
description: "Making a teeny tiny forkbomb for x86_64 Linux."
---

First post? Wow. Anyway, I wanted to know what happens when you set off a really really small forkbomb. So I made one. Credit to [this excellent tutorial](https://www.muppetlabs.com/~breadbox/software/tiny/teensy.html), which pointed me in every direction I wanted to go.

# Huh?
I was bored. I'd just finished studying my uni's introductory Systems Programming course\*, which is infamous for resulting in accidental forkbombs. If a program was so small that it didn't really have anything to copy or anything to setup, would it even have much of an effect as a forkbomb?

As it turns out, it kinda doesn't.

\*Astute readers may notice that this means I took 2 years to write this blog post, to which I say... uhhh... no comment.

## The actual code
There's a mild story here about how I traipsed around the `elf.h` include file reading about how 64-bit executables work, but honestly, it's nothing that breadbox's tutorial (linked above) doesn't already cover. Go check that out if you're curious about how this stuff works, it's really good!

```asm
; forkbomb.asm

BITS 64
  org     0x401000
ehdr:                 ; Elf64_Ehdr
  db      0x7f, "ELF" ; e_ident magic bytes
  db      2,1,1,0     ; e_ident size/endianness
  db      0           ; 8 bytes of padding...
                      ; convenient!

code:                 ; let's hide the code in it
  mov     al, $39
  syscall
  jmp     code        ; this code is 6 bytes total

  db      0           ; split up the 0's for readelf

  dw      2           ; e_type
  dw      62          ; e_machine
  dd      1           ; e_version
  dq      code        ; e_entry
  dq      phdr - ehdr ; e_phoff
  dq      0           ; e_shoff
  dd      0           ; e_flags
  dw      phdr - ehdr ; e_ehsize
  dw      end - phdr  ; e_phentsize
  dw      1           ; e_phnum
  dw      0           ; e_shentsize
  dw      5           ; e_shnum
  dw      0           ; e_shstrndx

phdr:                 ; Elf64_Phdr
  dd      1           ; p_type
  dd      5           ; p_flags
  dq      0           ; p_offset
  dq      ehdr        ; p_vaddr
  dq      ehdr        ; p_paddr
  dq      end - ehdr  ; p_filesz
  dq      end - ehdr  ; p_memsz
  dq      0x1         ; p_align
end:
```

The biggest change is just that I'm dealing with 64-bit systems, which means I had to re-read `elf.h` for my system and work out the new sizes of things. That's not too hard. 

I do have one interesting novelty, though: you can apparently trick `readelf` into thinking your executable is totally legit by making sure the 1st and 8th bytes in the `e_ident` padding array are both zero. Apparently, it checks the first 8 magic bytes, which have real values, then checks the first and last bytes of the 0-padded section. So even though this is horrifically off-spec, even `readelf` thinks it's totally legit.

This assembles down to 120 bytes flat. (That's 960 bits. *Under 1000 bits.* That's astonishingly low. Like, if I was [running a universe-computer on the beach](https://xkcd.com/505/), I reckon this program would be less than 100 meters long.)

The last thing is that you might notice I've randomly set `e_shnum` to 5, even though we don't have 5 section headers. This *almost* lines up with the start of the program header struct (which is also 1 and 5, but larger-size integers), but I couldn't quite get it to work. I'll come back for those last 8 bytes... one day.

## But what it do?
As it turns out, if you compile and run this: not much. It's so tiny that it has a negligible effect on memory, even before you factor in that `fork(2)` copies-on-write. It's so insanely CPU-bound that you end up finding yourself staring at a list of 1000 forkbomb processes where only $num_cores_in_your_pc can actually be forking at a time.

I ran it for like, 10 minutes on a laptop with an i7-8550U and 16gb ram, and it just sorta... sat there. I could switch tabs out of my terminal and browse the web just fine. Wild.

### P.S.
If you really want to try it yourself, you can copy the code above. On my machine, it assembles with `nasm -f bin forkbomb.asm -o forkbomb`, but several fields in the elf64 struct are machine-specific, so it may refuse to work.

Alternatively, you can copy this base64 string, decode it, `chmod +x` the resulting file, and try running that*:

```
f0VMRgIBAQAAsDkPBev6AAIAPgABAAAACRBAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAOAABAAAA
BQAAAAEAAAAFAAAAAAAAAAAAAAAAEEAAAAAAAAAQQAAAAAAAeAAAAAAAAAB4AAAAAAAAAAEAAAAAAAAA
```

\*Please don't. You've got no idea what's in there. I just wanted to point out how neat it is that this forkbomb is small enough, even encoded, that it could theoretically be... idk, my facebook status or something.
