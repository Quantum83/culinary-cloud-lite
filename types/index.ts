export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  source_url: string;
  source_domain: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  recipe_yield: string | null;
  description: string | null;
  video_url: string | null;
  video_id: string | null;
};

export type Collection = {
  id: string;
  name: string;
  recipe_ids: string[];
};

export type WeekData = Record<string, string[]>;

export type Toast = {
  message: string;
  id: number;
};

export type AuthUser = {
  email: string | null;
  isAnonymous: boolean;
};
