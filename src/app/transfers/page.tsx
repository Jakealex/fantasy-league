// src/app/transfers/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentGameweek } from "@/lib/gameweek";
import TransfersClient from "./transfer-clients";
import type { Player as UiPlayer, SquadSlot as UiSquadSlot } from "@/types/fantasy";

const BASE_BUDGET = 34;

// Map DB player -> UI player (typed to your UI unions)
function toUiPlayer(p: {
  id: string;
  name: string;
  teamName: string;
  position: string;
  price: number;
  status: string;
  ownedPct: number | null;
  nextFixture: string | null;
  totalPoints: number | null;
  roundPoints: number | null;
  goals: number | null;
  assists: number | null;
  cleanSheets: number | null;
}): UiPlayer {
  return {
    id: p.id,
    name: p.name,
    teamName: p.teamName,
    position: p.position as UiPlayer["position"],
    price: p.price,
    status: p.status as UiPlayer["status"],
    ownedPct: p.ownedPct ?? 0,
    nextFixture: p.nextFixture ?? undefined,
    totalPoints: p.totalPoints ?? undefined,
    roundPoints: p.roundPoints ?? undefined,
    goals: p.goals ?? undefined,
    assists: p.assists ?? undefined,
    cleanSheets: p.cleanSheets ?? undefined,
  };
}

export default async function Page() {
  // TODO: replace with real user/league lookup
  const user = await prisma.user.findFirstOrThrow();
  const league = await prisma.league.findFirstOrThrow({ where: { ownerId: user.id } });
  let team = await prisma.team.findFirst({
  where: { userId: user.id, leagueId: league.id },
});

if (!team) {
  team = await prisma.team.create({
    data: { name: "Admin XI", userId: user.id, leagueId: league.id, budget: 34 },
  });

  // ensure empty slots exist
  const labels = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"];
  await Promise.all(
    labels.map((slotLabel) =>
      prisma.squadSlot.upsert({
        where: { teamId_slotLabel: { teamId: team!.id, slotLabel } },
        update: {},
        create: { teamId: team!.id, slotLabel },
      })
    )
  );
}


  // ---- Players
  const dbPlayers = await prisma.player.findMany();
  const players: UiPlayer[] = dbPlayers.map((p: typeof dbPlayers[number]): UiPlayer => toUiPlayer(p));


  // ---- Squad slots (with joined player)
  const dbSlots = await prisma.squadSlot.findMany({
    where: { teamId: team.id },
    include: { player: true },
    orderBy: { slotLabel: "asc" },
  });

  const squad: UiSquadSlot[] = dbSlots.map(
    (s: typeof dbSlots[number]): UiSquadSlot => ({
      slotLabel: s.slotLabel,
      player: s.player ? { id: s.player.id, name: s.player.name } : undefined,
    })
  );

  // ---- Remaining budget = BASE_BUDGET - sum(selected player prices)
  const taken: number = dbSlots
    .map((s: typeof dbSlots[number]): number => s.player?.price ?? 0)
    .reduce((a: number, b: number): number => a + b, 0);

  const initialBudget: number = BASE_BUDGET - taken;

  // Fetch global settings for transfers status
  const globalSettings = await prisma.globalSettings.findUnique({
    where: { id: 1 },
  });
  const transfersOpen = globalSettings?.transfersOpen ?? true;

  // Fetch current gameweek
  const currentGameweek = await getCurrentGameweek();
  if (!currentGameweek) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-xl border border-red-400 bg-red-50 text-red-800 p-4">
          <h1 className="text-xl font-bold mb-2">No Active Gameweek</h1>
          <p>There is no current gameweek configured. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <TransfersClient
      squad={squad}
      players={players}
      initialBudget={initialBudget}
      transfersOpen={transfersOpen}
      currentGameweek={currentGameweek}
    />
  );
}
