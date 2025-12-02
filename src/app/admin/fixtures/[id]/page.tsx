import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getFixtureWithRelations } from "@/lib/fixtures";
import { getPlayersForFixture } from "@/lib/fixtures";
import FixtureDetailClient from "./FixtureDetailClient";
import { notFound } from "next/navigation";

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const fixture = await getFixtureWithRelations(id);
  if (!fixture) {
    notFound();
  }

  const { homePlayers, awayPlayers } = await getPlayersForFixture(id);
  const gameweek = await prisma.gameweek.findUnique({
    where: { id: fixture.gameweekId },
  });

  return (
    <FixtureDetailClient
      fixture={fixture}
      homePlayers={homePlayers}
      awayPlayers={awayPlayers}
      gameweek={gameweek}
    />
  );
}

