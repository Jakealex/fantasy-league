import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function LeaguesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const team = await prisma.team.findFirst({
    where: { userId: user.id },
  });

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <h1 className="text-2xl font-bold mb-4">Leagues</h1>
        <p className="text-sm text-gray-600">
          You don&apos;t have a team yet. Please create your team first.
        </p>
      </div>
    );
  }

  const memberships = await prisma.leagueMember.findMany({
    where: { teamId: team.id },
    include: { league: true },
  });

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-4">Your Leagues</h1>
      {memberships.length === 0 ? (
        <p className="text-sm text-gray-600">
          You are not a member of any leagues yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {memberships.map((m) => (
            <li key={m.id} className="border p-3 rounded flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="font-semibold">{m.league.name}</div>
                <div className="text-xs text-gray-500">
                  {m.league.type === "OVERALL" && "Overall League"}
                  {m.league.type === "TRIBE" && m.league.shevet && `Shichvah: ${m.league.shevet}`}
                  {m.league.type === "ROLE" && m.league.role && `Group: ${m.league.role}`}
                </div>
              </div>
              <Link
                href={`/leagues/${m.leagueId}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View standings
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
