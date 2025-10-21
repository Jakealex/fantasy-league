import { prisma } from "@/lib/prisma";

// Local types—stable and enough for this page
type PositionCode = "GK" | "OUT";
type StatusCode = "A" | "I";

type UIPlayer = {
  id: string;
  name: string;
  teamName: string;
  position: PositionCode;
  price: number;
  status: StatusCode;
};

function positionLabel(pos: PositionCode): string {
  return pos === "GK" ? "Goalkeeper" : "Outfield";
}

function statusLabel(s: StatusCode): string {
  return s === "A" ? "Active" : "Injured";
}

export default async function PlayersPage() {
  const players = (await prisma.player.findMany({
    orderBy: [{ teamName: "asc" }, { name: "asc" }],
  })) as UIPlayer[];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Players</h1>

      {players.length === 0 ? (
        <p className="text-gray-600">No players found.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p: UIPlayer) => (
            <li
              key={p.id}
              className="rounded-lg border p-4 shadow-sm hover:shadow transition"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{p.name}</h2>
                <span className="text-sm font-mono">
                  R{p.price.toLocaleString("en-ZA")}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {positionLabel(p.position)} • {p.teamName}
              </p>
              <p className="text-xs mt-2">
                <span
                  className={
                    "inline-block rounded px-2 py-0.5 " +
                    (p.status === "A"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800")
                  }
                >
                  {statusLabel(p.status)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
