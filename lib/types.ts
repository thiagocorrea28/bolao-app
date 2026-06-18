export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "user" | "super_admin";
  created_at: string;
};

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  bid_closes_at: string;
  status: "open" | "locked" | "finished";
  is_premium: boolean;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
  is_exact_score: boolean;
  created_at: string;
  updated_at: string;
};

export type LeaderboardRow = {
  user_id: string;
  name: string;
  total_points: number;
  exact_scores: number;
  predictions_count: number;
};

export type PremiumEntry = {
  id: string;
  user_id: string;
  accepted_at: string;
};

export type PremiumPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  stake_amount: number;
  status: "active" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type PremiumBalance = {
  user_id: string;
  name: string;
  balance: number;
};

export type PremiumLedgerEntry = {
  id: string;
  user_id: string;
  match_id: string;
  type: "stake" | "payout" | "refund" | "accumulated";
  amount: number;
  description: string;
  created_at: string;
};

export type PremiumMatchSummary = {
  match_id: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  bid_closes_at: string;
  status: "open" | "locked" | "finished";
  home_score: number | null;
  away_score: number | null;
  predictions_count: number;
  pot_amount: number;
  winners_count: number;
  is_refunded: boolean;
  payout_per_winner: number;
  accumulated_pot: number;
  has_accumulated_pot: boolean;
};
