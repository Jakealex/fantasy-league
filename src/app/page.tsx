import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentGameweek } from "@/lib/gameweek";

function LoggedOutHome() {
  return (
    <div className="max-w-2xl mx-auto mt-16 space-y-6 text-center">
      <h1 className="text-3xl font-bold">Welcome to Bnei Fantasy League</h1>
      <p className="text-sm text-gray-600">
        Pick your squad, compete with your shevet and friends, and see who tops
        the Overall, Tribe, and Maddie/Channie leagues.
      </p>

      <div className="flex justify-center gap-4 mt-4">
        <Link
          href="/signup"
          className="px-5 py-2 rounded bg-blue-600 text-white text-sm font-semibold"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 rounded border border-gray-300 text-sm"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-4">
        <Link href="/rules" className="text-xs text-blue-600 underline">
          View full rules
        </Link>
      </div>
    </div>
  );
}

function LoggedInHome({
  user,
  team,
  currentGameweek,
  totalPoints,
  lastGwPoints,
}: {
  user: { firstName: string | null; email: string };
  team: { name: string };
  currentGameweek: { number: number; deadlineAt: Date } | null;
  totalPoints: number;
  lastGwPoints: number;
}) {
  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <section className="border rounded-xl p-4">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user.firstName || user.email}
        </h1>
        <p className="text-sm text-gray-600">Team: {team.name}</p>
      </section>

      {/* Instructional Message */}
      <section className="border rounded-xl p-4 bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-900 mb-2">Getting Started</h2>
        <p className="text-sm text-blue-800">
          Go to <Link href="/transfers" className="font-semibold underline">Transfers</Link> to create your team, then go to{" "}
          <Link href="/pick-team" className="font-semibold underline">Pick Team</Link> to set your captain and save your lineup.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500 mb-1">
            Total Points
          </div>
          <div className="text-2xl font-semibold">{totalPoints}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500 mb-1">
            Last Gameweek
          </div>
          <div className="text-2xl font-semibold">{lastGwPoints}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-xs uppercase text-gray-500 mb-1">
            Current Gameweek
          </div>
          <div className="text-sm font-medium">
            {currentGameweek ? `GW ${currentGameweek.number}` : "Not set"}
          </div>
          {currentGameweek && (
            <div className="text-xs text-gray-500 mt-1">
              Deadline: {new Date(currentGameweek.deadlineAt).toLocaleString()}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/pick-team"
          className="border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold mb-1">Pick Team</h2>
          <p className="text-xs text-gray-600">
            View your starting XI and captain for the current gameweek.
          </p>
        </Link>
        <Link
          href="/transfers"
          className="border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold mb-1">Transfers</h2>
          <p className="text-xs text-gray-600">
            Adjust your squad before the deadline.
          </p>
        </Link>
        <Link
          href="/leagues"
          className="border rounded-xl p-4 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold mb-1">Leagues</h2>
          <p className="text-xs text-gray-600">
            Check your rank in Overall, Shevet and Maddie/Channie leagues.
          </p>
        </Link>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoggedOutHome />;
  }

  const team = await prisma.team.findFirst({
    where: { userId: user.id },
  });

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-4">
        <h1 className="text-2xl font-bold">Welcome, {user.firstName || user.email}</h1>
        <p className="text-sm text-gray-600">
          You don&apos;t have a team yet. Create your squad to join the fun.
        </p>
        <Link
          href="/pick-team"
          className="inline-block px-4 py-2 rounded bg-blue-600 text-white text-sm"
        >
          Go to Pick Team
        </Link>
      </div>
    );
  }

  const currentGameweek = await getCurrentGameweek();
  const finishedGws = await prisma.gameweek.findMany({
    where: { isFinished: true },
    orderBy: { number: "asc" },
  });

  const finishedIds = finishedGws.map((gw: { id: number }) => gw.id);

  const scores =
    finishedIds.length > 0
      ? await prisma.gameweekScore.findMany({
          where: {
            teamId: team.id,
            gameweekId: { in: finishedIds },
          },
          include: { gameweek: true },
        })
      : [];

  let totalPoints = 0;
  let lastGwPoints = 0;
  let lastGwNumber: number | null = null;

  for (const s of scores) {
    totalPoints += s.total;
    if (lastGwNumber === null || s.gameweek.number > lastGwNumber) {
      lastGwNumber = s.gameweek.number;
      lastGwPoints = s.total;
    }
  }

  return (
    <LoggedInHome
      user={user}
      team={team}
      currentGameweek={currentGameweek}
      totalPoints={totalPoints}
      lastGwPoints={lastGwPoints}
    />
  );
}
