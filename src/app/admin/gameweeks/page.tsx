import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import GameweeksAdminClient from "./GameweeksAdminClient";

export default async function AdminGameweeksPage() {
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

  const gameweeks = await prisma.gameweek.findMany({
    orderBy: { number: "desc" },
  });

  return <GameweeksAdminClient initialGameweeks={gameweeks} />;
}

