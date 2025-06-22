import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/lib/trpc";
import "./globals.css";
import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import ConditionalNavigation from "@/components/ConditionalNavigation";

const inter = Inter({ subsets: ["latin"] });

export function generateMetadata(): Metadata {
  return {
    title: "Redline - Automotive Community Platform",
    description: "Create your crew. Dominate your territory. Build your legend.",
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-black text-white`}>
          {/* Conditional Navigation Component */}
          <ConditionalNavigation />

          {/* Content with conditional padding */}
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
