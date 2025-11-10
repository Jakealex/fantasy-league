"use client";

import {
  useMemo,
  useState,
  useEffect,
  useTransition,
  type ReactNode,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import type { Player, SquadSlot } from "@/types/fantasy";
import { confirmTransfersDirect } from "./actions";

// ---------- utils ----------
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unexpected error";
  }
}

// Decide if a player can be added and why not (if blocked)
function canAddPlayer(
  p: Player,
  localSquad: SquadSlot[],
  players: Player[],
  localBudget: number,
  maxFromClub: number
): { ok: boolean; reason?: string; slotIndex?: number } {
  if (localBudget < p.price) return { ok: false, reason: "Insufficient funds" };

  const fromClub = localSquad.filter((s: SquadSlot) => {
    if (!s.player) return false;
    const match = players.find((pp: Player) => pp.id === s.player!.id);
    return match?.teamName === p.teamName;
  }).length;
  if (fromClub >= maxFromClub) {
    return { ok: false, reason: `Team limit reached (max ${maxFromClub})` };
  }

  const prefix = p.position === "GK" ? "GK" : "OUT";
  const idx = localSquad.findIndex(
    (s: SquadSlot): boolean => s.slotLabel.startsWith(prefix) && !s.player
  );
  if (idx === -1) return { ok: false, reason: "No free slot" };

  return { ok: true, slotIndex: idx };
}

function squadSignature(slots: SquadSlot[]): string {
  return slots
    .slice()
    .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel))
    .map((slot) => `${slot.slotLabel}:${slot.player?.id ?? "-"}`)
    .join("|");
}

function cloneSquad(slots: SquadSlot[]): SquadSlot[] {
  return slots.map((slot) => ({
    slotLabel: slot.slotLabel,
    player: slot.player ? { ...slot.player } : undefined,
  }));
}

const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

