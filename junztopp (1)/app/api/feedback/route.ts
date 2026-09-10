import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterMessage } from "@/lib/profanityFilter";

export async function POST(req: Request) {
  const body = await req.json();
  const name: string = (body.name || "Anonim").slice(0, 60);
  const message: string = (body.message || "").slice(0, 1000);

  if (!message.trim()) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }

  const { filtered, wasCensored } = filterMessage(message);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    name,
    message_original: message,
    message_filtered: filtered,
    was_censored: wasCensored,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    displayedMessage: filtered,
    wasCensored,
  });
}
