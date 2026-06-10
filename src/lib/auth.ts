import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { User as DbUser } from "@prisma/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

/** The authenticated Supabase user, or null. */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * The authenticated user's application profile (User row), or null when
 * not signed in or not yet onboarded.
 */
export async function getCurrentUser(): Promise<{
  authUser: SupabaseUser
  dbUser: DbUser | null
} | null> {
  const authUser = await getAuthUser()
  if (!authUser) return null
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  })
  return { authUser, dbUser }
}
