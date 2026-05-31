import { Profile } from '../types';

export const calculateBMR = (profile: Profile) => {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) return 0;
  
  let bmr = 0;
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  return Math.round(bmr * (multipliers[profile.activity_level] || 1.55));
};

export const getMacros = (tdee: number, objective: string, weight: number) => {
  // Simple macro split based on objective
  let protein = weight * 2;
  let fat = weight * 0.8;
  let calories = tdee;

  if (objective === 'Cutting' || objective === 'Definição Extrema') {
    calories = tdee - 500;
    protein = weight * 2.2;
  } else if (objective === 'Bulking' || objective === 'Bulking Limpo') {
    calories = tdee + 500;
  }

  const carbCalories = calories - (protein * 4) - (fat * 9);
  const carbs = Math.max(carbCalories / 4, 0);

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
};
