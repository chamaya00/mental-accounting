import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bet On Yourself",
  description: "Stake Gold Coins on your habits. Build streaks. Win rewards.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
