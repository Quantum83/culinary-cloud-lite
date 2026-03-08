import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseForUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: token ? `Bearer ${token}` : "" } } },
  );
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("created_at", { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { name, recipe_ids = [] } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("collections")
    .insert({ name, recipe_ids, user_id: user?.id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { id, name, recipe_ids } = await req.json();
  if (!id)
    return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (recipe_ids !== undefined) updates.recipe_ids = recipe_ids;

  const { data, error } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseForUser(req);
  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
