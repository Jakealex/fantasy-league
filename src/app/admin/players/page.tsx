import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
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

  return <PlayersAdminClient initialPlayers={players} />;
}

