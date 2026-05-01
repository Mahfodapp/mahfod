const { Client } = require('pg');

const connectionString = "postgresql://postgres:sb_secret__mqMXdoXst3pu3ydcIR1ow_oAkfAB5U@db.fqypyxissuzpaohauuqw.supabase.co:5432/postgres";

const queries = `
    -- Update Memos table with missing columns from recent SM2 and favorites iterations
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT '';
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS next_review_at TEXT;
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS last_reviewed_at TEXT;
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'LEARNING';
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS related_memo_id TEXT;
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS part_number INTEGER;
    ALTER TABLE IF EXISTS memos ADD COLUMN IF NOT EXISTS is_favorite INTEGER DEFAULT 0;

    -- Create new remote tables for the newest features
    CREATE TABLE IF NOT EXISTS lessons_matns (
        id TEXT PRIMARY KEY, 
        user_id UUID, 
        title TEXT NOT NULL, 
        author TEXT DEFAULT '', 
        subject TEXT DEFAULT '', 
        verses TEXT DEFAULT '[]', 
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quran_progress (
        id TEXT PRIMARY KEY, 
        user_id UUID, 
        type TEXT NOT NULL, 
        thumn_id INTEGER NOT NULL, 
        value TEXT NOT NULL, 
        updated_at TEXT NOT NULL
    );

    -- Enable RLS for the new tables
    ALTER TABLE lessons_matns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;
`;

async function execute() {
    console.log("Connecting to Supabase...");
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        console.log("Applying schema updates...");
        await client.query(queries);
        
        // Safely add policies (ignoring if they already exist to prevent failure)
        try {
            await client.query("CREATE POLICY \"Users own their data\" ON lessons_matns FOR ALL USING (auth.uid() = user_id);");
        } catch (e) {
            console.log("Policy for lessons_matns exists or failed:", e.message);
        }
        
        try {
            await client.query("CREATE POLICY \"Users own their data\" ON quran_progress FOR ALL USING (auth.uid() = user_id);");
        } catch (e) {
            console.log("Policy for quran_progress exists or failed:", e.message);
        }
        
        console.log("✅ Success! Database schema is synchronized.");
    } catch (e) {
        console.error("❌ Error applying schema:", e);
    } finally {
        await client.end();
    }
}

execute();
