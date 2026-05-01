import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fqypyxissuzpaohauuqw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ySbcN732SXWZKj6edfL1MA_z5sJSoSZ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
    console.log("Testing Signup...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test_mahfod@example.com',
        password: 'securePassword123!',
    });
    console.log("Signup Error:", signUpError?.message);
    console.log("Signup Data:", !!signUpData.user);

    console.log("Testing Login...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test_mahfod@example.com',
        password: 'securePassword123!',
    });
    console.log("Login Error:", loginError?.message);
    console.log("Login Data session:", !!loginData.session);
}

testAuth();
