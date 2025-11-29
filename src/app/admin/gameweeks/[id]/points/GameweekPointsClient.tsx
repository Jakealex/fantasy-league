"use client";

import { useState, useTransition } from "react";
import { savePlayerPointsAction } from "./actions";
import { runScoringAction } from "../actions";
import Link from "next/link";

type PlayerStats = {
  playerId: string;
  points: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  goalsConceded: number;
};

type GameweekPointsClientProps = {
  gameweek: { id: number; number: number; name?: string | null };
  players: Array<{
    id: string;
    name: string;
    teamName: string;
    position: string;
    points: number;
    goals: number;
    assists: number;
    ownGoals: number;
    yellowCards: number;
    redCards: number;
    goalsConceded: number;
  }>;
  isFinished: boolean;
};

export default function GameweekPointsClient({
  gameweek,
  players,
  isFinished,
}: GameweekPointsClientProps) {
  const [statsState, setStatsState] = useState<PlayerStats[]>(
    players.map((p) => ({
      playerId: p.id,
      points: p.points,
      goals: p.goals,
      assists: p.assists,
      ownGoals: p.ownGoals,
      yellowCards: p.yellowCards,
      redCards: p.redCards,
      goalsConceded: p.goalsConceded,
    }))
  );
  const [isSaving, startSaving] = useTransition();
  const [isScoring, startScoring] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Calculate individual player points (without captain doubling)
  const calculatePlayerPoints = (
    stats: Omit<PlayerStats, "playerId" | "points">,
    position: string
  ): number => {
    let pts = 0;

    // Base scoring
    pts += stats.goals * 5;
    pts += stats.assists * 3;
    pts += stats.ownGoals * -2;

    // Cards
    if (stats.redCards > 0) {
      pts += -3;
    } else {
      pts += stats.yellowCards * -1;
    }

    // Goalkeeper rule
    if (position === "GK") {
      pts += 7 - stats.goalsConceded;
    }

    // Outfield rule
    if (position === "OUT") {
      if (stats.goalsConceded <= 3) {
        pts += 1;
      }
    }

    return pts;
  };

  const handleStatChange = (
    playerId: string,
    field: keyof Omit<PlayerStats, "playerId">,
    value: number
  ) => {
    setStatsState((prev) => {
      return prev.map((p) => {
        if (p.playerId !== playerId) return p;

        const updated = { ...p, [field]: value };

        // Auto-calculate points if any stat changed (except points field itself)
        if (field !== "points") {
          const player = players.find((pl) => pl.id === playerId);
          if (player) {
            updated.points = calculatePlayerPoints(
              {
                goals: updated.goals,
                assists: updated.assists,
                ownGoals: updated.ownGoals,
                yellowCards: updated.yellowCards,
                redCards: updated.redCards,
                goalsConceded: updated.goalsConceded,
              },
              player.position
            );
          }
        }

        return updated;
      });
    });
    setMessage(null);
  };

  const handleSubmit = async (formData: FormData) => {
    startSaving(async () => {
      try {
        await savePlayerPointsAction(formData);
        setMessage("Stats saved successfully!");
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to save stats"
        );
      }
    });
  };

  const handleRunScoring = async () => {
    startScoring(async () => {
      try {
        await runScoringAction(gameweek.id);
        setMessage("Scoring completed successfully!");
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to run scoring"
        );
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/gameweeks"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Back to Gameweeks
        </Link>
        <h1 className="text-2xl font-bold">
          {gameweek.name || `Gameweek ${gameweek.number}`} – Player Points
        </h1>
      </div>

      {isFinished && (
        <div className="rounded-xl border border-yellow-400 bg-yellow-50 text-yellow-800 p-4 mb-6">
          <p className="font-semibold">
            This gameweek is finished. Points are read-only.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded border px-4 py-2 text-sm mb-4 ${
            message.includes("Failed") || message.includes("Error")
              ? "border-red-400 bg-red-50 text-red-800"
              : "border-green-400 bg-green-50 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <button
          onClick={handleRunScoring}
          disabled={isScoring || isFinished}
          className="rounded bg-blue-600 text-white px-6 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScoring ? "Running Scoring..." : "Run Scoring"}
        </button>
        <p className="text-sm text-gray-600 flex items-center">
          Calculate team scores based on player stats and captain selections
        </p>
      </div>

      <form action={handleSubmit}>
        <input type="hidden" name="gameweekId" value={gameweek.id} />
        <input
          type="hidden"
          name="statsJson"
          value={JSON.stringify(statsState)}
        />

        <div className="rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Player Stats & Points</h2>
            <button
              type="submit"
              disabled={isFinished || isSaving}
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save All"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-semibold sticky left-0 bg-gray-50">
                    Player
                  </th>
                  <th className="text-left p-2 font-semibold">Team</th>
                  <th className="text-left p-2 font-semibold">Pos</th>
                  <th className="text-right p-2 font-semibold">Goals</th>
                  <th className="text-right p-2 font-semibold">Assists</th>
                  <th className="text-right p-2 font-semibold">Own Goals</th>
                  <th className="text-right p-2 font-semibold">Yellow</th>
                  <th className="text-right p-2 font-semibold">Red</th>
                  <th className="text-right p-2 font-semibold">Conceded</th>
                  <th className="text-right p-2 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const statsEntry = statsState.find(
                    (s) => s.playerId === player.id
                  );
                  const stats = statsEntry || {
                    playerId: player.id,
                    points: 0,
                    goals: 0,
                    assists: 0,
                    ownGoals: 0,
                    yellowCards: 0,
                    redCards: 0,
                    goalsConceded: 0,
                  };

                  return (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sticky left-0 bg-white font-medium">
                        {player.name}
                      </td>
                      <td className="p-2 text-gray-600">{player.teamName}</td>
                      <td className="p-2 text-gray-600">{player.position}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.goals}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "goals",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.assists}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "assists",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.ownGoals}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "ownGoals",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.yellowCards}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "yellowCards",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.redCards}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "redCards",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.goalsConceded}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "goalsConceded",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          className="w-16 rounded border px-2 py-1 text-right disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={stats.points}
                          onChange={(e) =>
                            handleStatChange(
                              player.id,
                              "points",
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isFinished || isSaving}
                          title="Auto-calculated from stats (captain doubling applied during team scoring)"
                          className="w-20 rounded border px-2 py-1 text-right font-medium bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {players.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No players found. Add players to the database first.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

