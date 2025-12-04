"use client";

import { useState, useTransition, useMemo } from "react";
import { updatePlayerPriceAction, createPlayerAction, updatePlayerAction, deletePlayerAction } from "./actions";
import { useRouter } from "next/navigation";
import { computeStats } from "@/lib/stats";

type Player = {
  id: string;
  name: string;
  teamName: string;
  position: string;
  price: number;
  status: string;
};

export default function PlayersAdminClient({
  initialPlayers,
  initialStats,
}: {
  initialPlayers: Player[];
  initialStats: {
    totalPlayers: number;
    totalPrice: number;
    avgPrice: number;
    stdev: number;
    median: number;
    q1: number;
    q3: number;
  };
}) {
  const router = useRouter();
  const [players, setPlayers] = useState(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"price" | "name" | "team" | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editTeam, setEditTeam] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    teamName: "",
    position: "OUT" as "GK" | "OUT",
    price: "",
    status: "A" as "A" | "I",
  });

  // Get unique team names for filter
  const teamNames = Array.from(
    new Set(players.map((p) => p.teamName))
  ).sort();

  // Calculate stats: count, sum, average, stdev, q1, q3 (recalculated when players change)
  const stats = useMemo(() => {
    const count = players.length;
    const sum = players.reduce((s, p) => {
      return s + Number(p.price ?? 0);
    }, 0);
    const avg = count > 0 ? sum / count : 0;

    // Extract prices and calculate statistical measures
    const priceValues = players.map((p) => Number(p.price ?? 0));
    const { mean, stdev, median, q1, q3 } = computeStats(priceValues);

    return { count, sum, avg, stdev, median, q1, q3 };
  }, [players]);

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === "" || player.teamName === filterTeam;
    return matchesSearch && matchesTeam;
  });

  const handleEditClick = (player: Player, field: "price" | "name" | "team") => {
    setEditingId(player.id);
    setEditingField(field);
    if (field === "price") {
      setEditPrice(player.price);
    } else if (field === "name") {
      setEditName(player.name);
    } else if (field === "team") {
      setEditTeam(player.teamName);
    }
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditPrice(0);
    setEditName("");
    setEditTeam("");
    setMessage(null);
  };

  const handleSavePrice = (playerId: string) => {
    startTransition(async () => {
      try {
        const result = await updatePlayerPriceAction(playerId, editPrice);
        if (result.ok) {
          // Update local state
          setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, price: editPrice } : p))
          );
          setEditingId(null);
          setEditingField(null);
          setMessage("Price updated successfully!");
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage(result.message || "Failed to update price");
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (error) {
        setMessage("An error occurred");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleSaveNameAndTeam = (playerId: string) => {
    startTransition(async () => {
      try {
        const result = await updatePlayerAction(playerId, editName, editTeam);
        if (result.ok) {
          // Update local state
          setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, name: editName, teamName: editTeam } : p))
          );
          setEditingId(null);
          setEditingField(null);
          setMessage("Player updated successfully!");
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage(result.message || "Failed to update player");
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (error) {
        setMessage("An error occurred");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete "${playerName}"? This will also delete all their points, events, and remove them from all squads. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(playerId);
    startDeleteTransition(async () => {
      try {
        const result = await deletePlayerAction(playerId);
        if (result.ok) {
          // Remove from local state
          setPlayers((prev) => prev.filter((p) => p.id !== playerId));
          setMessage("Player deleted successfully!");
          setTimeout(() => setMessage(null), 3000);
          // Refresh to get updated data
          router.refresh();
        } else {
          setMessage(result.message || "Failed to delete player");
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (error) {
        setMessage("An error occurred");
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleCreatePlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startCreateTransition(async () => {
      try {
        const formDataObj = new FormData(e.currentTarget);
        const result = await createPlayerAction(formDataObj);
        if (result.ok) {
          setMessage("Player created successfully!");
          // Reset form
          setFormData({
            name: "",
            teamName: "",
            position: "OUT",
            price: "",
            status: "A",
          });
          // Refresh the page to get updated player list
          router.refresh();
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage(result.message || "Failed to create player");
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (error) {
        setMessage("An error occurred");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Manage Players</h1>
        <p className="text-sm text-gray-600">
          Add new players and edit player prices. Changes take effect immediately.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats Summary */}
      <section className="border rounded-xl p-4 bg-gray-50 mb-6 text-sm flex flex-col gap-2">
        <div>
          <span className="font-semibold">Total players:</span> {stats.count}
        </div>
        <div>
          <span className="font-semibold">Sum of prices:</span> {stats.sum.toFixed(1)}
        </div>
        <div>
          <span className="font-semibold">Average price:</span> {stats.avg.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Median:</span> {stats.median.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Standard deviation:</span> {stats.stdev.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Q1 (25th percentile):</span> {stats.q1.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Q3 (75th percentile):</span> {stats.q3.toFixed(2)}
        </div>
      </section>

      {/* Add Player Form */}
      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Add New Player</h2>
        <form onSubmit={handleCreatePlayer} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Player name"
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Team name"
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Position *
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value as "GK" | "OUT" })
              }
              required
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isCreating}
            >
              <option value="GK">GK</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              max="100"
              step="0.1"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="0.0"
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "A" | "I" })
              }
              required
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isCreating}
            >
              <option value="A">A (Active)</option>
              <option value="I">I (Injured)</option>
            </select>
          </div>
          <div className="md:col-span-5">
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Player"}
            </button>
          </div>
        </form>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Teams</option>
          {teamNames.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {/* Players Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-left">Position</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No players found
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => (
                <tr key={player.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {editingId === player.id && editingField === "name" ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        disabled={isPending}
                      />
                    ) : (
                      <span className="font-medium">{player.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === player.id && editingField === "team" ? (
                      <input
                        type="text"
                        value={editTeam}
                        onChange={(e) => setEditTeam(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        disabled={isPending}
                      />
                    ) : (
                      <span>{player.teamName}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2">{player.status}</td>
                  <td className="px-4 py-2">
                    {editingId === player.id && editingField === "price" ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editPrice}
                        onChange={(e) =>
                          setEditPrice(parseFloat(e.target.value) || 0)
                        }
                        className="w-20 border rounded px-2 py-1"
                        disabled={isPending}
                      />
                    ) : (
                      <span className="font-semibold">R{player.price.toFixed(1)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === player.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (editingField === "price") {
                              handleSavePrice(player.id);
                            } else if (editingField === "name" || editingField === "team") {
                              handleSaveNameAndTeam(player.id);
                            }
                          }}
                          disabled={isPending}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleEditClick(player, "name")}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          title="Edit name"
                        >
                          Edit Name
                        </button>
                        <button
                          onClick={() => handleEditClick(player, "team")}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          title="Edit team"
                        >
                          Edit Team
                        </button>
                        <button
                          onClick={() => handleEditClick(player, "price")}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          title="Edit price"
                        >
                          Edit Price
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id, player.name)}
                          disabled={isDeleting && deletingId === player.id}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                          title="Delete player"
                        >
                          {isDeleting && deletingId === player.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing {filteredPlayers.length} of {players.length} players
      </div>
    </div>
  );
}

