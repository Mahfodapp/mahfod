# MAHFOD — Final Antigravity Prompts
> Expo + Supabase · React Native 0.81.4 · React 19
> Accent: #CCFF00 · RTL Arabic-first · No AI features · No Quran tab yet

---

## ⚠️ PASTE THIS AT THE TOP OF EVERY PROMPT

```
You are rebuilding Mahfod (محفوظ), a mobile memorization app.
Follow this spec with 100% precision. Do not simplify, do not add features,
do not change colors or layout. The Expo project and Supabase are already set up.
Build only what is described below — nothing more.
```

---

## PROMPT A — Design System & Theme
**Model: Claude Sonnet 4.6**

```
The Expo project is already initialized and Supabase is connected.
Create the design system for Mahfod. No fonts needed yet — use system default.

FILE: src/theme/colors.ts
Export a const `colors` object with EXACTLY these values:

export const colors = {
  // Backgrounds
  primary: '#0D0E10',
  primaryMid: '#121316',
  primaryLight: '#181A1C',
  surface: '#121316',
  surfaceRaised: '#181A1C',
  surfaceHigh: '#1E2022',
  surfaceHighest: '#242629',
  surfaceBright: '#2B2C2F',
  glassCard: 'rgba(255,255,255,0.03)',

  // Accent (lime-green — ONLY primary action color)
  accent: '#CCFF00',
  accentDim: '#BEEE00',
  accentSoft: 'rgba(204,255,0,0.10)',
  accentBorder: 'rgba(204,255,0,0.22)',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderAccent: 'rgba(204,255,0,0.25)',
  glassBorder: 'rgba(255,255,255,0.10)',

  // Text
  textPrimary: '#FDFBFE',
  textSecondary: '#ABABAD',
  textMuted: '#757578',
  textAccent: '#CCFF00',

  // Semantic
  success: '#00EDB4',
  successSoft: 'rgba(0,237,180,0.12)',
  error: '#FF7351',
  errorSoft: 'rgba(255,115,81,0.12)',
  info: '#AAFFDC',

  // Memo stages
  stageLearning: '#AAFFDC',    // cyan — يُحفظ
  stageReview: '#CCFF00',      // lime — مراجعة
  stageMastered: '#00EDB4',    // teal — محكم
} as const;

FILE: src/theme/spacing.ts
export const spacing = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 };
export const radius = { sm:8, md:12, lg:16, xl:24, full:9999 };

FILE: src/theme/index.ts
Re-export everything: export * from './colors'; export * from './spacing';

FILE: src/components/ui/Button.tsx
Props: label, onPress, variant ('primary'|'secondary'|'danger'|'ghost'), 
       disabled?, loading?, fullWidth? (default true), icon?

Styles:
- primary: bg=#CCFF00, text=#0D0E10, fontWeight:'700', borderRadius:9999, paddingVertical:14
- secondary: bg=transparent, borderWidth:1, borderColor='rgba(204,255,0,0.22)', text=#CCFF00
- danger: bg='rgba(255,115,81,0.12)', borderWidth:1, borderColor=#FF7351, text=#FF7351
- ghost: bg=transparent, text=#ABABAD
- disabled: opacity 0.4
- loading: show ActivityIndicator in accent color

FILE: src/components/ui/Input.tsx
Props: value, onChangeText, placeholder, label?, secureTextEntry?, multiline?,
       minHeight?, error?

Style:
- Container label above input, right-aligned (RTL)
- Input: bg=#181A1C, borderWidth:1, borderColor='rgba(255,255,255,0.08)'
- On focus: borderColor='rgba(204,255,0,0.22)'
- text=#FDFBFE, placeholderTextColor=#757578
- padding: 14px horizontal, 12px vertical, borderRadius:12
- textAlign: 'right' (RTL)
- error state: borderColor=#FF7351, show error text below in #FF7351

FILE: src/components/ui/StageBadge.tsx
Props: stage ('LEARNING'|'REVIEWING'|'MASTERED')
Renders a small pill badge:
- LEARNING:  bg='rgba(170,255,220,0.12)' text='#AAFFDC' label='يُحفظ'
- REVIEWING: bg='rgba(204,255,0,0.10)'   text='#CCFF00' label='مراجعة'
- MASTERED:  bg='rgba(0,237,180,0.12)'   text='#00EDB4' label='محكم'
Style: paddingHorizontal:8, paddingVertical:3, borderRadius:9999, fontSize:11

FILE: src/components/ui/Card.tsx
Props: children, style?, onPress?, onLongPress?
- bg='#181A1C', borderWidth:0.5, borderColor='rgba(255,255,255,0.08)'
- borderRadius:16, padding:16

Also add I18nManager.forceRTL(true) at the top of App.tsx (or _layout.tsx if Expo Router).
```

---

## PROMPT B — Supabase Schema & Service Layer
**Model: Claude Sonnet 4.6**

