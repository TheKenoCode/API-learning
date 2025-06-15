import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MIDNIGHT CLUB IRL - Underground Revolution",
  description: "Create your crew. Dominate your territory. Build your legend.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-black text-white`}>
          <Navigation />

          {/* Add padding to account for fixed header */}
          <div className="pt-20">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
