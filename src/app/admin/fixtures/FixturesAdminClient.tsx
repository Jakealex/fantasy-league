"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createFixtureAction, deleteFixtureAction } from "./actions";

type Gameweek = {
  id: number;
  number: number;
  name: string | null;
};

type ScoreEvent = {
  id: string;
  type: string;
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
  gameweek: Gameweek;
  events: ScoreEvent[];
};

export default function FixturesAdminClient({
  initialFixtures,
  gameweeks,
  teamNames,
}: {
  initialFixtures: Fixture[];
  gameweeks: Gameweek[];
  teamNames: string[];
}) {
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createFixtureAction({ ok: true }, formData);
      if (result.ok) {
        setMessage("Fixture created successfully!");
        setShowCreateForm(false);
        // Refresh page to get updated fixtures
        window.location.reload();
      } else {
        setMessage(result.message || "Failed to create fixture");
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleDelete = async (fixtureId: string, fixtureLabel: string) => {
    if (!confirm(`Are you sure you want to delete "${fixtureLabel}"? This will delete all score events and recalculate points for the gameweek. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(fixtureId);
    startDeleteTransition(async () => {
      const result = await deleteFixtureAction(fixtureId);
      if (result.ok) {
        setMessage("Fixture deleted and points recalculated!");
        // Remove from local state
        setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));
        // Refresh page to get updated data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(result.message || "Failed to delete fixture");
      }
      setTimeout(() => setMessage(null), 3000);
      setDeletingId(null);
    });
  };

  // Group fixtures by gameweek
  const fixturesByGameweek = fixtures.reduce((acc, fixture) => {
    const gwId = fixture.gameweekId;
    if (!acc[gwId]) {
      acc[gwId] = [];
    }
    acc[gwId].push(fixture);
    return acc;
  }, {} as Record<number, Fixture[]>);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin: Fixtures Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900"
        >
          {showCreateForm ? "Cancel" : "Create Fixture"}
        </button>
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

      {showCreateForm && (
        <div className="rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Fixture</h2>
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Gameweek *
                </label>
                <select
                  name="gameweekId"
                  required
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">Select gameweek</option>
                  {gameweeks.map((gw) => (
                    <option key={gw.id} value={gw.id}>
                      {gw.name || `Gameweek ${gw.number}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kickoff Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="kickoffAt"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Home Team *
                </label>
                <select
                  name="homeTeam"
                  required
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">Select team</option>
                  {teamNames.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Away Team *
                </label>
                <select
                  name="awayTeam"
                  required
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">Select team</option>
                  {teamNames.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Fixture"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">All Fixtures</h2>
        {Object.keys(fixturesByGameweek).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No fixtures found</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(fixturesByGameweek)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([gameweekId, gameweekFixtures]) => {
                const gameweek = gameweeks.find((gw) => gw.id === Number(gameweekId));
                return (
                  <div key={gameweekId} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">
                      {gameweek?.name || `Gameweek ${gameweek?.number || gameweekId}`}
                    </h3>
                    <div className="space-y-2">
                      {gameweekFixtures.map((fixture) => (
                        <div
                          key={fixture.id}
                          className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{fixture.homeTeam}</span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-medium">{fixture.awayTeam}</span>
                              {fixture.homeGoals !== null &&
                                fixture.awayGoals !== null && (
                                  <span className="font-bold text-lg">
                                    {fixture.homeGoals} - {fixture.awayGoals}
                                  </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {fixture.kickoffAt && formatDate(fixture.kickoffAt)}
                              {fixture.events.length > 0 && (
                                <span className="ml-2">
                                  • {fixture.events.length} event
                                  {fixture.events.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/fixtures/${fixture.id}`}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleDelete(fixture.id, `${fixture.homeTeam} vs ${fixture.awayTeam}`)}
                              disabled={isDeleting && deletingId === fixture.id}
                              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeleting && deletingId === fixture.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