```
Supabase is already connected. Create the database tables and service layer for Mahfod.

STEP 1 — Run this SQL in your Supabase SQL Editor:

-- MEMOS
CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]',
  related_memo_id TEXT,
  audio_url TEXT,
  image_url TEXT,
  stage TEXT NOT NULL DEFAULT 'LEARNING',
  review_count INTEGER NOT NULL DEFAULT 0,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_poem BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTER BOOKS (المكتبة)
CREATE TABLE IF NOT EXISTS noter_books (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'book',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTER CHAPTERS
CREATE TABLE IF NOT EXISTS noter_chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES noter_books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- NOTER NOTES
CREATE TABLE IF NOT EXISTS noter_notes (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES noter_books(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES noter_chapters(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'فكرة',
  page_ref TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'ar',
  initial_reps INTEGER NOT NULL DEFAULT 33,
  review_days INTEGER NOT NULL DEFAULT 30,
  daily_review_count INTEGER NOT NULL DEFAULT 5,
  reinforce_reps INTEGER NOT NULL DEFAULT 5,
  daily_notif_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  daily_notif_time TEXT NOT NULL DEFAULT '07:00',
  weekly_notif_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  weekly_notif_time TEXT NOT NULL DEFAULT '20:00',
  categories JSONB NOT NULL DEFAULT '["متن","شعر","حديث","فقه","عقيدة"]',
  vanish_mode TEXT NOT NULL DEFAULT 'none'
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE noter_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE noter_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE noter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (users see only their own data)
CREATE POLICY "own memos" ON memos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own noter_books" ON noter_books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own noter_chapters" ON noter_chapters FOR ALL
  USING (book_id IN (SELECT id FROM noter_books WHERE user_id = auth.uid()));
CREATE POLICY "own noter_notes" ON noter_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

STEP 2 — Create service files:

FILE: src/services/memo.service.ts
Import the already-configured supabase client.

Functions (all async, all filter by current user):

getMemos(filters?: { stage?: string; label?: string; search?: string })
  → supabase.from('memos').select('*').eq('user_id', userId)
     apply filters if provided, order by created_at desc

getMemoById(id: string) → single memo

addMemo(data: Omit<Memo, 'id'|'user_id'|'created_at'|'updated_at'>)
  → generate nanoid for id, insert, return memo

updateMemo(id: string, data: Partial<Memo>) → update + return

deleteMemo(id: string) → delete

toggleFavorite(id: string, current: boolean) → update is_favorite

getMemosDueToday()
  → memos WHERE stage='REVIEWING'
     AND (next_review_at IS NULL OR next_review_at <= NOW())
     ORDER BY next_review_at ASC

recordRepetition(id: string, currentCount: number, initialReps: number)
  Logic:
  - newCount = currentCount + 1
  - if newCount >= initialReps AND stage === 'LEARNING':
      stage = 'REVIEWING'
      next_review_at = tomorrow (NOW() + 1 day)
      repetition_count = 0
  - if stage === 'REVIEWING':
      next_review_at = tomorrow
      review_count = review_count + 1
  → update memo, return updated

getMasteredMemos() → memos WHERE stage='MASTERED' ORDER BY RANDOM() LIMIT 10

FILE: src/services/settings.service.ts

getSettings(userId: string) → fetch user_settings row, return with defaults if missing
saveSettings(userId: string, data: Partial<UserSettings>) → upsert

FILE: src/services/noter.service.ts

getBooks() → noter_books for current user, order by created_at desc
addBook(data) → insert noter_book
deleteBook(id) → delete (cascades chapters + notes)
getChapters(bookId) → order by order_index
addChapter(data) → insert
getNotes(bookId) → noter_notes for book, order by order_index
addNote(data) → insert
updateNote(id, data) → update
deleteNote(id) → delete
updateNoteOrder(notes: {id,order_index}[]) → batch update order_index

FILE: src/types/index.ts
Export TypeScript types:
Memo, NoterBook, NoterChapter, NoterNote, UserSettings
MemoStage = 'LEARNING' | 'REVIEWING' | 'MASTERED'
NoteType = 'فكرة' | 'قلت' | 'تلخيص' | 'أبيات' | 'تعقيب'
```

---

## PROMPT C — Interval Logic
**Model: Claude Sonnet 4.6**

