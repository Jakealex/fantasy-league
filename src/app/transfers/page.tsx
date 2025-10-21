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
  // Load a team and its slots
  const team = await prisma.team.findFirst({
    include: { slots: { include: { player: true } } },
  });

  if (!team) {
    return <div className="p-6">No team found.</div>;
  }

  // Players
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

 // Ownership %
type SlotCount = { playerId: string | number; _count: { playerId: number } };

const [slotCounts, totalTeams] = (await Promise.all([
  prisma.squadSlot.groupBy({
    by: ["playerId"],
    _count: { playerId: true },
  }),
  prisma.team.count(),
])) as [SlotCount[], number];

const ownedMap = new Map<string | number, number>(
  slotCounts.map((g) => [
    g.playerId,
    totalTeams ? (g._count.playerId / totalTeams) * 100 : 0,
  ])
);

// Upcoming fixtures
const upcomingFixtures = (await prisma.fixture.findMany({
  where: { kickoffAt: { gt: new Date() } },
  orderBy: { kickoffAt: "asc" },
  take: 200,
})) as UpcomingFixture[];

  const pickNextFixture = (teamName: string): string | undefined => {
    const fx = upcomingFixtures.find(
      f => f.homeTeam === teamName || f.awayTeam === teamName
    );
    if (!fx) return undefined;
    const opp = fx.homeTeam === teamName ? fx.awayTeam : fx.homeTeam;
    return `${opp} (${fx.homeTeam === teamName ? "H" : "A"})`;
  };

  // Build UI players
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

  // Adapt to client types
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

  const playersForClient: ClientPlayer[] = uiPlayers.map(p => ({
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

  // Squad slots for client
  // Squad slots for client
const labelOrder = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

type SlotWithPlayer = {
  slotLabel: string;
  player: { id: string | number; name: string } | null;
};

const squadForClient = labelOrder.map((label) => {
  const found = (team.slots as unknown as SlotWithPlayer[]).find(
    (s: SlotWithPlayer) => s.slotLabel === label
  );

  return found?.player
    ? {
        slotLabel: label,
        player: { id: String(found.player.id), name: found.player.name },
      }
    : { slotLabel: label, player: undefined };
});

console.log("TRANSFERS PAGE DATA", {
  playersForClient: playersForClient.length,
  squadForClient: squadForClient.length,
});

return (
  <div className="p-6">
    <TransfersClient players={playersForClient} squad={squadForClient} />
  </div>
);
}
