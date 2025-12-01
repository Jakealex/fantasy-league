"use client";

import { useState, useTransition } from "react";
import { updatePlayerPriceAction } from "./actions";

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
}: {
  initialPlayers: Player[];
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("");

  // Get unique team names for filter
  const teamNames = Array.from(
    new Set(players.map((p) => p.teamName))
  ).sort();

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === "" || player.teamName === filterTeam;
    return matchesSearch && matchesTeam;
  });

  const handleEditClick = (player: Player) => {
    setEditingId(player.id);
    setEditPrice(player.price);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice(0);
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

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Manage Players</h1>
        <p className="text-sm text-gray-600">
          Edit player prices. Changes take effect immediately.
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
                  <td className="px-4 py-2 font-medium">{player.name}</td>
                  <td className="px-4 py-2">{player.teamName}</td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2">{player.status}</td>
                  <td className="px-4 py-2">
                    {editingId === player.id ? (
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
                          onClick={() => handleSavePrice(player.id)}
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
                      <button
                        onClick={() => handleEditClick(player)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit Price
                      </button>
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

