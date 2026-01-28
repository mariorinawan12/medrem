// src/types/medication.ts
export interface Medication {
    medicationTimeId: string;
    name: string;
    reminderTime: string;
    medicationStatus: 'taken' | 'not-taken' | 'late';
  }
  