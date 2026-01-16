import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FundMeLater - Bet on Yourself",
  description: "A goal commitment app where you bet on yourself. Put money at risk, accomplish your goal, earn it back. Fail, and it goes to charity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
