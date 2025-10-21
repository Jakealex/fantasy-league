import { prisma } from "@/lib/prisma";

// Mirror your schema enums without importing Prisma types
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

export default async function TransfersPage() {
  const players = (await prisma.player.findMany({
    orderBy: [{ teamName: "asc" }, { name: "asc" }],
  })) as UIPlayer[];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Transfers</h1>

      <section className="mb-4">
        <h2 className="text-xl font-semibold">Available Players</h2>
        <p className="text-sm text-gray-600">
          Browse and select players to transfer into your squad.
        </p>
      </section>

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
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <span className="text-sm font-mono">
                  R{p.price.toFixed( p.price % 1 ? 1 : 0 )}
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

              {/* Placeholder action button for later */}
              <div className="mt-3">
                <button
                  className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                  disabled
                  title="Hook this up to your transfer action later"
                >
                  Add to Squad
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