```
Create the custom interval/repetition logic for Mahfod.
This is NOT SM-2. It is a simple custom system.

FILE: src/logic/intervals.ts

THE SYSTEM (3 stages):

LEARNING:
  - User taps "كررت" one tap at a time
  - Target: settings.initial_reps taps (default 33)
  - When tap count reaches initial_reps → memo moves to REVIEWING
  - next_review_at = tomorrow

REVIEWING:
  - Memo appears in daily review session every day
  - Each day the user reviews it counts as 1 review day
  - Target: settings.review_days total review days (default 30)
  - When review_count >= review_days → memo moves to MASTERED
  - next_review_at always set to tomorrow after each review

MASTERED (محكم):
  - No fixed schedule
  - App randomly selects mastered memos for periodic test sessions
  - User confirms "I still remember" or "I forgot" (forgotten → back to REVIEWING)

Export these functions:

function getNextStage(
  currentStage: MemoStage,
  repetitionCount: number,
  reviewCount: number,
  settings: UserSettings
): MemoStage
  - LEARNING: if repetitionCount >= settings.initial_reps → return 'REVIEWING'
  - REVIEWING: if reviewCount >= settings.review_days → return 'MASTERED'
  - return currentStage

function getNextReviewDate(): Date
  // Always tomorrow at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;

function isDueToday(nextReviewAt: string | null): boolean
  // True if nextReviewAt is today or in the past or null
  if (!nextReviewAt) return true;
  return new Date(nextReviewAt) <= new Date();

function getDayNumber(lastReviewedAt: string | null, createdAt: string): number
  // Which day of the 30-day review cycle is this?
  // Based on review_count (each review = 1 day)
  // Returns e.g. 3 to display "مراجعة اليوم 3 / 30"

FILE: src/store/settings.store.ts (Zustand)
Store:
  settings: UserSettings
  isLoaded: boolean
  load(userId): fetch from Supabase via settings.service
  update(data): save to Supabase + update local state

Default UserSettings:
  language: 'ar'
  initial_reps: 33
  review_days: 30
  daily_review_count: 5
  reinforce_reps: 5
  daily_notif_enabled: false
  daily_notif_time: '07:00'
  weekly_notif_enabled: false
  weekly_notif_time: '20:00'
  categories: ['متن','شعر','حديث','فقه','عقيدة']
  vanish_mode: 'none'

FILE: src/store/memo.store.ts (Zustand)
Store:
  memos: Memo[]
  isLoading: boolean
  fetchMemos(filters?): call memo.service.getMemos()
  addMemo(data): call service, add to local array
  updateMemo(id, data): call service, update local
  deleteMemo(id): call service, remove from local
  recordRepetition(id): call service, update local stage/counts
```

---

## PROMPT D — Navigation + Tab Bar
**Model: Claude Sonnet 4.6**

```
Create the navigation structure for Mahfod. Expo project already set up.

STRUCTURE:
RootNavigator
  ├── AuthStack (if not logged in OR guest)
  │   └── AuthScreen
  └── AppStack (if logged in or guest)
      ├── MainTabs (Bottom Tab Navigator)
      │   ├── HomeTab → HomeScreen
      │   ├── QuranTab → QuranPlaceholderScreen (just "قريباً" coming soon)
      │   ├── NoterTab → NoterHomeScreen
      │   └── ToolsTab → ToolsPlaceholderScreen (just "قريباً" coming soon)
      └── Modal screens (native stack, presented as modal):
          ├── AddMemoScreen
          ├── MemoLibraryScreen
          ├── ReviewSessionScreen
          ├── MohkamSessionScreen
          ├── SettingsScreen
          └── AddNoterBookScreen

BOTTOM TAB BAR — custom component (do not use default RN tab bar):
FILE: src/components/navigation/TabBar.tsx

Design (from screenshots):
- Container: bg=#0D0E10, borderTopWidth:0.5, borderTopColor='rgba(255,255,255,0.08)'
- Height: 64px + safe area bottom
- 4 tabs + 1 center FAB

Tab positions (RTL order: right to left):
  1. محفوظات (BookOpen icon) → HomeTab ← this is the MEMO section
  2. 🌙 (Moon icon) → QuranTab (placeholder, dimmed)
  3. [CENTER FAB — + icon] → opens AddMemoScreen as modal
  4. المطالعات (BookMarked icon) → NoterTab
  5. ⚙️ (Settings icon) → opens SettingsScreen

FAB (center button):
  width:56, height:56, borderRadius:28
  bg=#CCFF00, icon color=#0D0E10, size 28
  Elevated: shadowColor='#CCFF00', shadowOpacity:0.4, shadowRadius:12
  Positioned absolutely, bottom: 8 + safeArea

Active tab: icon + label in #CCFF00, dot indicator below icon
Inactive tab: icon + label in #757578
Placeholder tabs (Quran, Tools): opacity 0.4, non-tappable or show "قريباً" toast

Tab label: fontSize:11, textAlign:'center', marginTop:4
Icons: use lucide-react-native
```

---

## PROMPT E — Auth Screen
**Model: Gemini**

