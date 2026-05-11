<script setup>
import { ref } from 'vue';

const time = ref(0);
const running = ref(false);
const laps = ref([]);
let interval = null;

function start() {
  if (!running.value) {
    running.value = true;
    interval = setInterval(() => {
      time.value += 10; 
    }, 10);
  }
}

function pause() {
  running.value = false;
  clearInterval(interval);
}

function reset() {
  pause();
  time.value = 0;
  laps.value = [];
}

function split() {
  laps.value.push(time.value);
}

function format(ms) {
  const minutes = String(Math.floor(ms / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const millis = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${millis}`;
}
</script>

<template>
  <div class="stopwatch">
    <h1 class="timer-display">{{ format(time) }}</h1>
    <div class="timer-buttons">
      <button class="magic-button split-btn" @click="split">SPLIT</button>
      <button class="magic-button start-btn" @click="running ? pause() : start()">
        {{ running ? 'PAUSE' : 'START' }}
      </button>
      <button class="magic-button reset-btn" @click="reset">RESET</button>
    </div>

    <ul class="laps">
      <li v-for="(lap, i) in laps" :key="i">
        Lap {{ i + 1 }} — {{ format(lap) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stopwatch {
  text-align: center;
  margin-top: 2rem;
}

.timer-display {
  font-size: 2.5rem;
  font-family: 'Courier New', monospace;
  color: #00ffcc;
  margin-bottom: 1rem;
}

.timer-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
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

.split-btn {
  background: linear-gradient(135deg, #5a8cff, #00c6ff);
}

.start-btn {
  background: linear-gradient(135deg, #28a745, #5a8cff);
}

.reset-btn {
  background: linear-gradient(135deg, #dc3545, #9b5aff);
}

.laps {
  margin-top: 1rem;
  list-style: none;
  padding: 0;
}

.laps li {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  padding: 0.5rem 1rem;
  margin: 0.3rem auto;
  border-radius: 14px;
  width: fit-content;
  font-family: 'Courier New', monospace;
}
</style>
