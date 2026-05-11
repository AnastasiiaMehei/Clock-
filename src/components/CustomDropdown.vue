<template>
  <div class="magic-dropdown">
    <button class="dropdown-toggle" @click="toggleDropdown" :disabled="disabled">
      {{ selectedLabel || placeholder }}
      <span class="arrow" :class="{ open }"></span>
    </button>
    <ul v-if="open" class="dropdown-menu">
      <li
        v-for="option in options"
        :key="typeof option === 'object' ? option.value : option"
        @click="selectOption(option)"
      >
        {{ typeof option === 'object' ? option.label : option }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select option' },
  disabled: { type: Boolean, default: false },
  dropdownId: { type: String, required: true },
  openDropdown: { type: String, default: null }
});

const emit = defineEmits(['update:modelValue', 'update:openDropdown']);

const open = ref(false);
const selectedLabel = ref('');

watch(
  () => props.modelValue,
  (val) => {
    const found = props.options.find(
      (opt) => (typeof opt === 'object' ? opt.value : opt) === val
    );
    selectedLabel.value = found
      ? typeof found === 'object'
        ? found.label
        : found
      : '';
  },
  { immediate: true }
);

watch(
  () => props.openDropdown,
  (val) => {
    open.value = val === props.dropdownId;
  },
  { immediate: true }
);

function toggleDropdown() {
  if (props.disabled) return;
  emit('update:openDropdown', open.value ? null : props.dropdownId);
}

function selectOption(option) {
  const value = typeof option === 'object' ? option.value : option;
  const label = typeof option === 'object' ? option.label : option;
  emit('update:modelValue', value);
  selectedLabel.value = label;
  emit('update:openDropdown', null);
}
</script>

<style scoped>
.magic-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-toggle {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #5a8cff, #9b5aff);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.dropdown-toggle:disabled {
  opacity: 0.5;
  cursor: default;
}

.arrow {
  float: right;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #fff;
  transition: transform 0.3s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1a1a1a; 
  border-radius: 14px;
  margin-top: 0.5rem;
  list-style: none;
  padding: 0;
  box-shadow: 0 8px 32px rgba(90, 140, 255, 0.3);
  z-index: 10;

  max-height: 120px;
  overflow-y: auto;
}

.dropdown-menu li {
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.dropdown-menu li:hover {
  background: rgba(90, 140, 255, 0.4);
}
</style>
