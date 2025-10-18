// API Service for backend communication
class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}');
        return user.token || null;
    }

    // Make authenticated API request
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getAuthToken();

        const config = {
            headers: {
                ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getProfile() {
        return await this.makeRequest('/auth/profile');
    }

    async updateProfile(userData) {
        return await this.makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Tours endpoints
    async getTours(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/tours${queryString ? '?' + queryString : ''}`);
    }

    async getTour(id) {
        return await this.makeRequest(`/tours/${id}`);
    }

    async createTour(tourData) {
        return await this.makeRequest('/tours', {
            method: 'POST',
            body: tourData instanceof FormData ? tourData : JSON.stringify(tourData)
        });
    }

    async updateTour(id, tourData) {
        return await this.makeRequest(`/tours/${id}`, {
            method: 'PUT',
            body: tourData instanceof FormData ? tourData : JSON.stringify(tourData)
        });
    }

    async deleteTour(id) {
        return await this.makeRequest(`/tours/${id}`, {
            method: 'DELETE'
        });
    }

    // Rentals endpoints
    async getRentals(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/rentals${queryString ? '?' + queryString : ''}`);
    }

    async getRental(id) {
        return await this.makeRequest(`/rentals/${id}`);
    }

    async createRental(rentalData) {
        return await this.makeRequest('/rentals', {
            method: 'POST',
            body: rentalData instanceof FormData ? rentalData : JSON.stringify(rentalData)
        });
    }

    async updateRental(id, rentalData) {
        return await this.makeRequest(`/rentals/${id}`, {
            method: 'PUT',
            body: rentalData instanceof FormData ? rentalData : JSON.stringify(rentalData)
        });
    }

    async deleteRental(id) {
        return await this.makeRequest(`/rentals/${id}`, {
            method: 'DELETE'
        });
    }

    // Bookings endpoints
    async getBookings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/bookings${queryString ? '?' + queryString : ''}`);
    }

    async createBooking(bookingData) {
        return await this.makeRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async cancelBooking(id) {
        return await this.makeRequest(`/bookings/${id}/cancel`, {
            method: 'PUT'
        });
    }

    // Payments endpoints
    async getPayments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/payments${queryString ? '?' + queryString : ''}`);
    }

    async createPayment(paymentData) {
        return await this.makeRequest('/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Messages endpoints
    async getMessages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/messages${queryString ? '?' + queryString : ''}`);
    }

    async sendMessage(messageData) {
        return await this.makeRequest('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    // Newsletter endpoints
    async subscribeNewsletter(data) {
        return await this.makeRequest('/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getNewsletterSubscribers() {
        return await this.makeRequest('/newsletter/subscribers');
    }

    async sendNewsletter(data) {
        return await this.makeRequest('/newsletter/send', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Analytics endpoints
    async getAnalytics() {
        return await this.makeRequest('/analytics');
    }

    // Staff management endpoints
    async getStaff(id = null) {
        return await this.makeRequest(id ? `/staff/${id}` : '/staff');
    }

    async createStaff(staffData) {
        return await this.makeRequest('/staff', {
            method: 'POST',
            body: JSON.stringify(staffData)
        });
    }

    async updateStaff(id, staffData) {
        return await this.makeRequest(`/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify(staffData)
        });
    }

    async deleteStaff(id) {
        return await this.makeRequest(`/staff/${id}`, {
            method: 'DELETE'
        });
    }

    // Images endpoints
    async getImages(type, id) {
        return await this.makeRequest(`/images/${type}/${id}`);
    }

    // Schedule endpoints
    async getAvailability(date) {
        return await this.makeRequest(`/schedule/availability/${date}`);
    }
}

// Global API instance
const api = new APIService();