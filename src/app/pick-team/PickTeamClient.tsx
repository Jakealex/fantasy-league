"use client";

import { useTransition, useState, useMemo } from "react";
import type { PickTeamSlot } from "./types";

const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

type SaveLineupResult = { ok: boolean; message: string };

type Props = {
  slots: PickTeamSlot[];
  onSave: (formData: FormData) => Promise<SaveLineupResult>;
};

export default function PickTeamClient({ slots, onSave }: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const gkSlot = useMemo<PickTeamSlot | undefined>(
    () => slots.find((slot) => slot.slotLabel === "GK1"),
    [slots]
  );

  const outfieldSlots = useMemo<PickTeamSlot[]>(() => {
    return REQUIRED_SLOT_LABELS.filter((label) => label.startsWith("OUT")).map((label) => {
      return slots.find((slot) => slot.slotLabel === label) ?? { slotLabel: label };
    });
  }, [slots]);

  const hasEmptySlots = useMemo<boolean>(
    () => REQUIRED_SLOT_LABELS.some((label) => !slots.find((slot) => slot.slotLabel === label)?.player),
    [slots]
  );

  function handleSave() {
    if (isPending) return;

    if (hasEmptySlots) {
      setErrorMsg("Select a player for every slot before saving.");
      setSuccessMsg("");
      return;
    }

    const payload = REQUIRED_SLOT_LABELS.map((label) => {
      const slot = slots.find((entry) => entry.slotLabel === label);
      return {
        slotLabel: label,
        playerId: slot?.player?.id ?? "",
      };
    });

    const incomplete = payload.find((slot) => !slot.playerId);
    if (incomplete) {
      setErrorMsg("Select a player for every slot before saving.");
      setSuccessMsg("");
      return;
    }

    const formData = new FormData();
    formData.append("slots", JSON.stringify(payload));

    startTransition(async () => {
      try {
        const result = await onSave(formData);
        if (!result.ok) {
          setErrorMsg(result.message || "Could not save lineup.");
          setSuccessMsg("");
          return;
        }

        setErrorMsg("");
        setSuccessMsg("Lineup saved successfully.");
        window.setTimeout(() => setSuccessMsg(""), 2500);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save lineup.";
        setErrorMsg(message);
        setSuccessMsg("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="fixed top-4 right-4 max-w-xs rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 shadow">
          {successMsg}
        </div>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Goalkeeper</h2>
        <div className="mt-3">
          <LineupCard slot={gkSlot ?? { slotLabel: "GK1" }} />
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Outfield</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {outfieldSlots.map((slot) => (
            <LineupCard key={slot.slotLabel} slot={slot} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        {errorMsg && (
          <div className="mb-3 rounded border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        {hasEmptySlots && !errorMsg && (
          <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Assign players to every slot before saving.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isPending}
          className={
            "w-full rounded bg-black px-3 py-2 text-sm font-medium text-white " +
            (isPending ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-900")
          }
        >
          {isPending ? "Saving…" : "Save Lineup"}
        </button>
      </section>
    </div>
  );
}

function LineupCard({ slot }: { slot: PickTeamSlot }) {
  if (!slot.player) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
        <div className="font-medium">{slot.slotLabel}</div>
        <div className="mt-1 italic">Empty slot</div>
      </div>
    );
  }

  const { player } = slot;
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {slot.slotLabel}
      </div>
      <div className="mt-1 text-base font-semibold">{player.name}</div>
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <span>{player.position === "GK" ? "Goalkeeper" : "Outfield"}</span>
        <span className="font-mono">R{player.price.toFixed(1)}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Total points: {player.totalPoints ?? 0}
      </div>
    </div>
  );
}
