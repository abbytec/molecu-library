interface Notification {
	id: string;
	message: string;
	type: "success" | "error" | "warning" | "info";
	duration?: number;
	dismissible?: boolean;
}

type NewNotification = Omit<Notification, "id">;
type NotificationOptions = Partial<Omit<Notification, "id" | "message" | "type">>;

export const useNotificationStore = defineStore("notification", {
	state: () => ({
		notifications: [] as Notification[],
	}),

	actions: {
		addNotification(notification: NewNotification) {
			const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const newNotification: Notification = {
				id,
				duration: 5000,
				dismissible: true,
				...notification,
			};

			this.notifications.push(newNotification);

			// Auto-remover si tiene duración
			if (newNotification.duration && newNotification.duration > 0) {
				setTimeout(() => {
					this.removeNotification(id);
				}, newNotification.duration);
			}

			return id;
		},

		removeNotification(id: string) {
			const index = this.notifications.findIndex((n) => n.id === id);
			if (index > -1) {
				this.notifications.splice(index, 1);
			}
		},

		// Métodos de conveniencia
		success(message: string, options?: NotificationOptions) {
			console.log("🎉 Llamando notificationStore.success:", message);
			const id = this.addNotification({
				message,
				type: "success",
				...options,
			});
			console.log("📝 Notificación agregada con ID:", id, "Total:", this.notifications.length);
			return id;
		},

		error(message: string, options?: NotificationOptions) {
			return this.addNotification({
				message,
				type: "error",
				duration: 8000, // Errores duran más tiempo
				...options,
			});
		},

		warning(message: string, options?: NotificationOptions) {
			return this.addNotification({
				message,
				type: "warning",
				duration: 6000,
				...options,
			});
		},

		info(message: string, options?: NotificationOptions) {
			return this.addNotification({
				message,
				type: "info",
				...options,
			});
		},

		clear() {
			this.notifications = [];
		},
	},
});
