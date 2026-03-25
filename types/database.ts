// Supabase 데이터베이스 타입 정의

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  bio: string | null
  created_at: string
  updated_at: string
}
