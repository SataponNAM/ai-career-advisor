"use client";

import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0071df]/10">
              <Sparkles className="h-5 w-5 text-[#0071df]" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-foreground font-mono tracking-tight text-lg leading-tight">
                AI Career Advisor
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your intelligent career companion
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
