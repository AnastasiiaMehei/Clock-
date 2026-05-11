<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Clock App</h1>
      <p>Real-time clock with timezone selection and city images</p>
    </header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="clock-section">
          <div class="clock-card">
            <div class="mode-selector">
              <button
                type="button"
                class="mode-button"
                :class="{ active: currentMode === 'time' }"
                @click="currentMode = 'time'"
              >
                Show Time
              </button>
              <button
                type="button"
                class="mode-button"
                :class="{ active: currentMode === 'timer' }"
                @click="currentMode = 'timer'"
              >
                Show Timer
              </button>
            </div>

            <AnalogClock
              :mode="currentMode"
              :timer-seconds="timerSeconds"
              :is-timer-active="timerActive"
              :time-data="timeData"
            />

            <div v-if="currentMode === 'time'" class="time-details">
              <p>Current Time: <strong>{{ displayTime }}</strong></p>
              <p>Timezone: <strong>{{ timeData?.timezone || 'UTC' }}</strong></p>
            </div>

            <div v-if="currentMode === 'timer'" class="timer-controls">
              <div class="timer-buttons">
                <button type="button" class="control-button" @click="toggleTimer">
                  {{ timerActive ? 'Pause' : 'Start' }}
                </button>
                <button type="button" class="control-button" @click="resetTimer">
                  Reset
                </button>
              </div>
              <p class="timer-display">{{ formattedTimer }}</p>
            </div>

            <div class="timezone-search-card" v-if="currentMode === 'time'">
              <p class="clock-label">Select Region and City</p>
              <div class="search-fields">
                <label>
                  Region / Country
                  <select v-model="area">
                    <option value="" disabled>Choose region</option>
                    <option v-for="region in areaOptions" :key="region" :value="region">{{ region }}</option>
                  </select>
                </label>

                <label>
                  City / Location
                  <select v-model="timezoneValue" :disabled="!area">
                    <option value="" disabled>Choose city</option>
                    <option v-for="option in locationOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>
              </div>

              <button type="button" class="refresh-button" @click="loadTimezoneTime" :disabled="loading || !timezoneValue">
                {{ loading ? 'Loading...' : 'Show Time' }}
              </button>
            </div>

            <div class="error-message" v-if="error">
              <p>{{ error }}</p>
            </div>
          </div>
        </div>

        <div class="images-section" v-if="currentMode === 'time' && cityImages.length > 0">
          <div class="images-container">
            <p class="images-title">City Images</p>
            <div class="images-carousel">
              <a
                v-for="(image, index) in cityImages"
                :key="index"
                :href="image.pageURL"
                target="_blank"
                rel="noopener noreferrer"
                class="image-item"
                :style="getImageStyle(index)"
              >
                <img :src="image.webformatURL" :alt="`City image ${index + 1}`" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { fetchCurrentTimeByIp, fetchTimeByTimezone, fetchTimezones } from './services/timeApi';
import { searchCityImages } from './services/pixabayApi';
import { useImageAnimation } from './composables/useImageAnimation';
import AnalogClock from './components/AnalogClock.vue';

const timeData = ref(null);
const loading = ref(false);
const error = ref('');
const area = ref('');
const timezoneValue = ref('');
const timezoneList = ref([]);
const currentMode = ref('time');
const timerActive = ref(false);
const timerSeconds = ref(0);
const cityImages = ref([]);
let timerInterval = null;

const { animateImagesOnLoad, getImageStyle, clearAnimations } = useImageAnimation();

