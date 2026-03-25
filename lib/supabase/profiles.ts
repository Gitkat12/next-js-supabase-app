import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";

// 특정 사용자의 프로필 조회
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("프로필 조회 실패:", error);
    return null;
  }

  return data as Profile;
}

// 프로필 업데이트
export async function updateProfile(
  userId: string,
  profile: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("프로필 업데이트 실패:", error);
    return null;
  }

  return data as Profile;
}

// 현재 사용자의 프로필 조회
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  // 현재 로그인한 사용자의 세션 정보 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getProfile(user.id);
}

// 프로필 존재 여부 확인
export async function profileExists(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  return !!data;
}
