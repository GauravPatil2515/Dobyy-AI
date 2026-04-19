# Textile Concepts Guide

For developers, designers, and users unfamiliar with weaving terminology.

## Fundamental Terms

### Fabric
A structure made by interlacing two sets of threads at right angles:
- **Warp** — vertical threads (set up first)
- **Weft** — horizontal threads (woven through)

Think of it like a grid: warp is columns, weft is rows (or vice versa, depending on perspective).

### Sett
The **color sequence of warp threads** in a tartan.

Written as: `R/6 K/2 G/4`
- R = Red
- 6 = Six threads
- K = Black
- 2 = Two threads
- G = Green
- 4 = Four threads

So: 6 red threads, then 2 black, then 4 green (reading left to right).

### Thread Count
Total number of warp threads in the sett pattern.

Example: `R/6 K/2 G/4` = 6 + 2 + 4 = **12 total threads**

This 12-thread pattern repeats across the full loom width.

---

## Warp vs Weft

### Warp (Vertical)
- Set up on the loom **before** weaving starts
- Threads run **lengthwise** on the fabric
- "The foundation"

**In Dobby Studio:** The sett defines warp colors.

### Weft (Horizontal)  
- Woven **through** the warp with a shuttle or loom
- Threads run **widthwise** on the fabric
- "The fill"

**In Dobby Studio:** Weft uses the same sett colors (by default) for balanced tartans.

### Visual
```
Warp (vertical)     Weft (horizontal)
|  |  |  |          ——————————
|  |  |  |          ——————————
|  |  |  |          ——————————
```

When woven together at right angles, they create the fabric surface.

---

## Reflective Repeat (Mirror/Pivot Repeat)

How **real tartans are actually woven** — not just a simple copy-paste.

### Simple Repeat (❌ Wrong for tartans)
```
Sett:  R R R G G K K
Rep 1: [R R R G G K K]
Rep 2: [R R R G G K K]
Rep 3: [R R R G G K K]
```

Result: Looks tiled, loses symmetry, not authentic.

### Reflective Repeat (✅ Correct for tartans)
```
Sett:      R R R G G K K
Forward:   [R R R G G K K]
Reverse:   [K K G G R R R]  ← mirror image
Full:      [R R R G G K K | K K G G R R R]
Result:    [R R R G G K K K K G G R R R]  ← palindrome!
```

The pattern **mirrors around the center** — perfectly symmetrical.

### Why It Matters

**Aesthetically:** Symmetrical, balanced, professional  
**Technically:** How looms actually weave (to avoid breaking threads at repeat boundaries)  
**Authentically:** This is Scottish tartan standard since the 1800s

### Double vs Single Weaving
- **Double-sided** — Both edges cross at endpoints (NOT done)
- **Single-sided** — Pivot point eliminates doubling (CORRECT)

Dobby Studio uses **single-sided reflective repeat** — the right way.

---

## EPI & PPI (Physical Dimensions)

Convert thread counts into real-world fabric measurements.

### EPI — Ends Per Inch
**How many warp threads fit in 1 inch**

- **20 EPI** — Very loose, open weave (gauzy)
- **40 EPI** — Medium weight (common) 
- **60 EPI** — Dense, fine (luxury)
- **100+ EPI** — Very tight (specialty)

Typical tartan: **40–60 EPI**

### PPI — Picks Per Inch  
**How many weft passes fit in 1 inch**

- **20 PPI** — Loose (airy)
- **40–50 PPI** — Standard (balanced)
- **80+ PPI** — Very dense

Typical tartan: **40–50 PPI**

### Example Calculation
```
Sett: 20 threads
EPI: 50 threads per inch
PPI: 48 picks per inch

Repeat width = (20 threads ÷ 50 threads/inch) × 2.54 cm/inch
            = 0.4 inch = 1.02 cm

Repeat height = (20 threads ÷ 48 picks/inch) × 2.54 cm/inch
             = 0.42 inch = 1.06 cm

Physical size of one repeat: 1.02 cm × 1.06 cm
```

### Warp Ends for a Bolt
How many threads to set up on a loom for a 150cm width:

```
Repeat width = 1.02 cm
Number of repeats in 150cm = 150 ÷ 1.02 = 147 repeats
Total threads = 147 × 20 threads/repeat = 2,940 threads
```

Mill order: "Set warp for 2,940 ends at 50 EPI"

---

## Weave Structures

The **pattern of interlacing** between warp and weft.

### Plain Weave (1/1)
```
Warp  →  # # # #
Weft  ↓  # # # #
         # # # #
         # # # #
```

- Over 1, under 1 (checkerboard pattern)
- **Simplest weave**
- **Strength:** Medium (balanced)
- **Drape:** Flexible
- **Appearance:** Grid-like, no diagonals
- **Use:** Checks, ginghams, lightweight tartans

