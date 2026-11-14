import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Vehicle } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateHealthScore(v: Vehicle) {
  let score = 100;
  
  // Fuel impact
  if (v.fuelLevel < 10) score -= 30;
  else if (v.fuelLevel < 20) score -= 15;
  
  // Temperature impact
  const temp = v.temperature || 0;
  if (temp > 105) score -= 30;
  else if (temp > 95) score -= 15;
  
  // Status impact
  if (v.status === 'Maintenance') score -= 40;
  else if (v.status === 'Idle') score -= 10;
  
  // Speed impact (overspeeding)
  const speed = v.speed || 0;
  if (v.type === 'Plane') {
    if (speed > 900) score -= 15;
  } else {
    if (speed > 110) score -= 15;
  }
  
  return Math.max(0, score);
}
