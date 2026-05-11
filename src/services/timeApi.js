const BASE_URL = 'https://time.now/developer/api';

export async function fetchCurrentTimeByIp() {
  const response = await fetch(`${BASE_URL}/ip`);
  if (!response.ok) {
    throw new Error(`Time API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTimeByTimezone(timeZone) {
  const response = await fetch(`${BASE_URL}/timezone/${encodeURIComponent(timeZone)}`);
  if (!response.ok) {
    throw new Error(`Time API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTimezones() {
  const response = await fetch(`${BASE_URL}/timezone`);
  if (!response.ok) {
    throw new Error(`Time API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