### Twill Weaves
Pattern shifts by one thread each row → creates **diagonal lines**.

#### 2/2 Twill (Most Common Tartan)
```
Warp over 2, Weft under 2 (offset per row)
```

Diagonal appears at 45°
- **Strength:** Very strong (two-over-two)
- **Drape:** Good structure, holds shape
- **Appearance:** Clear diagonal weave lines
- **Use:** Traditional tartans, heavy fabrics

#### 2/1 Twill
```
Warp over 2, Weft under 1 (asymmetrical)
```

More pronounced diagonal
- **Strength:** Good (asymmetry creates texture)
- **Drape:** Better drape than 2/2
- **Appearance:** Stronger diagonal
- **Use:** Elegant tartans, formal wear

### Satin Weave (5-End)
```
Warp floats over 4, under 1 (offset)
```

Creates **smooth, lustrous surface**
- **Floats:** 4–5 threads pass over without crossing
- **Strength:** Lower (long floats weaken fabric — max 6 is safe)
- **Drape:** Excellent, silky drape
- **Appearance:** Smooth, shiny surface
- **Use:** Luxury fabrics, formal evening wear

### Float Definition
A **float** is when a thread passes over (or under) **multiple crossing threads** without interlacing.

```
Example: 5-end satin with 4 floats
[————] ← warp thread "floats" over 4 weft threads
[  ^  ] ← no crossing here
[  ^  ] ← no crossing here  
[  ^  ] ← no crossing here
[__^__] ← finally interlaces here
```

Longer floats = weaker fabric. Satin is luxury but fragile.

---

## Loom Types in Weaving Industry

### Dobby Loom
- **Shafts:** 4, 8, 16, 32 (limited)
- **Patterns:** Geometric, repeat-based (like tartans)
- **Complexity:** Simple to moderate
- **Cost:** Affordable
- **Thread:** Can control 32 threads independently
- **Dobby Studio is for:** This type!

### Jacquard Loom
- **Shafts:** Each thread individual (thousands)
- **Patterns:** Any image possible (photographic)
- **Complexity:** Unlimited
- **Cost:** Very expensive
- **Flexibility:** Any design, any image
- **Used for:** Brocades, damasks, complex tapestries

### Handloom
- **Shafts:** 4–8 typically
- **Speed:** Slow (artisan)
- **Patterns:** Geometric or simple
- **Flexibility:** Moderate
- **Cost:** Labor intensive
- **Used for:** Artisan fabrics, heritage weaving

**Dobby Studio:** Designs for **dobby looms** (geometric repeats). Not suitable for jacquard designs (which need individual thread control).

---

## WIF — Weave Interchange Format

An **open standard** for saving weave designs so they work in multiple software programs.

### Why It Exists
Different weaving software used to be incompatible:
- WeavePoint (.wif)
- ArahWeave (.rah)
- Fiberworks (.fwf)

WIF 1.1 standard created so files transfer between programs.

### What WIF Contains

#### [THREADING] Section
Maps each warp thread to its shaft:
```
[THREADING]
1
2
3
4
3
2
1
2
(pattern repeats)
```

Thread 1 goes to shaft 1, thread 2 to shaft 2, etc.

#### [TREADLING] Section
Maps each weft pick to treadles:
```
[TREADLING]
1
2
3
4
3
2
1
(pattern repeats)
```

#### [TIEUP] Section
Mechanical matrix: which shafts raise when which treadles pressed:
```
[TIEUP]
1,0,0,0          ← treadle 1 raises shaft 1
0,1,0,0          ← treadle 2 raises shaft 2
...
```

#### [COLOR TABLE]
RGB values for each color:
```
[COLOR TABLE]
0: 255,0,0           ← red
1: 0,0,0             ← black
2: 0,128,0           ← green
```

#### [WARP] & [WEFT] Sections
Thread specifications:
```
[WARP]
Threads: 100
Color: 0
...

[WEFT]
Threads: 100
Color: 0
...
```

### Dobby Studio WIF Export
✅ Includes all sections  
✅ Compatible with WeavePoint, ArahWeave, PixeLoom, Fiberworks  
✅ Ready to send to mills  

---

## Color Spaces in Fabric Design

### RGB (Red, Green, Blue)
**Digital representation**

Used on screens, digital files.
- R: 0–255
- G: 0–255
- B: 0–255

Example: Red = RGB(255, 0, 0)

**Dobby Studio:** Uses RGB for canvas rendering.

### Hex Color Notation
**Shorthand for RGB**

`#RRGGBB`

Example: Red = #FF0000

**Dobby Studio:** Uses hex for sett storage.

### CMYK (Cyan, Magenta, Yellow, Key/Black)
**Print color model**

Used in physical fabric mills (dye machines).
- Not used in Dobby Studio
- Conversion happens at mill (RGB → CMYK)

