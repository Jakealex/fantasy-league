// src/app/transfers/page.tsx
import prisma from "@/lib/prisma";

import TransfersClient from "./transfer-clients";

type BasePlayer = {
  id: number | string;
  name: string;
  teamName: string;
  position: string;
  price: number;
  status: string;
};

type UIPlayer = BasePlayer & {
  ownedPct: number;
  nextFixture?: string;
  totalPoints: number;
  roundPoints: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
};

type UpcomingFixture = {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
};

export default async function TransfersPage() {
  // 1) Load active team & slots (server-side only, not passed to client)
 const team = await prisma.team.findFirst({
  include: { slots: { include: { player: true } } },
});


  // 2) Load all available players
  const players = await prisma.player.findMany({
    orderBy: [{ teamName: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      teamName: true,
      position: true,
      price: true,
      status: true,
    },
  });

  // 3) Compute ownership percentage
  const [slotCounts, totalTeams] = await Promise.all([
    prisma.squadSlot.groupBy({
      by: ["playerId"],
      _count: { playerId: true },
    }),
    prisma.team.count(),
  ]);

  const ownedMap = new Map<number | string, number>(
    slotCounts.map(
      (g: { playerId: number | string; _count: { playerId: number } }) => [
        g.playerId,
        totalTeams ? (g._count.playerId / totalTeams) * 100 : 0,
      ]
    )
  );

  // 4) Get upcoming fixtures (for next opponent display)
  const upcomingFixtures = (await prisma.fixture.findMany({
    where: { kickoffAt: { gt: new Date() } },
    orderBy: { kickoffAt: "asc" },
    take: 200,
  })) as UpcomingFixture[];

  const pickNextFixture = (teamName: string): string | undefined => {
    const fx = upcomingFixtures.find(
      (f: UpcomingFixture) => f.homeTeam === teamName || f.awayTeam === teamName
    );
    if (!fx) return undefined;
    const opp = fx.homeTeam === teamName ? fx.awayTeam : fx.homeTeam;
    return `${opp} (${fx.homeTeam === teamName ? "H" : "A"})`;
  };

  // 5) Server-side UIPlayer list
  const uiPlayers: UIPlayer[] = players.map((p: BasePlayer) => ({
    ...p,
    ownedPct: Math.round(((ownedMap.get(p.id) ?? 0) as number) * 10) / 10,
    nextFixture: pickNextFixture(p.teamName),
    totalPoints: 0,
    roundPoints: 0,
    goals: 0,
    assists: 0,
    cleanSheets: p.position === "GK" ? 0 : undefined,
  }));

  // 6) Adapt to client component props
  type ClientPosition = "GK" | "OUT";
  type ClientStatus = "A" | "I";

  type ClientPlayer = {
    id: string;
    name: string;
    teamName: string;
    position: ClientPosition;
    price: number;
    status: ClientStatus;
    ownedPct: number;
    nextFixture?: string;
    totalPoints?: number;
    roundPoints?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
  };

  const playersForClient: ClientPlayer[] = uiPlayers.map((p) => ({
    id: String(p.id),
    name: p.name,
    teamName: p.teamName,
    position: (p.position === "GK" ? "GK" : "OUT") as ClientPosition,
    price: p.price,
    status: (p.status === "I" ? "I" : "A") as ClientStatus,
    ownedPct: Number.isFinite(p.ownedPct) ? p.ownedPct : 0,
    nextFixture: p.nextFixture,
    totalPoints: p.totalPoints,
    roundPoints: p.roundPoints,
    goals: p.goals,
    assists: p.assists,
    cleanSheets: p.cleanSheets,
  }));

  // 7) Create squad structure for display
  const labelOrder = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

  type ClientSquadSlot = {
    slotLabel: string;
    player?: { id: string; name: string };
  };

  const squadForClient: ClientSquadSlot[] = labelOrder.map((label) => {
    const found = team.slots.find(
      (s: { slotLabel: string; player?: BasePlayer }) => s.slotLabel === label
    );
    return found?.player
      ? {
          slotLabel: label,
          player: { id: String(found.player.id), name: found.player.name },
        }
      : { slotLabel: label, player: undefined };
  });

  // 8) Render Transfers client component (no team prop)
  return (
    <div className="p-6">
      <TransfersClient players={playersForClient} squad={squadForClient} />
    </div>
  );
}
