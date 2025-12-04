import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { computeStats } from "@/lib/stats";
import PlayersAdminClient from "./PlayersAdminClient";

export default async function AdminPlayersPage() {
  // Require authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const players = await prisma.player.findMany({
    orderBy: [
      { teamName: "asc" },
      { position: "asc" },
      { name: "asc" },
    ],
  });

  // Calculate stats: count, sum, then average
  const totalPlayers = players.length;
  const totalPrice = players.reduce((sum, p) => {
    return sum + Number(p.price ?? 0);
  }, 0);
  const avgPrice = totalPlayers > 0 ? totalPrice / totalPlayers : 0;

  // Extract prices and calculate statistical measures
  const priceValues = players.map((p) => Number(p.price ?? 0));
  const { mean, stdev, q1, q3 } = computeStats(priceValues);

  return (
    <PlayersAdminClient
      initialPlayers={players}
      initialStats={{
        totalPlayers,
        totalPrice,
        avgPrice,
        stdev,
        q1,
        q3,
      }}
    />
  );
}

