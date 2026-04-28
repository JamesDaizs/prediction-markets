import { promises as fs } from "fs";
import path from "path";
import { BotsClient } from "./bots-client";
import type { BotAnalysisData } from "./types";

export const dynamic = "force-static";

async function loadBotData(): Promise<BotAnalysisData | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "bot_analysis.json"
    );
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function BotsPage() {
  const data = await loadBotData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-pm-fg-base">Bot Analysis</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-pm-border-base bg-pm-bg-card px-6 py-12 text-center">
          <p className="text-sm text-pm-fg-muted">
            No bot analysis data available. Drop a generated{" "}
            <code className="rounded bg-pm-bg-elevated px-2 py-0.5 text-xs text-pm-brand">
              public/data/bot_analysis.json
            </code>{" "}
            to populate this view.
          </p>
        </div>
      </div>
    );
  }

  return <BotsClient data={data} />;
}
