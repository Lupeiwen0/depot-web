"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations, useLocale } from "next-intl";

export function LanguageToggle() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="end">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setLocale("zh")}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left ${
              locale === "zh" ? "bg-accent" : ""
            }`}
          >
            {t("zh")}
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left ${
              locale === "en" ? "bg-accent" : ""
            }`}
          >
            {t("en")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