const displayTime = computed(() => {
  if (timeData.value?.datetime) {
    return new Date(timeData.value.datetime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  return 'Loading...';
});

const formattedTimer = computed(() => {
  const minutes = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
  const seconds = String(timerSeconds.value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
});

async function loadTimezones() {
  try {
    timezoneList.value = await fetchTimezones();
    console.log('Loaded timezones:', timezoneList.value.length);
  } catch (err) {
    console.error('Error loading timezones:', err);
  }
}

const areaOptions = computed(() => {
  return [...new Set(timezoneList.value.map((tz) => tz.split('/')[0]))].sort();
});

const locationOptions = computed(() => {
  if (!area.value) {
    return [];
  }
  return timezoneList.value
    .filter((tz) => tz.startsWith(`${area.value}/`))
    .map((tz) => ({
      value: tz,
      label: tz.split('/').slice(1).join('/')
    }));
});

watch(area, () => {
  timezoneValue.value = '';
});

async function refreshTime() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchCurrentTimeByIp();
    timeData.value = data;
    console.log('Loaded time data:', data);
  } catch (err) {
    console.error('Error loading time:', err);
    error.value = err instanceof Error ? err.message : 'Error fetching time from API';
  } finally {
    loading.value = false;
  }
}

async function loadTimezoneTime() {
  if (!timezoneValue.value) {
    error.value = 'Please select region and city';
    return;
  }
  loading.value = true;
  error.value = '';
  clearAnimations();
  cityImages.value = [];
  try {
    const data = await fetchTimeByTimezone(timezoneValue.value);
    timeData.value = data;
    
    // Extract city name from timezone
    const cityName = timezoneValue.value.split('/').pop().replace(/_/g, ' ');
    const images = await searchCityImages(cityName);
    cityImages.value = images;
    
    // Trigger animations after images are loaded
    setTimeout(() => {
      animateImagesOnLoad(images);
    }, 100);
    
    console.log(`Loaded ${images.length} images for ${cityName}`);
  } catch (err) {
    console.error('Error:', err);
    error.value = err instanceof Error ? err.message : 'Error fetching data from API';
  } finally {
    loading.value = false;
  }
}

function stopTimer() {
  timerActive.value = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function toggleTimer() {
  if (timerActive.value) {
    stopTimer();
    return;
  }
  timerActive.value = true;
  timerInterval = setInterval(() => {
    timerSeconds.value += 1;
  }, 1000);
}

function resetTimer() {
  stopTimer();
  timerSeconds.value = 0;
}

onUnmounted(() => {
  stopTimer();
  clearAnimations();
});

onMounted(async () => {
  await loadTimezones();
  refreshTime();
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top, #272727 0%, #0b0b0b 100%);
  color: white;
}

.app-header {
  text-align: center;
  padding: 2rem 1rem;
}

h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 3rem;
  margin: 0;
}

.app-header p {
  margin: 0.5rem 0;
}

.app-main {
  flex: 1;
  padding: 0 1rem 2rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

.clock-section {
  display: flex;
  justify-content: flex-end;
}

.clock-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 2rem;
  min-width: 320px;
  max-width: 500px;
  text-align: center;
}

.mode-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.mode-button.active {
  background: #5a8cff;
  border-color: #5a8cff;
}

.time-details {
  margin-top: 1rem;
  text-align: left;
  line-height: 1.6;
}

.timer-controls {
  margin-top: 1rem;
}

.timer-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.control-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: #5a8cff;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.timer-display {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
}

.clock-label {
  font-size: 0.95rem;
  opacity: 0.8;
}

.timezone-search-card {
  margin-top: 1.8rem;
  text-align: left;
}

.search-fields {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

label {
  display: block;
  font-size: 0.95rem;
}

select {
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.refresh-button {
  margin-top: 1rem;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.6rem;
  background: #5a8cff;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

.refresh-button:disabled {
  background: #5a8cff88;
  cursor: default;
}

.error-message {
  margin-top: 1rem;
  color: #ff8b8b;
}

.images-section {
  display: flex;
  align-items: start;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  min-height: 400px;
}

.images-container {
  width: 100%;
}

.images-title {
  font-size: 1.2rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.images-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.image-item {
  position: relative;
  display: block;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid rgba(90, 140, 255, 0.4);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(90, 140, 255, 0.15);
}

.image-item:hover {
  border-color: rgba(90, 140, 255, 0.95);
  box-shadow: 0 12px 48px rgba(90, 140, 255, 0.6), inset 0 0 20px rgba(90, 140, 255, 0.1);
  transform: scale(1.12) translateY(-8px);
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

@media (max-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .clock-section {
    justify-content: center;
  }
}
</style>
