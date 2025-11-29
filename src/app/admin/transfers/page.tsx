import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import TransfersAdminClient from "./TransfersAdminClient";

export default async function AdminTransfersPage() {
  // Check if user is admin
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const globalSettings = await prisma.globalSettings.findUnique({
    where: { id: 1 },
  });

  const transfersOpen = globalSettings?.transfersOpen ?? true;

  return <TransfersAdminClient initialTransfersOpen={transfersOpen} />;
}

