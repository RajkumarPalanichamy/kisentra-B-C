import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const next = searchParams.get('next') ?? '/'
            // If redirecting to reset-password, add recovery flag
            if (next === '/reset-password') {
                // Set a cookie to indicate recovery flow (expires in 10 minutes)
                const response = NextResponse.redirect(`${origin}${next}?recovery=true`)
                response.cookies.set('password_recovery_flow', 'true', {
                    maxAge: 600, // 10 minutes
                    httpOnly: false, // Allow client-side access
                    sameSite: 'lax',
                    path: '/'
                })
                return response
            }
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`)
        }
    }

    const errorDescription = searchParams.get('error_description')
    if (errorDescription) {
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(errorDescription)}`)
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}
