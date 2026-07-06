"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BannersManager } from "./banners-manager";
import { LookbookManager } from "./lookbook-manager";
import { JournalManager } from "./journal-manager";
import type { AdminBannerRow, AdminLookbookRow, AdminJournalRow } from "@/lib/queries/admin-content";

const TABS = ["Banners", "Lookbook", "Journal"] as const;
type Tab = (typeof TABS)[number];

export function ContentTabs({
  banners,
  lookbookEntries,
  journalPosts,
  productOptions,
  canWrite,
}: {
  banners: AdminBannerRow[];
  lookbookEntries: AdminLookbookRow[];
  journalPosts: AdminJournalRow[];
  productOptions: Array<{ id: string; name: string }>;
  canWrite: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Banners");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "min-h-[44px] border-b-2 px-4 text-sm font-medium transition-colors",
              tab === t ? "border-ink text-ink" : "border-transparent text-ink/60 hover:text-ink"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Banners" ? <BannersManager banners={banners} canWrite={canWrite} /> : null}
      {tab === "Lookbook" ? (
        <LookbookManager entries={lookbookEntries} productOptions={productOptions} canWrite={canWrite} />
      ) : null}
      {tab === "Journal" ? <JournalManager posts={journalPosts} canWrite={canWrite} /> : null}
    </div>
  );
}
