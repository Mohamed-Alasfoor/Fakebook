export async function fetchNotifications() {
    const response = await fetch("/notifications/get", {
      method: "GET",
      credentials: "include", // Send cookies if you rely on session cookies
    });
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json(); // This should be an array of notifications
  }
  
  export async function markNotificationAsRead(notificationId: string) {
    const response = await fetch(`/notifications/read?id=${notificationId}`, {
      method: "PUT",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }
  }
  