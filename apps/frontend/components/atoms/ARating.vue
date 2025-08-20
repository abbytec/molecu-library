<template>
  <div class="rating">
    <div class="rating__stars">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="rating__star"
        :class="{ 'rating__star--filled': star <= internalRating, 'rating__star--hover': star <= hoverRating }"
        @click="handleStarClick(star)"
        @mouseenter="handleStarHover(star)"
        @mouseleave="handleMouseLeave"
        :disabled="disabled"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    </div>
    <span v-if="showLabel" class="rating__label">
      {{ ratingLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: number
  disabled?: boolean
  showLabel?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showLabel: true
})

const emit = defineEmits<Emits>()

const internalRating = ref(props.modelValue)
const hoverRating = ref(0)

const ratingLabels = {
  0: 'Sin calificación',
  1: 'Muy malo',
  2: 'Malo', 
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente'
}

const ratingLabel = computed(() => {
  const rating = hoverRating.value || internalRating.value
  return ratingLabels[rating as keyof typeof ratingLabels] || 'Sin calificación'
})

const handleStarClick = (star: number) => {
  if (props.disabled) return
  internalRating.value = star
  emit('update:modelValue', star)
}

const handleStarHover = (star: number) => {
  if (props.disabled) return
  hoverRating.value = star
}

const handleMouseLeave = () => {
  hoverRating.value = 0
}

// Watch para cambios externos en modelValue
watch(() => props.modelValue, (newValue) => {
  internalRating.value = newValue
})
</script>

<style scoped lang="scss">
.rating {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;

  &__stars {
    display: flex;
    gap: 0.25rem;
  }

  &__star {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: $border;
    transition: color 0.2s ease, transform 0.1s ease;
    border-radius: 4px;

    &:hover:not(:disabled) {
      transform: scale(1.1);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--filled,
    &--hover {
      color: $warning;
    }

    svg {
      display: block;
    }
  }

  &__label {
    font-size: 0.875rem;
    color: $text-muted;
    font-weight: 500;
  }
}
</style> 