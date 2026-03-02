export interface BreathingPhase {
  name: 'Inhale' | 'Hold' | 'Exhale';
  duration: number; // seconds
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description:
      'A powerful stress-relief technique used by Navy SEALs. Equal duration inhale, hold, exhale, hold creates a calming "box" rhythm.',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold', duration: 4 },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Relaxing',
    description:
      'Developed by Dr. Andrew Weil, this pattern acts as a natural tranquilizer for the nervous system. Ideal before sleep.',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Exhale', duration: 8 },
    ],
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description:
      'Breathing at 5.5 seconds per cycle synchronizes heart rate variability and promotes a state of calm alertness.',
    phases: [
      { name: 'Inhale', duration: 5.5 },
      { name: 'Exhale', duration: 5.5 },
    ],
  },
];
