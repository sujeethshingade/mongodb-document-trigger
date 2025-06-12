import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MongoDB Document Trigger",
  description: "A simple app to trigger MongoDB document changes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-background min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