```
Build AuthScreen for Mahfod. Supabase auth is already configured.

FILE: src/screens/AuthScreen.tsx

LAYOUT (full screen, dark bg=#0D0E10, RTL):

TOP 40%:
  - App logo: Text "محفوظ" 
    fontSize:52, fontWeight:'800', color:#CCFF00
    textShadowColor:'#CCFF00', textShadowOffset:{width:0,height:0}, textShadowRadius:20
  - Below logo: "مكتبة المحفوظات" fontSize:16, color:#757578

MIDDLE SECTION:
  Headline: "المزامنة السحابية" fontSize:24, fontWeight:'700', color:#FDFBFE
  Subtext: "أنشئ حساباً مجانياً للحفاظ على محفوظاتك آمنة ومزامنتها في جميع أجهزتك."
           fontSize:14, color:#ABABAD, textAlign:'right'

  Email Input (from ui/Input.tsx)
  Password Input (secureTextEntry, from ui/Input.tsx)
  
  Error message if auth fails (color:#FF7351)

  Primary Button: label depends on mode:
    Login mode: "← تسجيل الدخول"
    Register mode: "← إنشاء الحساب"
    bg=#CCFF00, text=#0D0E10

  Toggle link: 
    Login mode: "لا تملك حساباً؟ أنشئ حساباً جديداً"
    Register mode: "تملك حساباً؟ سجّل الدخول"
    color:#ABABAD, underline, textAlign:'center'

BOTTOM:
  "تخطى كزائر (بدون مزامنة) ←"
  color:#757578, fontSize:13, textAlign:'center'
  → sets guestMode=true in auth store, navigate to AppStack

STATE:
  isLogin: boolean (toggle)
  email, password, name (register only)
  isLoading: boolean
  error: string

SUPABASE:
  Login: supabase.auth.signInWithPassword({ email, password })
  Register: supabase.auth.signUp({ email, password }) then update profile with name
  On success: navigate to MainTabs
  On guest: navigate to MainTabs with null user

FILE: src/store/auth.store.ts (Zustand)
  user: User | null
  isGuest: boolean
  isLoading: boolean
  signIn(email, password)
  signUp(email, password, name)
  signOut()
  setGuest()
  initialize() ← check existing session on app start
```

---

## PROMPT F — Home Screen
**Model: Claude Sonnet 4.6**

```
Build HomeScreen for Mahfod. This is the main dashboard (HomeTab).
All components from src/components/ui/ already exist. Use them.

FILE: src/screens/HomeScreen.tsx

LAYOUT (RTL, bg=#0D0E10, SafeAreaView):

HEADER ROW:
  Left: Icon button — gear (Settings) → opens SettingsScreen
        Style: width:40, height:40, borderRadius:20, 
               bg='rgba(255,255,255,0.06)', icon=#CCFF00, size:20
  Center: "محفوظ" text logo
          color=#CCFF00, fontSize:24, fontWeight:'800'
          textShadowColor='#CCFF00', textShadowRadius:10
  Right: Icon button — search icon, same style as settings button

GREETING SECTION:
  If logged in:
    "السلام عليكم ، [username]" 
    fontSize:22, fontWeight:'700', color=#FDFBFE, textAlign:'right'
    username in color=#CCFF00
  If guest:
    "قليلٌ دائم خير من كثير منقطع"
    fontSize:16, fontStyle:'italic', color=#ABABAD, textAlign:'right'
  
  Below: Arabic quote in color=#757578, fontSize:13, textAlign:'right'
    "ليس بعلم ما حوى القمطر — ما العلم إلا ما حواه الصدر"

STATS CARD (swipeable carousel — 3 slides):
  Card style: bg=#181A1C, borderWidth:0.5, borderColor='rgba(255,255,255,0.08)'
              borderRadius:16, padding:20
  Background: islamic_pattern.png overlay at opacity 0.06 (ImageBackground)

  Slide 1 — Main stats (3 columns):
    [إجمالي المحفوظات] [المراجعة] [السلسلة]
    Value: fontSize:28, fontWeight:'800', color=#CCFF00
    Label: fontSize:12, color=#757578

  Slide 2 — Stage breakdown:
    يُحفظ [X] · مراجعة [X] · محكم [X]
    Each with its stage color (stageLearning/stageReview/stageMastered)

  Slide 3 — Streak info:
    🔥 streak counter + "يوم متواصل"

  Dot pagination below card (3 dots, active=lime)

2×2 ACTION GRID:
  Each cell: bg=#181A1C, borderRadius:16, borderWidth:0.5, 
             borderColor='rgba(255,255,255,0.08)', 
             padding:20, alignItems:'center', justifyContent:'center'
  
  [1] المحفوظات (BookOpen icon) → navigate to MemoLibraryScreen
  [2] + إضافة محفوظ جديد (PlusCircle icon) → navigate to AddMemoScreen
  [3] الاختبار (Shuffle icon) → navigate to MohkamSessionScreen
  [4] المراجعة (Star icon) → navigate to ReviewSessionScreen
      Show badge with count of memos due today (red dot if > 0)

  Icon: color=#CCFF00, size:28, marginBottom:8
  Label: color=#FDFBFE, fontSize:13, textAlign:'center'

DATA:
  On mount: fetch from memo.store (fetchMemos)
  Compute: totalMemos, reviewDueCount, masteredCount, learningCount, streak
  Streak: stored in user_settings or kv — days in a row with at least 1 review
```

---

## PROMPT G — Add Memo Screen
**Model: Claude Sonnet 4.6**

