"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addScoreEventAction, deleteScoreEventAction } from "../actions";

type Player = {
  id: string;
  name: string;
  teamName: string;
  position: string;
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
  events: ScoreEvent[];
};

export default function FixtureEventsClient({
  fixture,
  homePlayers,
  awayPlayers,
}: {
  fixture: Fixture;
  homePlayers: Player[];
  awayPlayers: Player[];
}) {
  const [events, setEvents] = useState(fixture.events);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);


  const eventTypes = [
    { value: "GOAL", label: "Goal" },
    { value: "ASSIST", label: "Assist" },
    { value: "YC", label: "Yellow Card" },
    { value: "RC", label: "Red Card" },
    { value: "OG", label: "Own Goal" },
  ];

  const eventTypeLabels: Record<string, string> = {
    GOAL: "Goal",
    ASSIST: "Assist",
    YC: "Yellow Card",
    RC: "Red Card",
    OG: "Own Goal",
  };

  const handleAddEvent = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addScoreEventAction({ ok: true }, formData);
      if (result.ok) {
        setMessage("Event added successfully!");
        setShowAddForm(false);
        // Refresh to get updated events
        window.location.reload();
      } else {
        setMessage(result.message || "Failed to add event");
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteScoreEventAction(eventId);
      if (result.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setMessage("Event deleted successfully!");
      } else {
        setMessage(result.message || "Failed to delete event");
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/fixtures/${fixture.id}`}
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Back to Fixture
        </Link>
        <h1 className="text-2xl font-bold">Score Events</h1>
        <p className="text-sm text-gray-600 mt-1">
          {fixture.homeTeam} vs {fixture.awayTeam}
        </p>
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Events ({events.length})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900"
        >
          {showAddForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border p-6 mb-6">
          <h3 className="text-md font-semibold mb-4">Add New Event</h3>
          <form action={handleAddEvent} className="space-y-4">
            <input type="hidden" name="fixtureId" value={fixture.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Player *
                </label>
                <select
                  name="playerId"
                  required
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">Select player</option>
                  <optgroup label={fixture.homeTeam}>
                    {homePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={fixture.awayTeam}>
                    {awayPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Type *
                </label>
                <select
                  name="eventType"
                  required
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">Select type</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
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
              {isPending ? "Adding..." : "Add Event"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-xl border p-6">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events recorded</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{event.player.name}</span>
                  <span className="text-gray-600">
                    - {eventTypeLabels[event.type] || event.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  disabled={isPending}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

