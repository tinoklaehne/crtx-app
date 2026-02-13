"use client";

import { ThemeProvider } from "next-themes";
import { FilterProvider } from "./contexts/FilterContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FilterProvider>
        {children}
      </FilterProvider>
    </ThemeProvider>
  );
}