```
Build AddMemoScreen for Mahfod. Core screen — get every detail right.

FILE: src/screens/AddMemoScreen.tsx
Props: route.params.memoId? (if editing existing memo)

HEADER:
  Title: "محفوظ جديد" (new) or "تعديل المحفوظ" (edit)
  Right: X close button (dark circle, icon size 20)

SCROLLVIEW (keyboardAvoidingView wrapper):

SECTION — العنوان:
  <Input label="العنوان" placeholder="أدخل عنوان المحفوظ" />

SECTION — التصنيفات:
  Label: "التصنيفات (يمكن اختيار أكثر من واحد)" right-aligned
  Horizontal ScrollView of chip buttons
  Chips from settings.categories: ['متن','شعر','حديث','فقه','عقيدة'] + user custom
  Multi-select: tap to toggle
  Selected chip: bg=#CCFF00, text=#0D0E10
  Unselected chip: bg='rgba(255,255,255,0.06)', borderColor='rgba(255,255,255,0.12)', text=#ABABAD

SECTION — ربط بسلسلة:
  Dark card (bg=#181A1C, borderRadius:12, padding:14):
    Left: chain icon (color=#757578)
    Center: "ربط بسلسلة" text + Toggle switch
            Subtext: "اضغط لإضافة هذا المحفوظ كجزء من متن أطول" (muted, small)
  When ON: show search input to find existing memo to link as parent

SECTION — النص:
  Row: 
    Right: "شعر (شطرين)" label + Toggle switch
    Left: "النص" label
  
  When poetry OFF:
    <Input multiline minHeight={120} placeholder="أدخل نص المتن أو الشعر أو الحديث..." />
    lime border on focus
  
  When poetry ON:
    Two separate inputs stacked:
    <Input placeholder="الصدر..." />   ← first hemistich
    Divider line
    <Input placeholder="العجز..." />   ← second hemistich

SECTION — الوسائط (اختياري):
  Label: "الوسائط (اختياري)" right-aligned, color=#757578
  Two cards side by side:
  
  [صورة card]:
    If no image: camera icon + "إضافة صورة" text, tap → expo-image-picker
    If image selected: show thumbnail, tap to remove (X overlay)
    bg=#1E2022, borderRadius:12, borderWidth:0.5, borderColor='rgba(255,255,255,0.08)'
  
  [صوتي card]:
    If not recording: mic icon + "تسجيل" text
    If recording: animated red dot + duration counter + "إيقاف"
    If recorded: waveform placeholder + play button + trash icon
    Uses expo-av

STICKY BOTTOM:
  <Button 
    variant="primary"
    label={isEditing ? "حفظ التعديلات" : "ابدإ التكرار"}
    onPress={handleSave}
  />

handleSave():
  Validate: title required, (text or audio or image) required
  If new: memo.service.addMemo({ title, text, label, tags, is_poem, audio_url, image_url, stage:'LEARNING', repetition_count:0, review_count:0 })
  If edit: memo.service.updateMemo(memoId, { ...changes })
  Upload media to Supabase Storage if present
  Close modal
```

---

## PROMPT H — Memo Library Screen
**Model: Claude Sonnet 4.6**

```
Build MemoLibraryScreen for Mahfod.

FILE: src/screens/MemoLibraryScreen.tsx

HEADER:
  Left: view toggle icon (LayoutGrid → face view, BookOpen → spine view)
         dark circle button, icon=#CCFF00
  Center: "مكتبتي" fontSize:18, fontWeight:'700'
          Below: "X محفوظ" fontSize:12, color=#757578
  Right: back arrow (dark circle)

HINT TEXT (below header):
  Face view: "📁 عرض الأغلفة — اضغط مطولاً لخيارات"
  Spine view: "رف الكتب — اضغط مطولاً لخيارات"
  color=#757578, fontSize:12, textAlign:'right'

SEARCH BAR:
  Full width Input with search icon on right
  Filters memos by title in real-time

FILTER CHIPS (horizontal scroll, single-select):
  الكل [total] | يُحفظ [X] | مراجعة [X] | محكم [X]
  Active: bg=#CCFF00, text=#0D0E10
  Inactive: bg='rgba(255,255,255,0.06)', text=#ABABAD
  Show count badge on each chip

FAVORITES SECTION (if any):
  "المفضلة ⭐" section header, color=#CCFF00
  Horizontal scroll of small book covers

FACE VIEW (2-column FlatList, default):
  BookCover component per memo:
  
  Container: width=(screenWidth/2 - 24), aspectRatio:0.7
             borderRadius:12, overflow:'hidden'
  
  Background: LinearGradient(['#2d5a1b','#3d7a25','#4a8a2a']) 
              (simulate green leather — react-native-linear-gradient)
  
  Gold border: borderWidth:1.5, borderColor:'rgba(255,215,0,0.4)'
  
  Title overlay (centered on cover):
    color:#FFFFFF, fontSize:14, fontWeight:'700', textAlign:'center'
    padding:8, textShadow for readability
  
  Bottom strip (row):
    Left: label badge (dark pill, small)
    Right: <StageBadge stage={memo.stage} />
  
  Timestamp below cover: "منذ X أيام" or "أمس" or "اليوم"
    color=#757578, fontSize:11
  
  Bookmark icon top-right: ⭐ if favorite else ☆, color=#CCFF00
  
  After each row of 2: wooden shelf strip
    height:16, bg='rgba(101,67,33,0.6)', borderRadius:2
    (simulates shelf — or use shelf_bg.png asset if available)

SPINE VIEW (4-column FlatList):
  Narrow cards: width=(screenWidth/4 - 12), aspectRatio:0.35
  Same green gradient background
  Title: rotated -90deg, fontSize:10, centered
  Stage dot at bottom (colored dot based on stage)
  Shelf strip after each row of 4

LONG PRESS ActionSheet:
  Options: تعديل | حذف | إضافة للمفضلة/إزالة | مشاركة
  Delete: show confirmation Alert first
  
EMPTY STATE:
  Center of screen:
  Large icon (BookOpen, size:64, color:#2B2C2F)
  "مكتبتك فارغة" fontSize:18, color=#ABABAD
  "ابدأ بإضافة أول محفوظاتك" fontSize:14, color=#757578
  <Button variant="primary" label="+ إضافة محفوظ جديد" onPress={→ AddMemoScreen} />

DATA:
  Load from memo.store, re-fetch on focus
  Apply filter + search locally
```

