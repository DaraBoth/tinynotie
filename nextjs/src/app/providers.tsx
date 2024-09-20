"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "sonner"; // Correct import from 'sonner'

interface ProvidersProps {
  children: ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider basePath="/api/auth">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors /> {/* Correct usage of Toaster */}
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers; // Export as default
