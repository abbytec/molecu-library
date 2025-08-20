<template>
  <div class="textarea-field">
    <label v-if="label" :for="id" class="textarea-field__label">
      {{ label }}
    </label>
    <div class="textarea-field__container">
      <textarea
        :id="id"
        v-model="internalValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :rows="rows"
        class="textarea-field__input"
        :class="{ 'textarea-field__input--error': hasError }"
        @input="handleInput"
        @blur="handleBlur"
      />
      <div class="textarea-field__footer">
        <span v-if="errorMessage" class="textarea-field__error">
          {{ errorMessage }}
        </span>
        <span class="textarea-field__counter" :class="{ 'textarea-field__counter--warning': isNearLimit }">
          {{ characterCount }}/{{ maxLength }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: string
  id?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 500,
  rows: 4,
  disabled: false,
  required: false
})

const emit = defineEmits<Emits>()

const internalValue = ref(props.modelValue)
const errorMessage = ref('')

const characterCount = computed(() => internalValue.value.length)
const isNearLimit = computed(() => characterCount.value > props.maxLength * 0.8)
const hasError = computed(() => !!errorMessage.value)

const validateInput = () => {
  errorMessage.value = ''
  
  if (props.required && !internalValue.value.trim()) {
    errorMessage.value = 'Este campo es obligatorio'
    return false
  }
  
  if (internalValue.value.length > props.maxLength) {
    errorMessage.value = `Máximo ${props.maxLength} caracteres permitidos`
    return false
  }
  
  return true
}

const handleInput = () => {
  emit('update:modelValue', internalValue.value)
  validateInput()
}

const handleBlur = (event: FocusEvent) => {
  validateInput()
  emit('blur', event)
}

// Watch para cambios externos en modelValue
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})
</script>

<style scoped lang="scss">
.textarea-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text;
  }

  &__container {
    position: relative;
  }

  &__input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid $border;
    border-radius: 8px;
    background: $surface;
    color: $text;
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 100px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }

    &:disabled {
      background: $surface-alt;
      color: $text-muted;
      cursor: not-allowed;
    }

    &--error {
      border-color: $danger;
      
      &:focus {
        border-color: $danger;
        box-shadow: 0 0 0 3px rgba($danger, 0.1);
      }
    }

    &::placeholder {
      color: $text-muted;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.25rem;
    min-height: 1.25rem;
  }

  &__error {
    font-size: 0.75rem;
    color: $danger;
    font-weight: 500;
  }

  &__counter {
    font-size: 0.75rem;
    color: $text-muted;
    font-weight: 500;

    &--warning {
      color: $warning;
    }
  }
}
</style> 