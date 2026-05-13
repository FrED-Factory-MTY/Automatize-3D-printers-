const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test-${Date.now()}@tec.mx`;
  const password = 'password123';
  
  console.log('Signing up...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  console.log('SignUp Data:', signUpData);
  console.log('SignUp Error:', signUpError);

  console.log('\nSigning in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log('SignIn Data:', signInData);
  console.log('SignIn Error:', signInError);
}

test();