---

## PROMPT I — Review Session Screen
**Model: Claude Sonnet 4.6**

```
Build ReviewSessionScreen for Mahfod — the daily review session.

FILE: src/screens/ReviewSessionScreen.tsx

ON MOUNT:
  Load memos due today: memo.service.getMemosDueToday()
  Limit to settings.daily_review_count (default 5)
  If 0 memos: show all-done state immediately

STATE:
  queue: Memo[] (memos for this session)
  currentIndex: number (0-based)
  repCount: number (taps this memo, resets per memo)
  sessionComplete: boolean

HEADER:
  Left: ☆ star icon (bookmark session — future feature, just UI for now)
  Center: "المراجعة اليومية" fontSize:16, fontWeight:'700'
  Right: "إلغاء" text button → confirm exit dialog → navigate back
  Below header: progress bar
    height:2, bg='rgba(255,255,255,0.08)'
    Progress fill: bg=#CCFF00, width = (currentIndex+1)/queue.length * 100%
    Animated with reanimated

COUNTER TEXT:
  "currentIndex+1 / queue.length" textAlign:'center', color=#757578, fontSize:13

MEMO DISPLAY:
  Source/label above title: color=#757578, fontSize:12
  
  Title — LARGE centered:
    fontSize:24, fontWeight:'800', color=#FDFBFE, textAlign:'center'
  
  "مراجعة اليوم X / 30":
    X = memo.review_count + 1
    color=#757578, fontSize:13, textAlign:'center'

DISMISSIBLE INFO BANNER:
  Shown on first session only (dismissed state in AsyncStorage)
  bg='rgba(204,255,0,0.08)', borderLeftWidth:3, borderLeftColor=#CCFF00
  borderRadius:8, padding:12, flexDirection:'row-reverse'
  Text: "ستُراجع هذا المحفوظ لمدة 30 يوماً لترسيخه في الذاكرة طويلة الأمد."
  X button right side to dismiss

FONT CONTROLS (row):
  [كوفي] toggle button (later — just placeholder now)
  [+أ] tap → fontSizeScale + 0.1
  [70%] display current scale as percentage  
  [-أ] tap → fontSizeScale - 0.1
  Min: 0.6, Max: 1.6

MAIN MEMO CARD:
  bg=#181A1C, borderRadius:20, padding:24
  minHeight: 200
  
  Text displayed in selected font size (fontSize: 18 * fontSizeScale)
  color=#FDFBFE, textAlign:'center', lineHeight:32
  
  If is_poem: two lines with a divider between them (صدر / عجز)
  
  If audio_url: play button icon below text
  If image_url: image above text (rounded, max-height:200)

DOT INDICATORS (row below card):
  One dot per memo in queue
  Active: bg=#CCFF00, width:20
  Inactive: bg='rgba(255,255,255,0.16)', width:8
  All: height:8, borderRadius:4

REPETITION COUNTER BUTTON (sticky bottom):
  bg=#1E2022, borderRadius:16, padding:16, width:'100%'
  Center text: "كررت (repCount / settings.initial_reps)"
  color=#FDFBFE, fontSize:16, fontWeight:'600'
  
  On tap:
    repCount++
    Haptic feedback (expo-haptics light)
    If repCount >= settings.initial_reps:
      Call memo.service.recordRepetition(memo.id, memo.repetition_count, settings.initial_reps)
      Brief success animation (FadeIn on ✓ icon)
      After 600ms: advance to next memo (currentIndex++)
      Reset repCount to 0

ALL-DONE STATE (when currentIndex >= queue.length):
  Full screen centered:
  "🎉" emoji large
  "أحسنت!" fontSize:28, fontWeight:'800', color=#CCFF00
  "أتممت مراجعة اليوم" fontSize:16, color=#ABABAD
  <Button label="إنهاء المراجعة" variant="primary" onPress={→ HomeScreen} />
  Update streak in user_settings

EMPTY STATE (no memos due):
  "✓" large in #00EDB4
  "لا يوجد للمراجعة اليوم" fontSize:18, color=#ABABAD
  "أتممت مراجعة اليوم ✓" if already reviewed, else "لم تضف أي محفوظات بعد"
  <Button label="العودة للرئيسية" variant="secondary" onPress={→ HomeScreen} />
```

