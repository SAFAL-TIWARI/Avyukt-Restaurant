const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const request = async (endpoint, options = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // Authentication & OTP
  sendEmailOtp: (email, type = 'any') => request("/api/auth/send-email-otp", { method: "POST", body: JSON.stringify({ email, type }) }),
  verifyEmailOtp: (email, otp, name = '', type = 'any', password = '') => request("/api/auth/verify-email-otp", { method: "POST", body: JSON.stringify({ email, otp, name, type, password }) }),
  loginWithPassword: (email, password) => request("/api/auth/login-with-password", { method: "POST", body: JSON.stringify({ email, password }) }),
  syncPassword: (email, password) => request("/api/auth/sync-password", { method: "POST", body: JSON.stringify({ email, password }) }),
  adminLogin: (email, password) => request("/api/auth/admin-login", { method: "POST", body: JSON.stringify({ email, password }) }),
  updateProfile: (profileData) => request("/api/auth/update-profile", { method: "POST", body: JSON.stringify(profileData) }),
  forgotPassword: (email) => request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  // Payments (Razorpay)
  createRazorpayOrder: (amount, receipt, notes) => 
    request("/api/payment/create-order", { method: "POST", body: JSON.stringify({ amount, receipt, notes }) }),
  verifyPayment: (payload) => 
    request("/api/payment/verify", { method: "POST", body: JSON.stringify(payload) }),
  getUserPayments: (userId) => 
    request(`/api/payment/user/${userId}`),

  // Orders Lifecycle
  createOrder: (orderData) => 
    request("/api/orders", { method: "POST", body: JSON.stringify(orderData) }),
  getUserOrders: (userId) => 
    request(`/api/orders/user/${userId}`),
  getAllOrders: () => 
    request("/api/orders/all"),
  updateOrderStatus: (orderId, orderStatus) => 
    request(`/api/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ orderStatus }) }),
  adminConfirmPayment: (orderId) => 
    request(`/api/orders/${orderId}/admin-confirm-amount`, { method: "PATCH" }),
  customerConfirmReceived: (orderId) => 
    request(`/api/orders/${orderId}/customer-confirm-received`, { method: "PATCH" }),
  deleteOrder: (orderId) =>
    request(`/api/orders/${orderId}`, { method: "DELETE" }),

  // Interactions (Reservations, Feedback, Contact)
  bookTable: (bookingData) => 
    request("/api/interactions/reservation", { method: "POST", body: JSON.stringify(bookingData) }),
  getAllReservations: () => 
    request("/api/interactions/reservations"),
  updateReservationStatus: (id, payload) => 
    request(`/api/interactions/reservation/${id}/status`, { 
      method: "PATCH", 
      body: JSON.stringify(typeof payload === 'string' ? { status: payload } : payload) 
    }),
  deleteReservation: (id) =>
    request(`/api/interactions/reservation/${id}`, { method: "DELETE" }),
  
  submitFeedback: (feedbackData) => 
    request("/api/interactions/feedback", { method: "POST", body: JSON.stringify(feedbackData) }),
  getAllFeedbacks: () => 
    request("/api/interactions/feedbacks"),
  deleteFeedback: (id) =>
    request(`/api/interactions/feedback/${id}`, { method: "DELETE" }),

  submitContact: (contactData) => 
    request("/api/interactions/contact", { method: "POST", body: JSON.stringify(contactData) }),
  getAllContacts: () => 
    request("/api/interactions/contacts"),
  replyToContact: (id, payload) => 
    request(`/api/interactions/contact/${id}/reply`, { method: "POST", body: JSON.stringify(payload) }),
  deleteContact: (id) =>
    request(`/api/interactions/contact/${id}`, { method: "DELETE" }),

  // Notifications
  getUserNotifications: (userId, email = '') => 
    request(`/api/notifications/${userId}${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  sendBroadcastNotification: (notificationData) => 
    request("/api/notifications/broadcast", { method: "POST", body: JSON.stringify(notificationData) }),
  markNotificationRead: (id) => 
    request(`/api/notifications/${id}/read`, { method: "PATCH" }),
  deleteNotification: (id) =>
    request(`/api/notifications/${id}`, { method: "DELETE" }),

  // Admin Overview
  getAdminStats: () => 
    request("/api/admin/stats"),
};

export default api;
