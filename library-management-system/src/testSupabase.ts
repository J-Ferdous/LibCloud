import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  console.log("🔍 Testing Supabase connection...");

  // 1. Test 1: Try to fetch something (public SELECT is allowed)
  const { data, error } = await supabase.from("books").select("*").limit(1);

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    console.error("❌ Supabase connection failed.");
  } else {
    console.log("✅ Supabase connection successful!");
  }
}
