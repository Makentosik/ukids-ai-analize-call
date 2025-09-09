import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProviderWrapper from "@/components/providers/session-provider";
import Navigation from "@/components/layout/navigation";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CallAI - Система оценки качества звонков",
  description: "Приложение для оценки качества звонков с использованием чек-листов",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru">
      <body className={inter.className}>
        <SessionProviderWrapper session={session}>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster 
            position="top-right"
            richColors
            closeButton
          />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
