import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json()

    // Initialize Supabase Admin Client (using the Secret Key)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Force Create User (Bypasses "Disabled" settings and Rate Limits)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark as verified immediately
      user_metadata: { full_name: fullName }
    })

    if (authError) throw authError

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: role || 'analyst'
      })

    if (profileError) console.error('Profile creation error:', profileError)

    return NextResponse.json({ 
      success: true, 
      message: 'Account created and verified instantly.' 
    })

  } catch (error: any) {
    console.error('Admin Signup Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
