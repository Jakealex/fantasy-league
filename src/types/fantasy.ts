// src/types/fantasy.ts
export type Position = "GK" | "OUT";
export type Status = "A" | "I";

export type Team = {
  id: string;
  name: string;
  shortName?: string;
};

export type Player = {
  id: string;
  name: string;
  teamName: string;
  position: Position;
  price: number;
  status: Status;
  ownedPct: number;
  nextFixture?: string;
  totalPoints?: number;
  roundPoints?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
};

export type SquadSlot = {
  slotLabel: string;
  player?: { id: string; name: string };
};
