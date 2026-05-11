// src/services/timeApi.js

// Отримати час за IP
export async function fetchCurrentTimeByIp() {
  const response = await fetch('/api/time/time/current/ip');
  if (!response.ok) throw new Error(`TimeAPI.io failed: ${response.status}`);
  return response.json();
}

// Отримати час за конкретною таймзоною
export async function fetchTimeByTimezone(timeZone) {
  const response = await fetch(`/api/time/timezone/zone?timeZone=${encodeURIComponent(timeZone)}`);
  if (!response.ok) throw new Error(`TimeAPI.io failed: ${response.status}`);
  return response.json();
}

// Отримати список усіх таймзон
export async function fetchTimezones() {
  const response = await fetch('/api/time/timezone/availabletimezones');
  if (!response.ok) throw new Error(`TimeAPI.io failed: ${response.status}`);
  return response.json();
}
