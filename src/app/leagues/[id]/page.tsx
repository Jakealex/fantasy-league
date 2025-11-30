import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

type LeaguePageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeagueStandingsPage({ params }: LeaguePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id: leagueId } = await params;

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6">
        <h1 className="text-2xl font-bold mb-4">League not found</h1>
        <Link href="/leagues" className="text-blue-600 hover:underline">
          ← Back to leagues
        </Link>
      </div>
    );
  }

  // Optional: ensure current user is a member of this league
  const userTeam = await prisma.team.findFirst({ where: { userId: user.id } });
  if (!userTeam) {
    redirect("/leagues");
  }

  const userMembership = await prisma.leagueMember.findFirst({
    where: { leagueId, teamId: userTeam.id },
  });

  // Allow viewing even if not a member (public view)
  // Uncomment to restrict to members only:
  // if (!userMembership) {
  //   redirect("/leagues");
  // }

  // Get all league members with their teams and managers
  const members = await prisma.leagueMember.findMany({
    where: { leagueId },
    include: {
      team: {
        include: {
          user: true,
        },
      },
    },
  });

  // Get all finished gameweeks
  const finishedGws = await prisma.gameweek.findMany({
    where: { isFinished: true },
    orderBy: { number: "asc" },
  });

  const finishedGwIds = finishedGws.map((gw) => gw.id);

  // Map teamId -> { totalPoints, latestPoints }
  const scores = await prisma.gameweekScore.findMany({
    where: {
      gameweekId: { in: finishedGwIds },
      teamId: { in: members.map((m) => m.teamId) },
    },
    include: {
      gameweek: true,
    },
  });

  const teamStats = new Map<
    string,
    {
      totalPoints: number;
      latestPoints: number;
      latestGwNumber: number | null;
    }
  >();

  for (const s of scores) {
    const prev = teamStats.get(s.teamId) ?? {
      totalPoints: 0,
      latestPoints: 0,
      latestGwNumber: null as number | null,
    };

    const newTotal = prev.totalPoints + s.total;

    let latestPoints = prev.latestPoints;
    let latestGwNumber = prev.latestGwNumber;

    if (s.gameweek.isFinished) {
      if (latestGwNumber === null || s.gameweek.number > latestGwNumber) {
        latestGwNumber = s.gameweek.number;
        latestPoints = s.total;
      }
    }

    teamStats.set(s.teamId, {
      totalPoints: newTotal,
      latestPoints,
      latestGwNumber,
    });
  }

  const rows = members.map((m) => {
    const ts = teamStats.get(m.teamId) ?? {
      totalPoints: 0,
      latestPoints: 0,
      latestGwNumber: null,
    };

    const firstName = m.team.user?.firstName || "";
    const lastName = m.team.user?.lastName || "";
    const managerName =
      firstName || lastName
        ? `${firstName} ${lastName}`.trim()
        : "Unknown";

    return {
      teamId: m.teamId,
      teamName: m.team.name,
      managerName,
      totalPoints: ts.totalPoints,
      latestPoints: ts.latestPoints,
    };
  });

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.teamName.localeCompare(b.teamName);
  });

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6">
      <div className="mb-4">
        <Link href="/leagues" className="text-sm text-blue-600 hover:underline">
          ← Back to leagues
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">{league.name}</h1>
      <p className="text-xs text-gray-500 mb-4">
        {league.type === "OVERALL" && "Overall standings"}
        {league.type === "TRIBE" && league.shevet && `Shichvah: ${league.shevet}`}
        {league.type === "ROLE" && league.role && `Group: ${league.role}`}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">
          No teams in this league yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Rank</th>
                <th className="text-left py-2 px-2">Team</th>
                <th className="text-left py-2 px-2">Manager</th>
                <th className="text-right py-2 px-2">Total Pts</th>
                <th className="text-right py-2 px-2">Last GW</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.teamId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{idx + 1}</td>
                  <td className="py-2 px-2">{row.teamName}</td>
                  <td className="py-2 px-2">{row.managerName}</td>
                  <td className="py-2 px-2 text-right font-medium">{row.totalPoints}</td>
                  <td className="py-2 px-2 text-right">{row.latestPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