---

## PROMPT J — Settings Screen
**Model: Gemini**

```
Build SettingsScreen for Mahfod.

FILE: src/screens/SettingsScreen.tsx

HEADER:
  "الإعدادات" centered, fontSize:18, fontWeight:'700'
  Right: back arrow button (lime circle, bg=#CCFF00, icon=#0D0E10)

ScrollView sections (each section: label row with icon + settings cards below):

SECTION — مزامنة (cloud icon, color=#CCFF00):
  Card (bg=#181A1C, borderRadius:12):
    If logged in:
      Row: [← logout icon (red)] | [email text] | [avatar circle with initial, bg=#CCFF00, text=#0D0E10]
      Logout icon → supabase.auth.signOut() then navigate to AuthScreen
    If guest:
      Row: [تسجيل الدخول] and [إنشاء حساب] buttons side by side (secondary variant)

SECTION — اللغة (globe icon, color=#CCFF00):
  3-segment control in one card:
    [العربية] [English] [Français]
    Active segment: bg=#CCFF00, text=#0D0E10
    Inactive: bg='rgba(255,255,255,0.06)', text=#757578
    On change: i18n.changeLanguage(), handle RTL, save to settings

SECTION — عدد التكرارات (repeat icon, color=#CCFF00):
  Each row in card: label left | [number] tappable right
  Tap number → opens bottom sheet with scroll picker (numbers 1–100)
  
  الحفظ الأولي [33]        عدد التكرارات لأول مرة
  تكرار التقوية [5]         عند إعادة فتح محفوظ منتهو
  المراجعة اليومية [5]
  أيام المراجعة [30]        الأيام حتى يصبح محكماً
  
  Separator lines between rows (rgba(255,255,255,0.06))

SECTION — الإشعارات (bell icon, color='#FF9500'):
  Card rows with toggle switch:
  مراجعة يومية: [switch] | time: "07:00" (tappable → time picker)
  اختبار أسبوعي: [switch] | time: "20:00" (tappable → time picker)
  Toggle switch: active color=#CCFF00

SECTION — التصنيفات (plus icon, color='#FF2D55'):
  Expandable card (tap to expand/collapse):
  Shows list of categories as chips
  + add button → text input to add new category
  Long press chip → delete option

SECTION — البيانات (database icon, color='#FF9500'):
  Card rows (each as a tappable row with chevron):
  تصدير البيانات → export JSON via expo-document-picker
  استيراد البيانات → import JSON (merge)
  حذف البيانات → confirmation dialog ("اكتب DELETE للتأكيد")
    Options: محفوظات فقط | كل البيانات

Save all settings: settings.store.update(newSettings) on every change
```

---

## PROMPT K — Noter Screen (Home)
**Model: Claude Sonnet 4.6**

