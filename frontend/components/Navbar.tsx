"use client";

import { Sparkles } from "lucide-react";

export function Navbar() {

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-300 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
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
