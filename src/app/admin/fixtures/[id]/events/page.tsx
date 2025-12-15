import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getFixtureWithRelations } from "@/lib/fixtures";
import { getPlayersForFixture } from "@/lib/fixtures";
import FixtureEventsClient from "./FixtureEventsClient";
import { notFound } from "next/navigation";

export default async function FixtureEventsPage({
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

  return (
    <FixtureEventsClient
      fixture={fixture}
      homePlayers={homePlayers}
      awayPlayers={awayPlayers}
    />
  );
}