export default function TransfersClient({
  squad,
  players,
  initialBudget,
}: {
  squad: SquadSlot[];
  players: Player[];
  initialBudget: number;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  // ---------- Filters / sort ----------
  const [q, setQ] = useState<string>("");
  const [team, setTeam] = useState<string>("All");
  const [pos, setPos] = useState<"All" | "GK" | "OUT">("All");
  const [status, setStatus] = useState<"All" | "A" | "I">("All");
  const [sort, setSort] = useState<string>("%owned-desc");

  // ---------- Live budget + local squad ----------
  const [localSquad, setLocalSquad] = useState<SquadSlot[]>(() => cloneSquad(squad));
  const [localBudget, setLocalBudget] = useState<number>(initialBudget);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  // Ensure expected slots exist (defensive) and reset when server data changes
  useEffect(() => {
    const next = cloneSquad(squad);
    const labels = new Set(next.map((s) => s.slotLabel));
    REQUIRED_SLOT_LABELS.forEach((lbl) => {
      if (!labels.has(lbl)) {
        next.push({ slotLabel: lbl });
      }
    });
    setLocalSquad(next);
    setLocalBudget(initialBudget);
    setConfirmMessage(null);
  }, [squad, initialBudget]);

  // ---------- Derived lists ----------
  const teams = useMemo<string[]>(
    () => Array.from(new Set(players.map((p: Player): string => p.teamName))).sort(),
    [players]
  );

  const filtered = useMemo<Player[]>(() => {
    let rows: Player[] = players.filter((p: Player): boolean =>
      p.name.toLowerCase().includes(q.toLowerCase().trim())
    );
    if (team !== "All") rows = rows.filter((p: Player): boolean => p.teamName === team);
    if (pos !== "All") rows = rows.filter((p: Player): boolean => p.position === pos);
    if (status !== "All") rows = rows.filter((p: Player): boolean => p.status === status);

    const cmp: Record<string, (a: Player, b: Player) => number> = {
      "price-asc": (a: Player, b: Player): number => a.price - b.price,
      "price-desc": (a: Player, b: Player): number => b.price - a.price,
      "name-asc": (a: Player, b: Player): number => a.name.localeCompare(b.name),
      "name-desc": (a: Player, b: Player): number => b.name.localeCompare(a.name),
      "team-asc": (a: Player, b: Player): number => a.teamName.localeCompare(b.teamName),
      "team-desc": (a: Player, b: Player): number => b.teamName.localeCompare(a.teamName),
      "%owned-desc": (a: Player, b: Player): number => (b.ownedPct ?? 0) - (a.ownedPct ?? 0),
      "points-desc": (a: Player, b: Player): number => (b.totalPoints ?? 0) - (a.totalPoints ?? 0),
      "assists-desc": (a: Player, b: Player): number => (b.assists ?? 0) - (a.assists ?? 0),
      "goals-desc": (a: Player, b: Player): number => (b.goals ?? 0) - (a.goals ?? 0),
      "cleans-desc": (a: Player, b: Player): number =>
        (b.cleanSheets ?? 0) - (a.cleanSheets ?? 0),
    };
    rows.sort(cmp[sort] ?? cmp["price-desc"]);
    return rows;
  }, [players, q, team, pos, status, sort]);

  // ---------- helpers ----------
  const isInSquad = (pid: string): boolean =>
    localSquad.some((s: SquadSlot): boolean => s.player?.id === pid);

  const MAX_FROM_CLUB_LOCAL = 3;
  const initialSignature = useMemo<string>(() => squadSignature(squad), [squad]);
  const currentSignature = useMemo<string>(() => squadSignature(localSquad), [localSquad]);
  const hasUnsavedChanges = initialSignature !== currentSignature;

  useEffect(() => {
    console.log("transfer debug", {
      initialSignature,
      currentSignature,
      hasUnsavedChanges,
      squad,
      localSquad,
    });
  }, [initialSignature, currentSignature, hasUnsavedChanges, squad, localSquad]);

  function showError(msg: string): void {
    setErrorMsg(msg);
    window.setTimeout((): void => setErrorMsg(""), 2000);
  }

  // ---------- Add ----------
  function handleAdd(p: Player): void {
    // Let UI be clickable; we still block with messages here.
    const verdict = canAddPlayer(
      p,
      localSquad,
      players,
      localBudget,
      MAX_FROM_CLUB_LOCAL
    );
    if (!verdict.ok) {
      showError(verdict.reason ?? "Cannot add player");
      return;
    }
    const slotIndex = verdict.slotIndex ?? -1;
    if (slotIndex === -1) {
      showError("No free slot");
      return;
    }

    setLocalSquad((prev: SquadSlot[]): SquadSlot[] => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], player: { id: p.id, name: p.name } };
      return next;
    });
    setLocalBudget((b: number): number => b - p.price);
    setConfirmMessage(null);
  }

  // ---------- Remove ----------
  function handleRemove(slot: SquadSlot): void {
    if (!slot.player) return;

    const player: Player | undefined = players.find(
      (p: Player): boolean => p.id === slot.player!.id
    );
    const price: number = player?.price ?? 0;

    setLocalSquad((prev: SquadSlot[]): SquadSlot[] =>
      prev.map((s: SquadSlot): SquadSlot =>
        s.slotLabel === slot.slotLabel ? { ...s, player: undefined } : s
      )
    );
    setLocalBudget((b: number): number => b + price);
    setConfirmMessage(null);
  }

  // ---------- Confirm ----------
  function handleConfirm(): void {
    if (!hasUnsavedChanges || isSaving) {
      return;
    }
    setConfirmMessage(null);
    const slotsPayload = REQUIRED_SLOT_LABELS.map((label) => {
      const slot = localSquad.find((s) => s.slotLabel === label);
      return {
        slotLabel: label,
        playerId: slot?.player?.id ?? null,
      };
    });
    const formData = new FormData();
    formData.append("slots", JSON.stringify(slotsPayload));

    startSaving(async () => {
      try {
        const result = await confirmTransfersDirect(formData);
        if (!result.ok) {
          setConfirmMessage(result.message || "Could not confirm transfers.");
          return;
        }
        router.push("/pick-team");
      } catch (error) {
        setConfirmMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Squad */}
      <section className="lg:col-span-1">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Your Squad (1 GK + 4 OUT)</h2>

          <div className="space-y-3">
            <SlotRow label="Goalkeeper">
              <SlotCard
                slot={
                  localSquad.find((s: SquadSlot): boolean => s.slotLabel === "GK1") as
                    | SquadSlot
                    | undefined
                }
                onRemove={handleRemove}
              />
            </SlotRow>

            <SlotRow label="Outfield">
              <div className="grid grid-cols-2 gap-3">
                {["OUT1", "OUT2", "OUT3", "OUT4"].map((lbl: string) => (
                  <SlotCard
                    key={lbl}
                    slot={localSquad.find((s: SquadSlot): boolean => s.slotLabel === lbl)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SlotRow>
          </div>
        </div>
      </section>

      {/* Right: Filters + Budget + List */}
      <section className="lg:col-span-2">
        <div className="rounded-xl border p-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold mb-3">Player Selection</h2>

            {/* Budget pill */}
            <div className="rounded-full border px-3 py-1 text-sm">
              Budget: <span className="font-mono">R{localBudget.toFixed(1)}</span>
            </div>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-3 rounded border border-red-400 bg-red-50 text-red-800 px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                value={q}
                onChange={(e): void => setQ(e.target.value)}
                placeholder="Search for player..."
                className="w-full rounded border px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Team</label>
              <select
                className="rounded border px-2 py-1"
                value={team}
                onChange={(e): void => setTeam(e.target.value)}
              >
                <option>All</option>
                {teams.map((t: string) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Position</label>
              <select
                className="rounded border px-2 py-1"
                value={pos}
                onChange={(e): void => setPos(e.target.value as "All" | "GK" | "OUT")}
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
                onChange={(e): void => setStatus(e.target.value as "All" | "A" | "I")}
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
                onChange={(e): void => setSort(e.target.value)}
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
          {filtered.map((p: Player) => {
            const verdict = canAddPlayer(
              p,
              localSquad,
              players,
              localBudget,
              MAX_FROM_CLUB_LOCAL
            );

            const disabled = isInSquad(p.id);
            const label = isInSquad(p.id) ? "In Squad" : "Add to Squad";

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
                  <summary className="cursor-pointer text-xs text-gray-700">i Info</summary>
                  <div className="mt-1 text-xs space-y-1">
                    <div><b>Fixture:</b> {p.nextFixture ?? "TBD"}</div>
                    <div><b>Status:</b> {p.status === "A" ? "Active" : "Injured"}</div>
                    <div><b>Total points:</b> {p.totalPoints ?? 0}</div>
                    <div><b>Round points:</b> {p.roundPoints ?? 0}</div>
                    <div>
                      <b>Goals:</b> {p.goals ?? 0} • <b>Assists:</b> {p.assists ?? 0}
                      {p.position === "GK" ? (
                        <> • <b>Clean sheets:</b> {p.cleanSheets ?? 0}</>
                      ) : null}
                    </div>
                  </div>
                </details>

                <div className="mt-2">
                  <button
                    onClick={(): void => handleAdd(p)}
                    disabled={disabled}
                    className={
                      "rounded border px-3 py-1 text-sm " +
                      (disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
                    }
                    title={!verdict.ok && verdict.reason ? verdict.reason : undefined}
                  >
                    {label}
                  </button>

                  {!verdict.ok && !isInSquad(p.id) && (
                    <div className="mt-1 text-[11px] text-gray-600">
                      {verdict.reason}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-xl border p-4">
          {confirmMessage && (
            <div className="mb-3 rounded border border-red-400 bg-red-50 text-red-800 px-3 py-2 text-sm">
              {confirmMessage}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!hasUnsavedChanges || isSaving}
            className={
              "w-full rounded bg-black text-white px-3 py-2 text-sm font-medium " +
              (!hasUnsavedChanges || isSaving
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-gray-900 transition-colors")
            }
          >
            {isSaving ? "Saving..." : "Confirm Transfers"}
          </button>

          {!hasUnsavedChanges && (
            <p className="mt-2 text-xs text-gray-600">
              Make a change to enable confirmation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/* --- small UI helpers --- */
function SlotRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactElement {
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
}: {
  slot?: SquadSlot;
  onRemove?: (slot: SquadSlot) => void;
}): ReactElement {
  const empty: boolean = !slot?.player;

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
            onClick={(): void => onRemove(slot)}
            className={
              "text-[11px] border rounded px-2 py-1 hover:bg-gray-50"
            }
            title="Remove from squad"
          >
            Remove
          </button>
        ) : null}
        <div className="text-[11px] text-gray-600">{slot?.slotLabel}</div>
      </div>
    </div>
  );
}
