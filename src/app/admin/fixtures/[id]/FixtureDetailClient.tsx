"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateFixtureScoreAction } from "../actions";
import { runGameweekScoringAction } from "@/app/admin/gameweeks/[id]/actions";
import type { ActionState } from "../actions";

type Gameweek = {
  id: number;
  number: number;
  name: string | null;
  isFinished: boolean;
} | null;

type Player = {
  id: string;
  name: string;
  teamName: string;
  position: string;
};

type ScoreEvent = {
  id: string;
  type: string;
  minute: number | null;
  player: {
    id: string;
    name: string;
  };
};

type Fixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date | string;
  gameweekId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  events: ScoreEvent[];
};

export default function FixtureDetailClient({
  fixture,
  homePlayers,
  awayPlayers,
  gameweek,
}: {
  fixture: Fixture;
  homePlayers: Player[];
  awayPlayers: Player[];
  gameweek: Gameweek;
}) {
  const [homeGoals, setHomeGoals] = useState(
    fixture.homeGoals?.toString() ?? ""
  );
  const [awayGoals, setAwayGoals] = useState(
    fixture.awayGoals?.toString() ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(d)
      .replace(",", "");
  };

  const handleUpdateScore = async () => {
    startTransition(async () => {
      const home = homeGoals === "" ? null : Number(homeGoals);
      const away = awayGoals === "" ? null : Number(awayGoals);

      if (home !== null && (isNaN(home) || home < 0)) {
        setMessage("Home goals must be a non-negative number");
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      if (away !== null && (isNaN(away) || away < 0)) {
        setMessage("Away goals must be a non-negative number");
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const result = await updateFixtureScoreAction(fixture.id, home, away);
      if (result.ok) {
        setMessage("Score updated successfully!");
        window.location.reload();
      } else {
        setMessage(result.message || "Failed to update score");
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleRunScoring = async () => {
    if (!gameweek) return;

    setIsScoring(true);
    setMessage(null);

    try {
      const result = await runGameweekScoringAction(gameweek.id);
      if (result.ok) {
        setMessage("Scoring completed successfully!");
      } else {
        setMessage(result.message || "Failed to run scoring");
      }
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage("An error occurred while running scoring");
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsScoring(false);
    }
  };

  const eventTypeLabels: Record<string, string> = {
    GOAL: "Goal",
    ASSIST: "Assist",
    YC: "Yellow Card",
    RC: "Red Card",
    OG: "Own Goal",
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/fixtures"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Back to Fixtures
        </Link>
        <h1 className="text-2xl font-bold">Fixture Details</h1>
      </div>

      {message && (
        <div
          className={`rounded border px-4 py-2 text-sm mb-4 ${
            message.includes("Failed") || message.includes("error")
              ? "border-red-400 bg-red-50 text-red-800"
              : "border-green-400 bg-green-50 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-xl border p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Match Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Gameweek:</span>{" "}
              {gameweek?.name || `Gameweek ${gameweek?.number || fixture.gameweekId}`}
            </div>
            <div>
              <span className="font-medium">Kickoff:</span> {formatDate(fixture.kickoffAt)}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Final Score</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {fixture.homeTeam} (Home)
              </label>
              <input
                type="number"
                min="0"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                placeholder="Goals"
                className="w-full rounded border px-3 py-2"
                disabled={isPending}
              />
            </div>
            <span className="text-2xl font-bold pt-6">-</span>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {fixture.awayTeam} (Away)
              </label>
              <input
                type="number"
                min="0"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                placeholder="Goals"
                className="w-full rounded border px-3 py-2"
                disabled={isPending}
              />
            </div>
            <div className="pt-6">
              <button
                onClick={handleUpdateScore}
                disabled={isPending}
                className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Update Score"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Score Events</h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/fixtures/${fixture.id}/events`}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Manage Events
            </Link>
            {gameweek && !gameweek.isFinished && (
              <button
                onClick={handleRunScoring}
                disabled={isScoring}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isScoring ? "Running..." : "Run Scoring"}
              </button>
            )}
          </div>
        </div>

        {fixture.events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events recorded</p>
        ) : (
          <div className="space-y-2">
            {fixture.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <span className="font-medium">{event.player.name}</span>
                  <span className="text-gray-600 ml-2">
                    - {eventTypeLabels[event.type] || event.type}
                  </span>
                  {event.minute !== null && (
                    <span className="text-gray-500 ml-2">({event.minute}')</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

