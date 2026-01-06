"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("theme");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="end">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left ${
              theme === "light" ? "bg-accent" : ""
            }`}
          >
            <Sun className="h-4 w-4" />
            {t("light")}
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left ${
              theme === "dark" ? "bg-accent" : ""
            }`}
          >
            <Moon className="h-4 w-4" />
            {t("dark")}
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left ${
              theme === "system" ? "bg-accent" : ""
            }`}
          >
            <Monitor className="h-4 w-4" />
            {t("system")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
