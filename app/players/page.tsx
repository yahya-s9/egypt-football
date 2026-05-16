import type { Metadata } from "next";
import { getPlayers } from "@/lib/data";
import PlayerTable from "@/components/PlayerTable";

export const metadata: Metadata = { title: "All-Time Players" };

export const revalidate = 3600;

export default async function PlayersPage() {
  const players = await getPlayers();
  const sorted  = [...players].sort((a, b) => b.caps - a.caps);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="section-heading mb-2">All-Time Players</h1>
        <p className="text-2xl sm:text-3xl font-black text-eg-text">
          Every player to represent Egypt
        </p>
        <p className="text-eg-muted text-sm mt-1">{players.length} players · sorted by caps</p>
      </div>
      <PlayerTable players={sorted} />
    </main>
  );
}
