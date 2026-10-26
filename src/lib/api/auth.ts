import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AuthResult =
  | { user: { id: string }; response?: never }
  | { user?: never; response: NextResponse };

/**
 * Verify the current Supabase user from cookies.
 * Returns the user ID on success, or a 401/503 NextResponse on failure.
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    return { user: { id: user.id } };
  } catch (err) {
    console.error(
      '[auth] failed to create Supabase client:',
      err instanceof Error ? err.message : err
    );
    return {
      response: NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      ),
    };
  }
}
