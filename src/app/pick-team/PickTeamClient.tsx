"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { setCaptainAction } from "./actions";
import type { PickTeamSlot } from "./types";

const REQUIRED_SLOT_LABELS = ["GK1", "OUT1", "OUT2", "OUT3", "OUT4"] as const;

type SaveLineupResult = { ok: boolean; message: string };

type Props = {
  slots: PickTeamSlot[];
  onSave: (formData: FormData) => Promise<SaveLineupResult>;
  currentGameweek: {
    number: number;
    deadlineAt: string | Date;
    isFinished: boolean;
  };
  isLocked: boolean;
  teamScore: number | null; // Team's total score for current gameweek
};

export default function PickTeamClient({
  slots,
  onSave,
  currentGameweek,
  isLocked,
  teamScore,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCaptainPending, startCaptainTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [captainError, setCaptainError] = useState<string>("");

  const gkSlot = useMemo<PickTeamSlot | undefined>(
    () => slots.find((slot) => slot.slotLabel === "GK1"),
    [slots]
  );

  const outfieldSlots = useMemo<PickTeamSlot[]>(() => {
    return REQUIRED_SLOT_LABELS.filter((label) => label.startsWith("OUT")).map((label) => {
      return (
        slots.find((slot) => slot.slotLabel === label) ?? {
          id: "",
          slotLabel: label,
          isCaptain: false,
        }
      );
    });
  }, [slots]);

  const handleSetCaptain = (slotId: string) => {
    if (isLocked || isCaptainPending || !slotId) return;

    startCaptainTransition(async () => {
      try {
        setCaptainError("");
        const result = await setCaptainAction(slotId);
        if (result.ok) {
          // Refresh to show updated captain status
          router.refresh();
        } else {
          setCaptainError(result.message || "Failed to set captain");
          setTimeout(() => setCaptainError(""), 3000);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to set captain";
        setCaptainError(message);
        setTimeout(() => setCaptainError(""), 3000);
      }
    });
  };

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

      {/* Team Score Display */}
      {teamScore !== null && (
        <div className="rounded-xl border border-blue-400 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                Gameweek {currentGameweek.number} Score
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Your team&apos;s total points for this gameweek
              </p>
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {teamScore}
            </div>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Captain selection is locked</p>
          <p className="mt-1">
            Captain changes are locked for this gameweek (deadline passed, gameweek finished, or transfers closed).
          </p>
        </div>
      )}

      {captainError && (
        <div className="rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-800">
          {captainError}
        </div>
      )}

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Goalkeeper</h2>
        <div className="mt-3">
          <LineupCard
            slot={gkSlot ?? { id: "", slotLabel: "GK1", isCaptain: false }}
            onSetCaptain={handleSetCaptain}
            isLocked={isLocked}
            isPending={isCaptainPending}
          />
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Outfield</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {outfieldSlots.map((slot) => (
            <LineupCard
              key={slot.slotLabel}
              slot={slot}
              onSetCaptain={handleSetCaptain}
              isLocked={isLocked}
              isPending={isCaptainPending}
            />
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

function LineupCard({
  slot,
  onSetCaptain,
  isLocked,
  isPending,
}: {
  slot: PickTeamSlot;
  onSetCaptain: (slotId: string) => void;
  isLocked: boolean;
  isPending: boolean;
}) {
  if (!slot.player) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
        <div className="font-medium">{slot.slotLabel}</div>
        <div className="mt-1 italic">Empty slot</div>
      </div>
    );
  }

  const { player } = slot;
  const canSetCaptain = !isLocked && !isPending && slot.id;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {slot.slotLabel}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-base font-semibold">{player.name}</div>
            {slot.isCaptain && (
              <span className="rounded bg-yellow-300 px-2 py-0.5 text-xs font-semibold">
                Captain
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>{player.position === "GK" ? "Goalkeeper" : "Outfield"}</span>
            <span className="font-mono">R{player.price.toFixed(1)}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Gameweek points: {player.gameweekPoints ?? 0}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => onSetCaptain(slot.id)}
          disabled={!canSetCaptain}
          className={
            "w-full rounded border-2 px-3 py-1.5 text-xs font-bold transition-colors " +
            (slot.isCaptain
              ? "border-yellow-500 bg-yellow-50 text-yellow-800"
              : "border-gray-600 bg-white text-gray-700 hover:bg-gray-50") +
            (!canSetCaptain
              ? " cursor-not-allowed opacity-50"
              : "")
          }
        >
          {slot.isCaptain ? "Captain" : "Set Captain"}
        </button>
      </div>
    </div>
  );
}