```
Build the Noter section for Mahfod.
This is the study notes feature — books with annotated notes.

FILE: src/screens/NoterHomeScreen.tsx (the NoterTab screen)

HEADER:
  Title: "المكتبة" right-aligned
  Subtitle: "المطالعات والدروس المرئية" color=#757578, fontSize:12
  Right: library/shelves icon in #CCFF00

STATS BAR (3 columns, dark card):
  [total books] | [total notes] | [sources count]
  Values in #CCFF00, labels in #757578

BOOK LIST (FlatList):
  Each book card (bg=#181A1C, borderRadius:12, padding:14):
    Row: book icon left | title + author center | chevron right
    Title: color=#FDFBFE, fontSize:15, fontWeight:'600'
    Author: color=#757578, fontSize:12
    Bottom row: subject badge + note count + date
  
  Long press → options: Open | Delete

EMPTY STATE:
  "لا توجد مصادر بعد" + add button

FAB button (bottom right):
  bg=#CCFF00, icon=Plus, color=#0D0E10
  → opens AddNoterBookScreen modal

FILE: src/screens/AddNoterBookScreen.tsx (modal)

HEADER: "إضافة مصدر جديد" | X close

TYPE TOGGLE:
  [📖 كتاب] (active=lime) | [▶ فيديو (مرئي)]
  Segmented control, full width

FORM:
  Input: "عنوان الكتاب / المصدر *" (required)
         placeholder: "اكتب العنوان هنا..."
  Input: "المؤلف (اختياري)"
         placeholder: "الاسم..."
  Input: "الموضوع (اختياري)"
         placeholder: "العقيدة، الفقه، السيرة..."

BUTTON (sticky bottom):
  <Button variant="primary" label="إضافة وتدوين الفوائد" />
  → save noter_book to Supabase → navigate to NoterDetailScreen

FILE: src/screens/NoterDetailScreen.tsx

HEADER:
  Left: [📍 الخريطة] pill button (olive bg, location pin icon)
  Center: book title (bold) + author (muted below)
  Right: X close

TOOLBAR:
  [كوفي] font toggle | [🔍+] [70%] [🔍-] | search input right-aligned

MAIN CONTENT (FlatList, interleaved):
  Two types of items:

  TYPE 1 — SOURCE TEXT block:
    bg='rgba(255,255,255,0.02)', padding:16
    Text in selected font, color=#FDFBFE, lineHeight:32
    (User types source text here — editable on tap)

  TYPE 2 — NOTE BLOCK:
    bg=#181A1C, borderRadius:10
    borderLeftWidth:3, borderLeftColor=#CCFF00
    padding:12
    
    Top row:
      Right: note_type tag pill (dark bg, color depends on type)
        فكرة: color=#CCFF00 | قلت: color=#8b5cf6 | تلخيص: color=#38bdf8
        أبيات: color=#00EDB4 | تعقيب: color=#FF7351
      Left: [🗑️] [✏️] [↺] icon buttons (color=#757578, size:16)
    
    Note text: color=#FDFBFE, fontSize:14, lineHeight:22
    
    Draggable: long press → drag to reorder
    Drag state: borderColor=#CCFF00, elevation shadow

ADD NOTE PANEL (sticky bottom, expandable):
  Collapsed: row [إضافة ملاحظة ∨] | [تصدير PDF ↑]
  
  Expanded (AnimatedView sliding up):
    Row: "الفصل: [chapter name]" | [+ فصل جديد] button
    
    Note type chips (single-select, horizontal scroll):
      تعقيب | أبيات | قلت | تلخيص | فكرة
      Selected: lime bg, dark text
    
    Row: [ص] small input (page ref) | main note TextInput (flex:1)
    
    [+ إضافة الملاحظة] Button (primary, full width)
    → noter.service.addNote() → refresh list

All notes saved to Supabase noter_notes table.
Drag order saved via noter.service.updateNoteOrder().
```

---

## PROMPT L — Mohkam Session Screen
**Model: Gemini**

```
Build MohkamSessionScreen for Mahfod — the mastered memos random test session.

FILE: src/screens/MohkamSessionScreen.tsx

This screen tests long-term retention of MASTERED memos.

ON MOUNT:
  Load random mastered memos: memo.service.getMasteredMemos() (returns up to 10 random)
  If 0 mastered memos: show empty state

HEADER:
  "جلسة المحكم" | X close button
  Subtitle: "اختبار المحفوظات المحكمة" color=#757578

PROGRESS: "X / Y" counter

MEMO DISPLAY:
  Memo title LARGE centered (same style as ReviewSession)
  
  HIDDEN text initially (user must recall from memory)
  Dim placeholder: "..." or "▬▬▬▬▬" to indicate hidden text

  [👁 إظهار النص] button (secondary variant)
  → reveals memo text with FadeIn animation

AFTER REVEALING — two response buttons:
  [✓ تذكرت] (success): bg='rgba(0,237,180,0.12)', text=#00EDB4, border=#00EDB4
  [✗ لم أتذكر] (danger): bg='rgba(255,115,81,0.12)', text=#FF7351, border=#FF7351

ON "تذكرت": advance to next memo (memo stays MASTERED)
ON "لم أتذكر": 
  call memo.service.updateMemo(id, { stage: 'REVIEWING', review_count: 0, next_review_at: tomorrow })
  Show brief "أُعيد للمراجعة" feedback
  Advance to next

ALL DONE:
  "أحسنت! انتهت جلسة المحكم"
  Show summary: remembered X / forgot Y
  <Button label="العودة للرئيسية" variant="primary" />
```

---

## CRITICAL RULES (paste at end of every prompt if output is wrong)

```
CORRECTIONS REQUIRED:
1. Background must be #0D0E10 — not white, not gray, not any other color
2. ONLY accent color is #CCFF00 (lime-green) — no blues, no purples for actions
3. ALL layouts are RTL — textAlign:'right', flexDirection follows RTL
4. Every Supabase call goes through src/services/ — never call supabase directly from screens
5. Stage values are EXACTLY: 'LEARNING' | 'REVIEWING' | 'MASTERED' (uppercase)
6. The custom interval system: LEARNING needs X taps (settings.initial_reps=33 default)
   then REVIEWING gets 1 review per day for 30 days (settings.review_days=30 default)
   then MASTERED — random test sessions only
7. No SM-2 algorithm — not needed yet
8. No Quran screen content — just placeholder "قريباً"
9. No AI features — remove any AI/OCR code
10. Use Zustand for state, service layer for all Supabase calls
```
