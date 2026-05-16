import type { Metadata } from "next";
import { getMatchesWithScorers } from "@/lib/data";
import MatchTable from "@/components/MatchTable";

export const metadata: Metadata = { title: "Match History" };
export const revalidate = 3600;

export default async function MatchesPage() {
  const matches = await getMatchesWithScorers();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="section-heading mb-2">Match History</h1>
        <p className="text-2xl sm:text-3xl font-black text-eg-text">Every match Egypt has played</p>
        <p className="text-eg-muted text-sm mt-1">{matches.length} matches recorded</p>
      </div>
      <MatchTable matches={matches} />
    </main>
  );
}
