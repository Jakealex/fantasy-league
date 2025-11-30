export type PickTeamPlayer = {
  id: string;
  name: string;
  position: "GK" | "OUT";
  price: number;
  gameweekPoints?: number; // Points for current gameweek
};

export type PickTeamSlot = {
  id: string;
  slotLabel: string;
  isCaptain: boolean;
  player?: PickTeamPlayer;
};
