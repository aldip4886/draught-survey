import { notFound } from "next/navigation";
import { toPublicScenario } from "@draught-survey/scenario-schema";
import { Player } from "@/components/Player";
import { loadScenario } from "@/lib/scenarios";

export const dynamic = "force-dynamic";

export default async function HalamanSkenario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await loadScenario(id);
  if (!scenario) notFound();
  // Hanya data tanpa nilai benar yang dikirim ke peramban.
  return <Player scenario={toPublicScenario(scenario)} />;
}
