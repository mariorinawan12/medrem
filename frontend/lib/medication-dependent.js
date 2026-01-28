import { apiFetch } from './api';

// Fetch medications for a specific dependent
export async function getMedicationsForDependent(userId) {
  return apiFetch('/medications/list-dependent', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Delete medication for a dependent
export async function deleteMedicationForDependent(userId, medicationId) {
  return apiFetch('/medications/delete-dependent', {
    method: 'POST',
    body: JSON.stringify({ userId, medicationId }),
  });
}

// Create medication for a dependent
export async function createMedicationForDependent(medication) {
  return apiFetch('/medications/create-dependent', {
    method: 'POST',
    body: JSON.stringify(medication),
  });
}

// Fetch medication schedule for a specific dependent
export async function getMedicationScheduleForDependent(userId) {
  return apiFetch('/medications/schedule-dependent', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Set medication as taken for a dependent (assumes medicationTimeId is the ID of the scheduled medication)
export async function setMedicationAsTakenForDependent(medicationTimeId) {
  return apiFetch('/medications/set-taken-dependent', {
    method: 'POST',
    body: JSON.stringify({ medicationTimeId }),
  });
}

export async function getMedicationForDependentWithSchedule(userId,medicationId) {
  return apiFetch('/medications/get-medication-with-reminder-dependent', {
    method: 'POST',
    body: JSON.stringify({ userId, medicationId }),
  });
}

export async function updateMedicationForDependent(medication) {
  return apiFetch('/medications/update-dependent', {
    method: 'POST',
    body: JSON.stringify(medication),
  });
}

export async function getActiveDatesDependent(userId){

  return apiFetch('/medications/get-all-dates-dependent',{
    method: 'POST',
    body: JSON.stringify({userId}),
  })
}

export async function getMedicationsForDateDependent(date, userId){
  return apiFetch('/medications/get-schedule-for-date-dependent', {
    method: 'POST',
    body: JSON.stringify({ date, userId }),
  })
}

export async function getMedicationHistoryForDependent(userId, startDate, endDate) {
  return apiFetch('/medications/get-medication-history-dependent', {
    method: 'POST',
    body: JSON.stringify({ userId, startDate, endDate }),
  });
}




