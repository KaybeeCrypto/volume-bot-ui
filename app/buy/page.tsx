import { Suspense } from "react";
import BuyPageClient from "./BuyPageClient";

export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-16 text-black dark:bg-slate-950 dark:text-white">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 md:p-8">
              <p className="text-sm text-gray-500 dark:text-white/55">
                Loading buy page...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <BuyPageClient />
    </Suspense>
  );
}