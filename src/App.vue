<template>
  <div class="app-container">
    <header class="app-header"></header>

    <main class="app-main">
      <div class="content-wrapper">
        <div class="clock-section">
          <div class="clock-card">
            <div class="mode-selector">
              <button
                type="button"
                class="mode-button magic-button"
                :class="{ active: currentMode === 'time' }"
                @click="currentMode = 'time'"
              >
                Show Time
              </button>
              <button
                type="button"
                class="mode-button magic-button"
                :class="{ active: currentMode === 'timer' }"
                @click="currentMode = 'timer'"
              >
                Show Timer
              </button>
            </div>

            <AnalogClock
              v-if="currentMode === 'time'"
              :mode="currentMode"
              :time-data="timeData"
            />

            <div v-if="currentMode === 'time'" class="time-details">
              <p>🕒 Current Time: <strong>{{ displayTime }}</strong></p>
              <p>🌐 Timezone: <strong>{{ timeData?.timezone || 'UTC' }}</strong></p>
            </div>

            <div v-if="currentMode === 'timer'" class="timer-controls">
              <Stopwatch />
            </div>

            <!-- Пошук таймзон -->
            <div class="timezone-search-card" v-if="currentMode === 'time'">
              <p class="clock-label">Select Region and City</p>
              <div class="search-fields">
                <CustomDropdown
                  v-model="area"
                  :options="areaOptions"
                  placeholder="Choose region"
                  dropdown-id="region"
                  :open-dropdown="openDropdown"
                  @update:openDropdown="openDropdown = $event"
                />

                <CustomDropdown
                  v-model="timezoneValue"
                  :options="locationOptions"
                  placeholder="Choose city"
                  dropdown-id="city"
                  :open-dropdown="openDropdown"
                  @update:openDropdown="openDropdown = $event"
                  :disabled="!area"
                />
              </div>
              <button
                type="button"
                class="refresh-button magic-button"
                @click="loadTimezoneTime"
                :disabled="loading || !timezoneValue"
              >
                {{ loading ? 'Loading...' : 'Show Time' }}
              </button>
            </div>

            <div class="error-message" v-if="error && currentMode === 'time'">
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

  <div v-if="cityImages.length % 2 !== 0" class="image-item placeholder">
    <svg width="100%" height="200" viewBox="0 0 24 24" fill="none">
      <rect width="100%" height="100%" fill="rgba(255,255,255,0.05)" />
      <path d="M4 4h16v16H4z" stroke="#5a8cff" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" stroke="#9b5aff" stroke-width="2"/>
      <path d="M4 18l4-6 4 5 4-3 4 4" stroke="#5a8cff" stroke-width="2"/>
    </svg>
  </div>
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
import CustomDropdown from './components/CustomDropdown.vue';
import Stopwatch from './components/Stopwatch.vue';

const timeData = ref(null);
const loading = ref(false);
const error = ref('');
const area = ref('');
const timezoneValue = ref('');
const timezoneList = ref([]);
const currentMode = ref('time');
const cityImages = ref([]);
const openDropdown = ref(null);

const { animateImagesOnLoad, getImageStyle, clearAnimations } = useImageAnimation();

const displayTime = computed(() => {
  if (timeData.value?.local_time) {
    return new Date(timeData.value.local_time).toLocaleString('en-US', {
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
  if (currentMode.value !== 'time') return;
  try {
    const data = await fetchCurrentTimeByIp();
    timeData.value = data;
  } catch (err) {
    console.error('Error loading time:', err);
    error.value = null; 
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
    
    const cityName = timezoneValue.value.split('/').pop().replace(/_/g, ' ');
    const images = await searchCityImages(cityName);
    cityImages.value = images;
    
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

onUnmounted(() => {
  clearAnimations();
});

onMounted(async () => {
  await loadTimezones();
  if (currentMode.value === 'time') {
    refreshTime();
  }
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
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

.content-wrapper:has(.images-section) {
  grid-template-columns: 1fr 1fr;
}

.content-wrapper:not(:has(.images-section)) {
  grid-template-columns: 1fr;
  justify-items: center;
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
.placeholder {
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 3px dashed rgba(90, 140, 255, 0.4);
}

.placeholder img {
  opacity: 0.3;
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.magic-button {
  position: relative;
  display: inline-block;
  padding: 0.9rem 1.8rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #5a8cff, #9b5aff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.magic-button::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at top left, rgba(255,255,255,0.3), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.magic-button:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 40px rgba(90, 140, 255, 0.6);
}

.magic-button:hover::before {
  opacity: 1;
}

.magic-input {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border: 2px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.magic-input:focus {
  outline: none;
  border-color: #5a8cff;
  box-shadow: 0 0 12px rgba(90, 140, 255, 0.7);
}

.magic-textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border-radius: 14px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.magic-textarea:focus {
  outline: none;
  border-color: #9b5aff;
  box-shadow: 0 0 16px rgba(155, 90, 255, 0.6);
}

.magic-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  font-size: 0.95rem;
}

.magic-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.magic-select select {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.magic-select select:focus {
  outline: none;
  border-color: #5a8cff;
  box-shadow: 0 0 12px rgba(90, 140, 255, 0.7);
}

.magic-select .arrow {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 0;
  height: 0;
  pointer-events: none;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #fff;
  transform: translateY(-50%);
  transition: transform 0.3s ease;
}

.magic-select select:focus + .arrow {
  transform: translateY(-50%) rotate(180deg);
  border-top-color: #5a8cff;
}
.magic-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.magic-select select {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;
  appearance: none; 
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.magic-select select:focus {
  outline: none;
  border-color: #5a8cff;
  box-shadow: 0 0 12px rgba(90, 140, 255, 0.7);
}

.magic-select .arrow {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 0;
  height: 0;
  pointer-events: none;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #fff;
  transform: translateY(-50%);
  transition: transform 0.3s ease, border-top-color 0.3s ease;
}

.magic-select select:focus + .arrow {
  transform: translateY(-50%) rotate(180deg);
  border-top-color: #5a8cff;
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
