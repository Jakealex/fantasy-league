import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import FixturesAdminClient from "./FixturesAdminClient";
import { getFixturesWithRelations } from "@/lib/fixtures";

export default async function AdminFixturesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const fixtures = await getFixturesWithRelations();
  const gameweeks = await prisma.gameweek.findMany({
    orderBy: { number: "desc" },
  });
  const teamNames = await prisma.player.findMany({
    select: { teamName: true },
    distinct: ["teamName"],
    orderBy: { teamName: "asc" },
  });

  return (
    <FixturesAdminClient
      initialFixtures={fixtures}
      gameweeks={gameweeks}
      teamNames={teamNames.map((t) => t.teamName)}
    />
  );
}

