import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MongoDB Document Trigger",
  description: "A simple MongoDB document trigger example",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-gray-200 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
