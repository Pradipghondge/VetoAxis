import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Velocity CRM',
  description: 'A system for managing leads efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We keep the "dark" class here so your midnight indigo theme 
    // is active on the Landing and Login pages too.
    <html lang="en" className="dark">
      <body className={cn(inter.className, "bg-[#09090b] text-white antialiased")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}