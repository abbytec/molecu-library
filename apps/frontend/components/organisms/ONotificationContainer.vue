<template>
	<div v-if="notificationStore.notifications.length > 0" class="notification-container">
		<ANotification
			v-for="notification in notificationStore.notifications"
			:key="notification.id"
			:message="notification.message"
			:type="notification.type"
			:duration="notification.duration"
			:dismissible="notification.dismissible"
			@dismiss="handleDismiss(notification.id)" />
	</div>
</template>

<script setup>
import ANotification from "~/components/atoms/ANotification.vue";
import { useNotificationStore } from "~/stores/useNotificationStore";

const notificationStore = useNotificationStore();

const handleDismiss = (id) => {
	notificationStore.removeNotification(id);
};
</script>

<style scoped lang="scss">
.notification-container {
	position: fixed;
	top: 0;
	right: 0;
	z-index: 10000;
	pointer-events: none;

	:deep(.notification) {
		pointer-events: all;
		margin-bottom: 1rem;

		&:last-child {
			margin-bottom: 0;
		}
	}
}
</style>
