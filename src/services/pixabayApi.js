const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

export async function searchCityImages(cityName) {
  if (!PIXABAY_API_KEY) {
    throw new Error('Pixabay API key not configured');
  }

  const response = await fetch(
    `${PIXABAY_BASE_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(cityName)}&image_type=photo&per_page=8&safesearch=true`
  );

  if (!response.ok) {
    throw new Error(`Pixabay API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const hits = data.hits || [];

  const evenCount = hits.length % 2 === 0 ? hits.length : hits.length - 1;
  return hits.slice(0, evenCount);
}
