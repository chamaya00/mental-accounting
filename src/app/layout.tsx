import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bet On Yourself",
  description: "Stake Gold Coins on your habits. Win big when you follow through.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
