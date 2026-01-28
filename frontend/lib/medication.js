// lib/medication.js

import { apiFetch } from './api';
  
  export async function getMedicationSchedule() {
    return apiFetch('/medications/schedule', {
      method: 'POST',
    });
  }

  export async function getMedicationList() {
    return apiFetch('/medications/list', {
      method: 'POST',
    });
  }
  
  export async function setMedicationAsTaken(medicationTimeId){
    return apiFetch('/medications/set-taken', {
      method: 'POST',
      body: JSON.stringify({ medicationTimeId }),
    });
  }

  export async function createMedicationForSelf(medication) {
    return apiFetch('/medications/create', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
  }

  export async function deleteMedicationForSelf(medicationId) {
    return apiFetch('/medications/delete', {
      method: 'POST',
      body: JSON.stringify({ medicationId }),
    });
  }

  export async function getMedicationForSelfWithSchedule(medicationId) {
    return apiFetch('/medications/get-medication-with-reminder', {
      method: 'POST',
      body: JSON.stringify({ medicationId }),
    });
  }

  export async function updateMedicationForSelf(medication) {
    return apiFetch('/medications/update', {
      method: 'POST',
      body: JSON.stringify(medication), 
    })
  }

  export async function getActiveDates(){
    return apiFetch('/medications/get-all-dates',{
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  export async function getMedicationsForDate(date){
    return apiFetch('/medications/get-schedule-for-date', {
      method: 'POST',
      body: JSON.stringify({ date }),
    })
  }

  export async function getMedicationHistoryForSelf(startDate, endDate) {
    return apiFetch('/medications/get-medication-history', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  export async function updateMedicationNotificationId(medicationTimeId, mainNotificationId, followUpNotificationIds) {
    console.log('Updating medication notification ID:', {
      medicationTimeId,
      mainNotificationId,
      followUpNotificationIds,
    });
    return apiFetch('/medications/update-notification-id', {
      method: 'POST',
      body: JSON.stringify({ medicationTimeId, mainNotificationId, followUpNotificationIds }),
    });
  }

  export async function fetchNotificationSettings() {
    return apiFetch('/medications/notification-settings', {
      method: 'POST',
    });
  }

  export async function updateNotificationSettings(followUpIntervalMinutes, followUpCount) {
    return apiFetch('/medications/update-notification-settings', {
      method: 'POST',
      body: JSON.stringify({ followUpIntervalMinutes, followUpCount }),
    });
  }