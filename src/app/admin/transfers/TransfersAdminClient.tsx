"use client";

import { useState } from "react";
import { Switch } from "@/app/_components/Switch";

export default function TransfersAdminClient({
  initialTransfersOpen,
}: {
  initialTransfersOpen: boolean;
}) {
  const [transfersOpen, setTransfersOpen] = useState(initialTransfersOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/transfers/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ open: checked }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update transfers setting");
      }

      setTransfersOpen(checked);
      setMessage(
        checked
          ? "Transfers are now open."
          : "Transfers are now closed."
      );
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update transfers setting"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Admin: Transfer Settings</h1>

      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Transfers Status</h2>
            <p className="text-sm text-gray-600">
              {transfersOpen
                ? "Transfers are currently open. Users can make transfers."
                : "Transfers are currently closed. Users cannot make transfers."}
            </p>
          </div>
          <Switch
            checked={transfersOpen}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {message && (
          <div
            className={`rounded border px-4 py-2 text-sm ${
              message.includes("Failed")
                ? "border-red-400 bg-red-50 text-red-800"
                : "border-green-400 bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {isLoading && (
          <div className="text-sm text-gray-600">Updating...</div>
        )}
      </div>
    </div>
  );
}