### HSL (Hue, Saturation, Lightness)
**Human-friendly description**

- **Hue:** 0–360° (color wheel)
- **Saturation:** 0–100% (intensity)
- **Lightness:** 0–100% (brightness)

Sometimes used in color pickers.

---

## Optical Color Mixing

How fabric achieves colors through weaving (not just dyeing).

### Theory
When two colored threads interlace closely, your **eye blends them** from a distance.

Example:
- 70% red + 30% blue = Magenta
- 100% red (no blend) = Pure red

### In Dobby Studio
```javascript
// If warp is red, weft is blue:
// Result seen from far: pinkish-red
color = blend(warp: 70%, weft: 30%)
```

The rendering algorithm does this automatically.

### Real-World Application
Mills create **24,000+ colors** from just 8–10 dye pots using optical mix.

---

## Thread Weight / Yarn Thickness

### Deniers & Decitex
Not directly in Dobby Studio, but important for mills.

- **Denier:** Grams per 9,000 meters of yarn
- **High denier** → Thicker, heavier
- **Low denier** → Thinner, lighter

**Example Weights:**
- 20 denier — Sheer (gossamer)
- 50 denier — Medium (standard)
- 150+ denier — Heavy (wool, suiting)

### In Dobby Studio
`threadSize` slider (4–22 px) simulates this visually, but doesn't export the actual yarn weight to WIF.

---

## Fiber Types & Their Properties

Not directly in Dobby Studio, but context helps:

### Cotton
- **Feel:** Crisp, cool
- **Strength:** Moderate
- **Drape:** Structured
- **Cost:** Low
- **Use:** Summer tartans, casual wear

### Wool
- **Feel:** Warm, textured
- **Strength:** Very high
- **Drape:** Excellent
- **Cost:** Medium
- **Use:** Traditional tartans, winter wear
- **Note:** Prone to pilling

### Silk
- **Feel:** Luxurious, smooth
- **Strength:** High (but delicate)
- **Drape:** Luxurious drape
- **Cost:** High
- **Use:** Fancy tartans, formal wear
- **Note:** Requires careful maintenance

### Blends
- Cotton/Wool, Silk/Cotton, etc.
- Best properties of each fiber
- Common in quality tartans

---

## Scottish Tartan Registry Standards

### Official Designation
Tartans registered with Scottish Tartan Registry have:
- Documented **sett notation**
- **Historical context** (clan, region, purpose)
- Approved **color specifications**
- **Weighting** (standard or weathered)

### Dress vs Hunting vs Formal
- **Dress:** Bright colors, formal events
- **Hunting:** Muted greens/browns, outdoor
- **Formal/Evening:** Very dark or bright, special occasions

**Dobby Studio:** Designs based on your vision, not necessarily official registry.

---

## Common Tartan Terms

| Term | Meaning |
|------|---------|
| **Band** | Horizontal color section |
| **Stripe** | Same as stripe (vertical section) |
| **Threadcount** | Total threads in sett |
| **Ground** | Main background color |
| **Overcheck** | Secondary pattern overlaying ground |
| **Twill** | Diagonal weave lines |
| **Float** | Thread passing over multiple threads |
| **Pivot** | Center point of reflective repeat |
| **Texture** | Fiber surface quality |

---

## Glossary

| Term | Definition |
|------|-----------|
| **EPI** | Ends per inch (warp density) |
| **PPI** | Picks per inch (weft density) |
| **Sett** | Color sequence of warp |
| **Weave** | Pattern of thread interlacing |
| **Warp** | Vertical threads (setup first) |
| **Weft** | Horizontal threads (woven through) |
| **Float** | Thread over multiple crossing threads |
| **Dobby** | Mechanical loom control (max 32 shafts) |
| **Jacquard** | Individual thread control (unlimited) |
| **WIF** | Weave Interchange Format (standard file) |
| **RGB** | Red-Green-Blue (digital color) |
| **Hex** | #RRGGBB (color notation) |
| **Reflective** | Mirror repeat (how tartans are woven) |
| **Optical Mix** | Eye blending of closely woven colors |

---

## Further Learning

### Online Resources
- Scottish Tartan Register: https://www.tartanregister.gov.uk
- Weavezine: Magazine for weavers
- Ashford NZ: Weaving education

### Books
- "The Handweaver's Pattern Directory" — Linden Hetzel
- "Tartans: Their History and Fashion" — Various authors
- "Weaving: Pattern and Process" — Karen Searle

### Software (Compatible with WIF)
- ArahWeave (professional)
- WeavePoint (beginner-friendly)
- Fiberworks (advanced)
- PixeLoom (simple)

---

**Key Takeaway:** Dobby Studio simplifies tartan design for **dobby looms using reflective repeats** — the authentic way tartans are traditionally woven. No need to understand all the technical details to create beautiful designs!
