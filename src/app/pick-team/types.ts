export type PickTeamPlayer = {
  id: string;
  name: string;
  position: "GK" | "OUT";
  price: number;
  totalPoints?: number;
};

export type PickTeamSlot = {
  id: string;
  slotLabel: string;
  isCaptain: boolean;
  player?: PickTeamPlayer;
};
