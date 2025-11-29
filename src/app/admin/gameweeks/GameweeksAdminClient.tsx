"use client";

import { useState } from "react";
import { Switch } from "@/app/_components/Switch";

type Gameweek = {
  id: number;
  number: number;
  name: string | null;
  startsAt: Date;
  deadlineAt: Date;
  isCurrent: boolean;
  isFinished: boolean;
};

export default function GameweeksAdminClient({
  initialGameweeks,
}: {
  initialGameweeks: Gameweek[];
}) {
  const [gameweeks, setGameweeks] = useState(initialGameweeks);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const formatDateForInput = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleUpdateDeadline = async (id: number, deadlineAt: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/gameweeks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deadlineAt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update deadline");
      }

      setGameweeks((prev) =>
        prev.map((gw) =>
          gw.id === id ? { ...gw, deadlineAt: new Date(deadlineAt) } : gw
        )
      );
      setEditingId(null);
      setMessage("Deadline updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update deadline"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCurrent = async (id: number, isCurrent: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/gameweeks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isCurrent: !isCurrent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update gameweek");
      }

      // If setting to current, unset all others
      if (!isCurrent) {
        setGameweeks((prev) =>
          prev.map((gw) => ({
            ...gw,
            isCurrent: gw.id === id,
          }))
        );
      } else {
        setGameweeks((prev) =>
          prev.map((gw) => (gw.id === id ? { ...gw, isCurrent: false } : gw))
        );
      }

      setMessage("Gameweek updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update gameweek"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFinished = async (id: number, isFinished: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/gameweeks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFinished: !isFinished }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update gameweek");
      }

      setGameweeks((prev) =>
        prev.map((gw) =>
          gw.id === id ? { ...gw, isFinished: !isFinished } : gw
        )
      );

      setMessage("Gameweek updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update gameweek"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const number = parseInt(formData.get("number") as string);
    const name = formData.get("name") as string;
    const startsAt = formData.get("startsAt") as string;
    const deadlineAt = formData.get("deadlineAt") as string;

    try {
      const response = await fetch("/api/admin/gameweeks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
          name,
          startsAt,
          deadlineAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create gameweek");
      }

      setGameweeks((prev) => [data.gameweek, ...prev].sort((a, b) => b.number - a.number));
      setShowCreateForm(false);
      setMessage("Gameweek created successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create gameweek"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currentGameweek = gameweeks.find((gw) => gw.isCurrent);
  const now = new Date();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin: Gameweek Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900"
        >
          {showCreateForm ? "Cancel" : "Create New Gameweek"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded border px-4 py-2 text-sm mb-4 ${
            message.includes("Failed")
              ? "border-red-400 bg-red-50 text-red-800"
              : "border-green-400 bg-green-50 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Gameweek</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Gameweek Number
                </label>
                <input
                  type="number"
                  name="number"
                  required
                  className="w-full rounded border px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Gameweek 1"
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  name="startsAt"
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deadline At
                </label>
                <input
                  type="datetime-local"
                  name="deadlineAt"
                  required
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Gameweek"}
            </button>
          </form>
        </div>
      )}

      {currentGameweek && (
        <div className="rounded-xl border border-blue-400 bg-blue-50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-blue-900">
                Current Gameweek: {currentGameweek.name || `Gameweek ${currentGameweek.number}`}
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                Deadline: {formatDate(currentGameweek.deadlineAt)}
                {now > currentGameweek.deadlineAt && (
                  <span className="ml-2 text-red-600 font-semibold">
                    (PASSED - Transfers Locked)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">All Gameweeks</h2>
        <div className="space-y-4">
          {gameweeks.map((gw) => {
            const deadlinePassed = now > new Date(gw.deadlineAt);
            return (
              <div
                key={gw.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {gw.name || `Gameweek ${gw.number}`}
                      </h3>
                      {gw.isCurrent && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          CURRENT
                        </span>
                      )}
                      {gw.isFinished && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          FINISHED
                        </span>
                      )}
                      {deadlinePassed && !gw.isFinished && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          DEADLINE PASSED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div>
                        Starts: {formatDate(gw.startsAt)}
                      </div>
                      <div>
                        Deadline: {formatDate(gw.deadlineAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Set as Current:</label>
                    <Switch
                      checked={gw.isCurrent}
                      onCheckedChange={() => handleToggleCurrent(gw.id, gw.isCurrent)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Mark as Finished:</label>
                    <Switch
                      checked={gw.isFinished}
                      onCheckedChange={() => handleToggleFinished(gw.id, gw.isFinished)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium">Deadline:</label>
                    {editingId === gw.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const deadline = formData.get("deadline") as string;
                          handleUpdateDeadline(gw.id, deadline);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="datetime-local"
                          name="deadline"
                          defaultValue={formatDateForInput(gw.deadlineAt)}
                          className="rounded border px-2 py-1 text-sm"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-900 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700">
                          {formatDate(gw.deadlineAt)}
                        </span>
                        <button
                          onClick={() => setEditingId(gw.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

