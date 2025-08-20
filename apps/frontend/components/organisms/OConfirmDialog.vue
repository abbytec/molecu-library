<template>
	<div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
		<div class="confirm-dialog" role="dialog" aria-labelledby="dialog-title" aria-modal="true">
			<div class="confirm-dialog__icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
					<path d="M12 9v4" />
					<path d="m12 17 .01 0" />
				</svg>
			</div>

			<div class="confirm-dialog__content">
				<h2 id="dialog-title" class="confirm-dialog__title">
					{{ title }}
				</h2>

				<p class="confirm-dialog__message">
					{{ message }}
				</p>
			</div>

			<div class="confirm-dialog__actions">
				<AButton variant="ghost" @click="handleCancel" :disabled="isLoading">
					{{ cancelText }}
				</AButton>
				<AButton @click="handleConfirm" :disabled="isLoading" class="confirm-dialog__confirm-btn">
					{{ isLoading ? "Procesando..." : confirmText }}
				</AButton>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import AButton from "../atoms/AButton.vue";
import { onMounted, onUnmounted } from "vue";

interface Props {
	isOpen: boolean;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

interface Emits {
	confirm: [];
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	title: "¿Estás seguro?",
	message: "Esta acción no se puede deshacer.",
	confirmText: "Confirmar",
	cancelText: "Cancelar",
	isLoading: false,
});

const emit = defineEmits<Emits>();

const handleConfirm = () => {
	emit("confirm");
};

const handleCancel = () => {
	emit("cancel");
};

const handleOverlayClick = (event: Event) => {
	// Solo cerrar si se hace clic directamente en el overlay
	if (event.target === event.currentTarget && !props.isLoading) {
		handleCancel();
	}
};

// Cerrar modal con la tecla Escape
onMounted(() => {
	const handleEscape = (event: KeyboardEvent) => {
		if (event.key === "Escape" && props.isOpen && !props.isLoading) {
			handleCancel();
		}
	};

	document.addEventListener("keydown", handleEscape);

	onUnmounted(() => {
		document.removeEventListener("keydown", handleEscape);
	});
});
</script>

<style scoped lang="scss">
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1001; // Mayor que el modal de edición
	padding: 1rem;
}

.confirm-dialog {
	background: $surface;
	border-radius: 12px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	width: 100%;
	max-width: 400px;
	padding: 2rem;
	text-align: center;

	&__icon {
		color: $warning;
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;

		svg {
			display: block;
		}
	}

	&__content {
		margin-bottom: 2rem;
	}

	&__title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: $text;
	}

	&__message {
		margin: 0;
		font-size: 1rem;
		color: $text-muted;
		line-height: 1.5;
	}

	&__actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	&__confirm-btn {
		--btn-bg: #{$danger};
		--btn-bg-hover: #{darken($danger, 10%)};
	}
}
</style>
