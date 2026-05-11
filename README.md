# 📚 MAHFOD - Islamic Memorization & Study App

<p align="center">
  <img src="./assets/images/mahfodap_icon.png" width="120" height="120" />
</p>

<p align="center">
  <strong>مكتبة المحفوظات</strong> - Your personal library for Islamic memorization
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#setup">Setup</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

### 🌌 Premium Antigravity UI
- Highly polished, ritual-grade interface with dynamic animations
- Sophisticated typography (Cairo, Amiri, Scheherazade New)
- Strict RTL native alignment across all screens
- Custom alert popups and smooth transitions

### 📚 Visual Bookshelf Library (مكتبتي)
- Memos rendered as realistic book spines on wooden shelves
- Compact list view with quick actions (Delete, Share)
- Dynamic stage filtering (يُحفظ, مراجعة, محكم)
- Client-side quick search

### 🕌 Quran Memorization
- Complete Quran browser with 114 surahs
- Audio playback with multiple reciters
- Progress tracking with visual indicators
- Thumn-based (1/8th) memorization system

### 📝 Text Memorization (Memos)
- Create and manage memorization items
- **Spaced Repetition System (SRS)** with two algorithms:
  - Leitner System (default)
  - SM-2 Algorithm (opt-in)
- Chain linking for multi-part texts
- Audio recording for each memo
- Image attachments for visual reference

### 📖 Study Notes
- Organize notes by books/authors
- Categorize with custom labels
- Full-text search across all notes
- Export notes to PDF

### 🤖 AI-Powered Learning
- **Quiz Generation** - AI creates questions from your memorized text
- **Arabic OCR** - Extract text from images
- **Speech Evaluation** - Compare your recitation with original text
- **Auto-Tashkeel** - Add diacritics to Arabic text

### 🌐 Multi-Language Support
- Arabic (RTL-first design)
- English
- French
- Automatic RTL/LTR switching

### ☁️ Cloud Sync
- Offline-first architecture
- Automatic sync with Supabase when online
- Conflict resolution for multi-device usage
- End-to-end encryption for sensitive data

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native + Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **State Management** | Zustand |
| **Database** | SQLite (expo-sqlite) + Drizzle ORM |
| **Backend** | Supabase (Auth + Database + Edge Functions) |
| **AI** | Google Gemini API (via Supabase Edge Function) |
| **Styling** | React Native StyleSheet |
| **Animation** | React Native Reanimated + Moti |
| **Navigation** | React Navigation v6 |
| **Icons** | Lucide React Native |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mahfod-app-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section)
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard → project → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI (Development fallback)
# In production, AI keys are stored as Supabase secrets
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

> ⚠️ **Security Note**: Never commit `.env` files to git. They are already in `.gitignore`.

### Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Type check
npm run tsc
```

---

## 🏗️ Architecture

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnimatedTabBar.tsx
│   ├── CustomAlert.tsx
│   ├── ErrorBoundary.tsx
│   ├── Settings/       # Settings-related components
│   └── StudyNotes/     # Study notes components
├── screens/            # App screens (20+ screens)
│   ├── HomeScreen.tsx
│   ├── LearnScreen.tsx
│   ├── QuranScreen.tsx
│   └── ...
├── store/              # Zustand state management
│   ├── useMemoStore.ts
│   ├── useAuthStore.ts
│   └── useQuranStore.ts
├── services/           # Business logic & API calls
│   ├── aiService.ts
│   ├── syncService.ts
│   ├── offlineQueue.ts
│   └── supabase.ts
├── db/                 # Database layer
│   ├── client.ts       # SQLite connection
│   ├── schema.ts       # Drizzle ORM schema
│   └── migrations/     # Database migrations
├── i18n/               # Internationalization
│   ├── index.ts
│   └── locales/        # ar, en, fr translations
├── utils/              # Utility functions
├── theme/              # Design system/colors
├── types/              # TypeScript types
├── constants/          # App constants
└── data/               # Static data (Quran, Matn library)
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI Layer  │────▶│   Store     │────▶│   SQLite    │
│  (Screens)  │◀────│  (Zustand)  │◀────│   (Local)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  (Cloud)    │
                    └─────────────┘
```

### Key Architectural Decisions

1. **Offline-First**: All data is stored locally in SQLite first, synced to cloud when online
2. **Optimistic UI**: Updates are shown immediately, rolled back on failure
3. **SRS Algorithm**: Supports both Leitner and SM-2 for spaced repetition
4. **Modular AI**: AI features are abstracted behind a service layer for easy provider switching

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### Test Structure
- `__tests__/` - Core logic tests (SRS, offline queue, etc.)
- `src/tests/` - Component and service tests
- `src/tests/__mocks__/` - Mock implementations

---

## 📦 Building for Production

### Using EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Configure EAS secrets (one-time setup)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"

# Build for Android (APK)
eas build --platform android --profile preview

# Build for Android (AAB for Play Store)
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Local Build (Android)

```bash
# Generate Android project
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug
```

---

## 🔄 CI/CD

Set up GitHub Actions for automated testing and deployment:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run tsc
      - run: npm test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Follow existing file naming conventions
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Quran data from [alquran.cloud](https://alquran.cloud/)
- Icons from [Lucide](https://lucide.dev/)
- Fonts: Cairo, Amiri, Scheherazade New

---

<p align="center">
  Made with ❤️ for the Islamic learning community
</p>
