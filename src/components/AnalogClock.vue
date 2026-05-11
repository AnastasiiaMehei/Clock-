<template>
  <div class="analog-clock-container">
    <canvas ref="clockCanvas" width="300" height="300" class="analog-clock"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  mode: { type: String, default: 'time' },
  timerSeconds: { type: Number, default: 0 },
  isTimerActive: { type: Boolean, default: false },
  timeData: { type: Object, default: null }
});

const clockCanvas = ref(null);
let animationFrame = null;

const drawClock = () => {
  const canvas = clockCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 20;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x1 = centerX + Math.cos(angle) * (radius - 20);
    const y1 = centerY + Math.sin(angle) * (radius - 20);
    const x2 = centerX + Math.cos(angle) * (radius - 10);
    const y2 = centerY + Math.sin(angle) * (radius - 10);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (let i = 0; i < 60; i++) {
    if (i % 5 !== 0) {
      const angle = (i * Math.PI) / 30;
      const x1 = centerX + Math.cos(angle) * (radius - 15);
      const y1 = centerY + Math.sin(angle) * (radius - 15);
      const x2 = centerX + Math.cos(angle) * (radius - 10);
      const y2 = centerY + Math.sin(angle) * (radius - 10);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  let now;
  if (props.mode === 'timer') {
    const totalSeconds = props.timerSeconds;
    const hours = Math.floor(totalSeconds / 3600) % 12;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;
    now = { hours, minutes, seconds };
  } else {
    if (props.timeData?.datetime) {
      const date = new Date(props.timeData.datetime);
      now = {
        hours: date.getHours() % 12,
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
      };
    } else {
      const date = new Date();
      now = {
        hours: date.getHours() % 12,
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
      };
    }
  }

  const hourAngle = (now.hours * Math.PI) / 6 + (now.minutes * Math.PI) / 360;
  drawHand(ctx, centerX, centerY, hourAngle, radius * 0.5, 6, 'white');

  const minuteAngle = (now.minutes * Math.PI) / 30 + (now.seconds * Math.PI) / 1800;
  drawHand(ctx, centerX, centerY, minuteAngle, radius * 0.7, 4, 'white');

  const secondAngle = (now.seconds * Math.PI) / 30;
  drawHand(ctx, centerX, centerY, secondAngle, radius * 0.9, 2, '#ff6b6b');

  // Центр
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 15;
  ctx.fill();
};

const drawHand = (ctx, centerX, centerY, angle, length, width, color) => {
  const x = centerX + Math.cos(angle - Math.PI / 2) * length;
  const y = centerY + Math.sin(angle - Math.PI / 2) * length;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
};

const animate = () => {
  drawClock();
  if (props.mode === 'time' || props.isTimerActive) {
    animationFrame = requestAnimationFrame(animate);
  }
};

onMounted(() => {
  animate();
});

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});

watch([() => props.mode, () => props.timerSeconds, () => props.isTimerActive, () => props.timeData], () => {
  drawClock();
});
</script>

<style scoped>
.analog-clock-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  animation: float 6s ease-in-out infinite;
}

.analog-clock {
  border-radius: 50%;
  background: radial-gradient(circle at center, #1a002b, #070707);
  border: 3px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 0 25px rgba(180, 0, 255, 0.6),
    inset 0 0 25px rgba(0, 255, 255, 0.3),
    0 0 60px rgba(90, 140, 255, 0.4);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
}

.analog-clock:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 
    0 0 40px rgba(180, 0, 255, 0.8),
    inset 0 0 30px rgba(0, 255, 255, 0.5),
    0 0 80px rgba(90, 140, 255, 0.6);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style>
