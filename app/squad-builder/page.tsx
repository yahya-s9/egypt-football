import type { Metadata } from "next";
import { getPlayers } from "@/lib/data";
import SquadBuilder from "@/components/SquadBuilder";

export const metadata: Metadata = { title: "Squad Builder" };
export const revalidate = 3600;

export default async function SquadBuilderPage() {
  const players = await getPlayers();
  return <SquadBuilder players={players} />;
}
