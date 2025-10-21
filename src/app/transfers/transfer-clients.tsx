"use client";

import { useMemo, useState } from "react";
import { addToSquadAction, removeFromSquadAction } from "./actions";

type SquadSlot = { slotLabel: string; player?: { id: string; name: string } };
type Player = {
  id: string;
  name: string;
  teamName: string;
  position: "GK" | "OUT";
  price: number;
  status: "A" | "I";
  ownedPct: number;
  nextFixture?: string;
  totalPoints?: number;
  roundPoints?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
};

export default function TransfersClient({
  squad,
  players,
}: {
  squad: SquadSlot[];
  players: Player[];
}) {
  // ---------- Filters / sort ----------
  const [q, setQ] = useState("");
  const [team, setTeam] = useState<string>("All");
  const [pos, setPos] = useState<"All" | "GK" | "OUT">("All");
  const [status, setStatus] = useState<"All" | "A" | "I">("All");
  const [sort, setSort] = useState<string>("%owned-desc");

  const teams = useMemo(
    () => Array.from(new Set(players.map((p) => p.teamName))).sort(),
    [players]
  );

  const filtered = useMemo(() => {
    let rows = players.filter((p) =>
      p.name.toLowerCase().includes(q.toLowerCase().trim())
    );
    if (team !== "All") rows = rows.filter((p) => p.teamName === team);
    if (pos !== "All") rows = rows.filter((p) => p.position === pos);
    if (status !== "All") rows = rows.filter((p) => p.status === status);

    const cmp: Record<string, (a: Player, b: Player) => number> = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "team-asc": (a, b) => a.teamName.localeCompare(b.teamName),
      "team-desc": (a, b) => b.teamName.localeCompare(a.teamName),
      "%owned-desc": (a, b) => (b.ownedPct ?? 0) - (a.ownedPct ?? 0),
      "points-desc": (a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0),
      "assists-desc": (a, b) => (b.assists ?? 0) - (a.assists ?? 0),
      "goals-desc": (a, b) => (b.goals ?? 0) - (a.goals ?? 0),
      "cleans-desc": (a, b) => (b.cleanSheets ?? 0) - (a.cleanSheets ?? 0),
    };
    rows.sort(cmp[sort] ?? cmp["price-desc"]);
    return rows;
  }, [players, q, team, pos, status, sort]);

  // ---------- Optimistic state (Add & Remove) ----------
  const [localSquad, setLocalSquad] = useState<SquadSlot[]>(squad);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [justAddedIds, setJustAddedIds] = useState<Set<string>>(new Set());

  const isInSquad = (pid: string) =>
    localSquad.some((s) => s.player?.id === pid);

  const nextOpenSlotIndex = (position: "GK" | "OUT") => {
    const labelPrefix = position === "GK" ? "GK" : "OUT";
    return localSquad.findIndex(
      (s) => s.slotLabel.startsWith(labelPrefix) && !s.player
    ); // -1 if none
  };

  async function handleAdd(p: Player) {
    if (isInSquad(p.id)) return;

    const idx = nextOpenSlotIndex(p.position);
    if (idx === -1) {
      alert(p.position === "GK" ? "Goalkeeper slot is full" : "Outfield slots are full");
      return;
    }

    const prev = localSquad;
    const next = [...localSquad];
    next[idx] = { ...next[idx], player: { id: p.id, name: p.name } };
    setLocalSquad(next);
    setPendingId(p.id);

    try {
      const fd = new FormData();
      fd.append("playerId", p.id);
      await addToSquadAction(fd);

      setJustAddedIds(new Set([...justAddedIds, p.id]));
      setTimeout(() => {
        setJustAddedIds((prevSet) => {
          const s = new Set(prevSet);
          s.delete(p.id);
          return s;
        });
      }, 1200);
    } catch (err) {
      console.error(err);
      setLocalSquad(prev);
      alert("Could not add player. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(slot: SquadSlot) {
    if (!slot.player) return;
    const playerId = slot.player.id;

    const prev = localSquad;
    const next = localSquad.map((s) =>
      s.slotLabel === slot.slotLabel ? { ...s, player: undefined } : s
    );
    setLocalSquad(next);
    setPendingRemoveId(playerId);

    try {
      const fd = new FormData();
      fd.append("playerId", playerId);
      await removeFromSquadAction(fd);
    } catch (err) {
      console.error(err);
      setLocalSquad(prev);
      alert("Could not remove player. Please try again.");
    } finally {
      setPendingRemoveId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Squad layout */}
      <section className="lg:col-span-1">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Your Squad (1 GK + 4 OUT)</h2>

          <div className="space-y-3">
            {/* GK row */}
            <SlotRow label="Goalkeeper">
              <SlotCard
                slot={localSquad.find((s) => s.slotLabel === "GK1")}
                onRemove={handleRemove}
                pendingRemoveId={pendingRemoveId}
              />
            </SlotRow>

            {/* Outfield rows: 4 slots */}
            <SlotRow label="Outfield">
              <div className="grid grid-cols-2 gap-3">
                {["OUT1", "OUT2", "OUT3", "OUT4"].map((lbl) => (
                  <SlotCard
                    key={lbl}
                    slot={localSquad.find((s) => s.slotLabel === lbl)}
                    onRemove={handleRemove}
                    pendingRemoveId={pendingRemoveId}
                  />
                ))}
              </div>
            </SlotRow>
          </div>
        </div>
      </section>

      {/* Right: Player list with filters */}
      <section className="lg:col-span-2">
        <div className="rounded-xl border p-4 mb-4">
          <h2 className="font-semibold mb-3">Player Selection</h2>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for player..."
                className="w-full rounded border px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Team</label>
              <select
                className="rounded border px-2 py-1"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option>All</option>
                {teams.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Position</label>
              <select
                className="rounded border px-2 py-1"
                value={pos}
                onChange={(e) =>
                  setPos(e.target.value as "All" | "GK" | "OUT")
                }
              >
                <option>All</option>
                <option value="GK">GK</option>
                <option value="OUT">Outfield</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                className="rounded border px-2 py-1"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "All" | "A" | "I")
                }
              >
                <option>All</option>
                <option value="A">Active</option>
                <option value="I">Injured</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Sort by</label>
              <select
                className="rounded border px-2 py-1"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="%owned-desc">% Owned (high → low)</option>
                <option value="price-desc">Price (high → low)</option>
                <option value="price-asc">Price (low → high)</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="team-asc">Team (A–Z)</option>
                <option value="team-desc">Team (Z–A)</option>
                <option value="points-desc">Total points (high → low)</option>
                <option value="assists-desc">Assists (high → low)</option>
                <option value="goals-desc">Goals (high → low)</option>
                <option value="cleans-desc">Clean sheets (high → low)</option>
              </select>
            </div>
          </div>
        </div>

        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const disabled =
              pendingId === p.id ||
              isInSquad(p.id) ||
              nextOpenSlotIndex(p.position) === -1;

            const label =
              pendingId === p.id
                ? "Adding..."
                : justAddedIds.has(p.id)
                ? "Added ✓"
                : isInSquad(p.id)
                ? "In Squad"
                : "Add to Squad";

            return (
              <li key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-600">
                      {p.position === "GK" ? "Goalkeeper" : "Outfield"} • {p.teamName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">R{p.price.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">
                      {p.ownedPct.toFixed(1)}% owned
                    </div>
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-700">
                    i Info
                  </summary>
                  <div className="mt-1 text-xs space-y-1">
                    <div><b>Fixture:</b> {p.nextFixture ?? "TBD"}</div>
                    <div><b>Status:</b> {p.status === "A" ? "Active" : "Injured"}</div>
                    <div><b>Total points:</b> {p.totalPoints ?? 0}</div>
                    <div><b>Round points:</b> {p.roundPoints ?? 0}</div>
                    <div>
                      <b>Goals:</b> {p.goals ?? 0} • <b>Assists:</b> {p.assists ?? 0}
                      {p.position === "GK" ? <> • <b>Clean sheets:</b> {p.cleanSheets ?? 0}</> : null}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      * Some stats are placeholders until scoring is wired.
                    </div>
                  </div>
                </details>

                <div className="mt-2">
                  <button
                    onClick={() => handleAdd(p)}
                    disabled={disabled}
                    className={
                      "rounded border px-3 py-1 text-sm " +
                      (disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                    }
                  >
                    {label}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function SlotRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function SlotCard({
  slot,
  onRemove,
  pendingRemoveId,
}: {
  slot?: SquadSlot;
  onRemove?: (slot: SquadSlot) => void;
  pendingRemoveId?: string | null;
}) {
  const empty = !slot?.player;
  const removing = !!slot?.player && pendingRemoveId === slot.player.id;

  return (
    <div
      className={
        "rounded-lg border p-3 flex items-center justify-between " +
        (empty ? "bg-gray-50 text-gray-500" : "")
      }
    >
      <div className="text-sm">
        {empty ? (
          <span className="italic">Empty</span>
        ) : (
          <span className="font-medium">{slot?.player?.name}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!empty && onRemove && slot ? (
          <button
            onClick={() => onRemove(slot)}
            disabled={removing}
            className={
              "text-[11px] border rounded px-2 py-1 " +
              (removing ? "opacity-60 cursor-wait" : "hover:bg-gray-50")
            }
            title="Remove from squad"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        ) : null}
        <div className="text-[11px] text-gray-600">{slot?.slotLabel}</div>
      </div>
    </div>
  );
}
