<template>
	<Transition name="notification" appear>
		<div v-if="visible" class="notification" :class="[`notification--${type}`, { 'notification--dismissible': dismissible }]">
			<div class="notification__content">
				<div class="notification__icon">
					<svg v-if="type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
					</svg>
					<svg v-else-if="type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm4.3 14.3L15 17l-3-3-3 3-1.3-1.3 3-3-3-3L9 7l3 3 3-3 1.3 1.3-3 3 3 3z" />
					</svg>
					<svg v-else-if="type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
					</svg>
					<svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
					</svg>
				</div>
				<div class="notification__message">
					<slot>{{ message }}</slot>
				</div>
				<button v-if="dismissible" @click="handleDismiss" class="notification__close" type="button">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
					</svg>
				</button>
			</div>
		</div>
	</Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const props = defineProps({
	message: {
		type: String,
		default: "",
	},
	type: {
		type: String,
		default: "info",
		validator: (value) => ["success", "error", "warning", "info"].includes(value),
	},
	duration: {
		type: Number,
		default: 5000,
	},
	dismissible: {
		type: Boolean,
		default: true,
	},
})

const emit = defineEmits(["dismiss"])

const visible = ref(true)
let timeoutId = null

const handleDismiss = () => {
	console.log('❌ ANotification handleDismiss llamado');
	visible.value = false
	if (timeoutId) {
		clearTimeout(timeoutId)
	}
	emit("dismiss")
}

onMounted(() => {
	console.log('🎯 ANotification montado:', props.message, props.type);
	if (props.duration > 0) {
		timeoutId = setTimeout(() => {
			console.log('⏰ ANotification auto-dismiss después de', props.duration, 'ms');
			handleDismiss()
		}, props.duration)
	}
})

onUnmounted(() => {
	if (timeoutId) {
		clearTimeout(timeoutId)
	}
})
</script>

<style scoped lang="scss">
.notification {
	position: fixed;
	top: 2rem;
	right: 2rem;
	z-index: 9999;
	max-width: 400px;
	min-width: 300px;
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255, 255, 255, 0.2);

	&__content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
	}

	&__icon {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	&__message {
		flex: 1;
		font-size: 0.875rem;
		line-height: 1.4;
		font-weight: 500;
	}

	&__close {
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background-color 0.2s ease;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	// Variantes de tipo
	&--success {
		background: linear-gradient(135deg, rgba($success, 0.95) 0%, rgba(darken($success, 10%), 0.95) 100%);
		color: $text-inverse;

		.notification__close:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	&--error {
		background: linear-gradient(135deg, rgba($danger, 0.95) 0%, rgba(darken($danger, 10%), 0.95) 100%);
		color: $text-inverse;

		.notification__close:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	&--warning {
		background: linear-gradient(135deg, rgba($warning, 0.95) 0%, rgba(darken($warning, 10%), 0.95) 100%);
		color: $text-inverse;

		.notification__close:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	&--info {
		background: linear-gradient(135deg, rgba($info, 0.95) 0%, rgba(darken($info, 10%), 0.95) 100%);
		color: $text-inverse;

		.notification__close:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	// Responsive
	@media (max-width: 640px) {
		top: 1rem;
		right: 1rem;
		left: 1rem;
		max-width: none;
		min-width: 0;
	}
}

// Animaciones
.notification-enter-active,
.notification-leave-active {
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notification-enter-from {
	opacity: 0;
	transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
	opacity: 0;
	transform: translateX(100%) scale(0.9);
}

@media (max-width: 640px) {
	.notification-enter-from,
	.notification-leave-to {
		transform: translateY(-100%) scale(0.9);
	}
}
</style> 