export interface User {
  id: number;
  email: string;
  name: string;
  is_premium: boolean;
  role: 'user' | 'admin';
  points: number;
  streak: number;
  level: string;
  theme: 'dark' | 'light';
  language: 'pt' | 'en';
}

export interface Profile {
  age: number;
  height: number;
  weight: number;
  fat_percentage: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  personality_mode: 'motivational' | 'raiz';
  training_time: string;
  routine: string;
  sleep: string;
  current_diet: string;
  financial_condition: string;
  objective: string;
  training_level?: 'beginner' | 'intermediate' | 'advanced';
  wants_supplements?: boolean;
  rest_days?: string; // JSON string of array of days
  points?: number;
  streak?: number;
  level?: string;
}

export interface ShapeAnalysis {
  id: number;
  user_id: number;
  image_data: string;
  analysis: string;
  fat_percentage: number;
  timestamp: string;
}

export interface Plans {
  training_plan: string | null;
  nutrition_plan: string | null;
  last_analysis: string | null;
  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fat?: number | null;
  training_schedule?: string | null; // JSON string of weekly schedule
  nutrition_schedule?: string | null; // JSON string of meals
}
