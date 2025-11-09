export type PickTeamPlayer = {
  id: string;
  name: string;
  position: "GK" | "OUT";
  price: number;
  totalPoints?: number;
};

export type PickTeamSlot = {
  slotLabel: string;
  player?: PickTeamPlayer;
};
