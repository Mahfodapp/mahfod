// metro.config.js
// Optimized to prevent OOM crashes on large projects
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ── Memory optimizations ──────────────────────────────────────────────────────

// Limit parallel workers so Metro doesn't spawn too many Node processes
// each consuming ~300MB. On an 8GB machine use 2; on 16GB use 4.
config.maxWorkers = 2;

// Persistent cache: use Metro's default FileStore (disk cache in os.tmpdir/metro-cache)
// so subsequent runs don't re-parse & re-transform all 3 000+ modules from scratch.
// Do NOT set config.cacheStores = undefined — that destroys the default array and crashes Metro.

// Avoid bundling node-only packages that sneak in via @supabase/supabase-js
// and other server-side deps — they balloon the bundle size in memory
config.resolver = {
    ...config.resolver,
    // Block server-only Node built-ins that have no RN equivalent
    blockList: [
        // Drizzle kit is dev-only CLI, never needed at runtime
        /drizzle-kit\/.*/,
        // pg (node-postgres) is server-only
        /node_modules\/pg\/.*/,
        // Expo autolinking Kotlin build artifacts — watcher crashes on Windows (ENOENT)
        /expo-modules-autolinking\/android\/expo-gradle-plugin\/.*/,
    ],
};

// ── Transformer settings ──────────────────────────────────────────────────────
config.transformer = {
    ...config.transformer,
    // Inline requires defers evaluation of modules until first use,
    // reducing peak memory during the initial bundle parse phase
    inlineRequires: true,
};

module.exports = config;
