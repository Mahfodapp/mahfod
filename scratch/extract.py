import re, os, json

os.makedirs('scratch', exist_ok=True)

print("Reading bundle...")
with open('c:/Users/dell/Desktop/mahfod_recovered.js', 'r', encoding='utf-8') as f:
    text = f.read()
print(f"Bundle size: {len(text):,} chars")

# ── 1. Colors ──────────────────────────────────────────────────────────────
colors = set(re.findall(r'"(#[0-9a-fA-F]{3,8})"', text))
colors |= set(re.findall(r"'(#[0-9a-fA-F]{3,8})'", text))
rgba_hits = set(re.findall(r'"(rgba?\([^"]{1,60}\))"', text))
colors |= rgba_hits

with open('scratch/all_colors.txt', 'w', encoding='utf-8') as out:
    for c in sorted(colors):
        out.write(c + '\n')
print(f"Colors found: {len(colors)}")

# ── 2. All numeric style values assigned to known style keys ───────────────
style_keys = [
    'fontSize','lineHeight','borderRadius','padding','paddingVertical',
    'paddingHorizontal','paddingTop','paddingBottom','paddingLeft','paddingRight',
    'margin','marginTop','marginBottom','marginLeft','marginRight',
    'marginHorizontal','marginVertical','width','height','gap',
    'elevation','borderWidth','opacity','shadowRadius','shadowOpacity',
    'letterSpacing',
]
style_data = {}
for key in style_keys:
    hits = re.findall(rf"'{key}'\s*[=:,]\s*(\d+(?:\.\d+)?)", text)
    hits += re.findall(rf'"{key}"\s*[=:,]\s*(\d+(?:\.\d+)?)', text)
    if hits:
        nums = sorted(set(float(h) for h in hits))
        style_data[key] = nums

with open('scratch/style_values.json', 'w', encoding='utf-8') as out:
    json.dump(style_data, out, indent=2, ensure_ascii=False)
print(f"Style keys extracted: {len(style_data)}")

# ── 3. Arabic UI strings ───────────────────────────────────────────────────
arabic_pattern = re.compile(r'"([\u0600-\u06FF][\u0600-\u06FF\s\u060C\u061B\u061F\u0640\u200c\u200d،؟!:\-\(\)\/0-9a-zA-Z]{1,100})"')
arabic = arabic_pattern.findall(text)

with open('scratch/arabic_strings.txt', 'w', encoding='utf-8') as out:
    seen = set()
    for s in arabic:
        s = s.strip()
        if s and s not in seen:
            seen.add(s)
            out.write(s + '\n')
print(f"Arabic strings found: {len(seen)}")

# ── 4. Font families ───────────────────────────────────────────────────────
fonts = set(re.findall(r'"fontFamily"\s*[=:,]\s*"([^"]{2,50})"', text))
fonts |= set(re.findall(r"fontFamily\s*:\s*['\"]([^'\"]{2,50})['\"]", text))
with open('scratch/fonts.txt', 'w', encoding='utf-8') as out:
    for f in sorted(fonts):
        out.write(f + '\n')
print(f"Fonts found: {len(fonts)}")

# ── 5. Named variables assigned to color strings ───────────────────────────
named_colors = re.findall(r'var\s+(\w+)\s*=\s*"(#[0-9a-fA-F]{3,8})"', text)
named_colors += re.findall(r'(\w+)\s*=\s*"(#[0-9a-fA-F]{3,8})"', text)
with open('scratch/named_colors.txt', 'w', encoding='utf-8') as out:
    seen = set()
    for name, val in named_colors:
        key = f"{name} = {val}"
        if key not in seen:
            seen.add(key)
            out.write(key + '\n')
print(f"Named colors: {len(seen)}")

# ── 6. Extract big string blocks (object literals with style-like keys) ────
# Find blocks around 'backgroundColor','color','borderColor' to grab palette sections
bg_indices = [m.start() for m in re.finditer(r'"backgroundColor"', text)]
palette_blocks = []
seen_vals = set()
for idx in bg_indices[:200]:  # limit to 200 samples
    chunk = text[max(0, idx-200):idx+500]
    vals = re.findall(r'"(#[0-9a-fA-F]{3,8}|rgba?\([^"]{1,60}\))"', chunk)
    for v in vals:
        if v not in seen_vals:
            seen_vals.add(v)
            palette_blocks.append(f"[ctx@{idx}] {v}")

with open('scratch/palette_in_context.txt', 'w', encoding='utf-8') as out:
    for b in palette_blocks:
        out.write(b + '\n')
print(f"Palette-in-context entries: {len(palette_blocks)}")

# ── 7. Screen section extractor ────────────────────────────────────────────
screen_names = ['HomeScreenTsx', 'LearnScreen', 'DailyReview', 'ToolsScreen',
                'SettingsScreen', 'AuthScreen', 'SplashScreen', 'BottomTabBar',
                'AddMemoModal', 'AddSourceModal']

with open('scratch/screen_sections.txt', 'w', encoding='utf-8') as out:
    for name in screen_names:
        indices = [m.start() for m in re.finditer(re.escape(name), text)]
        out.write(f"\n\n{'='*60}\n  {name}  ({len(indices)} occurrences)\n{'='*60}\n")
        if indices:
            # take the first meaningful occurrence
            idx = indices[0]
            chunk = text[max(0, idx-100): min(len(text), idx+8000)]
            out.write(chunk)
print("Screen sections extracted")

# ── 8. Icon/SVG path data ─────────────────────────────────────────────────
svg_paths = set(re.findall(r'"([MmLlHhVvCcSsQqTtAaZz][MmLlHhVvCcSsQqTtAaZz0-9,.\s\-]{10,})"', text))
with open('scratch/svg_paths.txt', 'w', encoding='utf-8') as out:
    for p in sorted(svg_paths):
        out.write(p + '\n')
print(f"SVG paths found: {len(svg_paths)}")

print("\nDone! All files written to scratch/")
