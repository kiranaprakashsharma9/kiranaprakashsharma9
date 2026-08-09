import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // supabase-js admin API: get user by email
    const res = await supabaseAdmin.auth.admin.getUserByEmail(email);

    // Depending on SDK version this may return { data, error } or { user, error }
    const exists = !!(res && (res.user || res.data));

    return NextResponse.json({ exists });
  } catch (err) {
    console.error('check-user error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
