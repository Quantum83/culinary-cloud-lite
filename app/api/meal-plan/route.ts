import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseForUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? { week_data: {}, unscheduled: [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { week_data, unscheduled } = await req.json();

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("id")
    .limit(1)
    .single();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("meal_plans")
      .update({ week_data, unscheduled })
      .eq("id", existing.id)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ week_data, unscheduled, user_id: user?.id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
