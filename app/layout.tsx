import type { Metadata, Viewport } from "next";
import Header from "./components/Header";
import { createClient } from "../lib/supabase-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorLounge",
  description: "강사·교육 종사자를 위한 커뮤니티",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    nickname = profile?.nickname ?? null;
  }

  return (
    <html lang="ko">
      <body>
        <Header nickname={nickname} />
        {children}
      </body>
    </html>
  );
}