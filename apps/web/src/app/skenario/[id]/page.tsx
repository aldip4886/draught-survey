import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { loadScenario } from "@/lib/scenarios";

export const dynamic = "force-dynamic";

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = loadScenario(id);
  if (!scenario) notFound();
  return <Player scenario={scenario} />;
}
