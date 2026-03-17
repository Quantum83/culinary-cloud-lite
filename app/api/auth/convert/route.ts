import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabaseUser = getSupabaseForUser(req);
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user || !user.is_anonymous) {
    return NextResponse.json(
      { error: "Not an anonymous user" },
      { status: 400 },
    );
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 },
    );
  }

  const supabaseAdmin = getSupabaseServer();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
