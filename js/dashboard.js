// Dashboard functionality
let currentUser = null;
let isAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = auth.getCurrentUser();
    isAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Staff');
    
    // Initialize dashboard
    initializeDashboard();
    loadDashboardData();
    
    // Mobile menu functionality
    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-overlay');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMobileMenu);
    }
});

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');
    
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    if (menuBtn) menuBtn.classList.toggle('active');
}

function initializeDashboard() {
    // Set user name
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}`;
    
    // Show/hide admin sections
    if (isAdmin) {
        document.getElementById('admin-menu').style.display = 'block';
        document.getElementById('admin-overview').style.display = 'block';
        document.getElementById('client-overview').style.display = 'none';
    } else {
        document.getElementById('admin-menu').style.display = 'none';
        document.getElementById('admin-overview').style.display = 'none';
        document.getElementById('client-overview').style.display = 'block';
    }
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
        loadProfileData();
    }
    
    // Booking filters
    const bookingFilter = document.getElementById('booking-filter');
    if (bookingFilter) {
        bookingFilter.addEventListener('change', filterBookings);
    }
    
    const adminBookingFilter = document.getElementById('admin-booking-filter');
    if (adminBookingFilter) {
        adminBookingFilter.addEventListener('change', filterAdminBookings);
    }
    
    // Tour form
    const tourForm = document.getElementById('tour-form');
    if (tourForm) {
        tourForm.addEventListener('submit', saveTour);
    }
    
    // Rental form
    const rentalForm = document.getElementById('rental-form');
    if (rentalForm) {
        rentalForm.addEventListener('submit', saveRental);
    }
}

async function loadDashboardData() {
    try {
        // Load different data based on user role
        if (isAdmin) {
            await loadAdminData();
        } else {
            await loadClientData();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadClientData() {
    try {
        // Load client bookings
        const response = await api.getBookings();
        const bookings = response.bookings || [];
        displayClientBookings(bookings);
        
        // Available resources are loaded in the Book Now section
        
        // Update client stats
        updateClientStats(bookings, []);
        
    } catch (error) {
        console.error('Error loading client data:', error);
    }
}

async function loadAdminData() {
    try {
        // Load all data for admin
        const [bookingsResponse, toursResponse, rentalsResponse] = await Promise.all([
            api.getBookings(),
            api.getTours(),
            api.getRentals()
        ]);
        
        const bookings = bookingsResponse.bookings || [];
        const tours = toursResponse.tours || [];
        const rentals = rentalsResponse.rentals || [];
        
        // Display admin data
        displayAdminBookings(bookings);
        displayTours(tours);
        displayRentals(rentals);
        
        // Update admin stats
        updateAdminStats(bookings, [], [], []);
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

function updateClientStats(bookings, payments) {
    const upcomingBookings = bookings.filter(b => 
        new Date(b.bookingDate) >= new Date() && 
        b.status === 'Confirmed'
    ).length;
    
    const totalSpent = payments
        .filter(p => p.status === 'Success')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const completedAdventures = bookings.filter(b => 
        b.status === 'Completed'
    ).length;
    
    document.getElementById('upcoming-bookings').textContent = upcomingBookings;
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
    document.getElementById('completed-adventures').textContent = completedAdventures;
}

function updateAdminStats(bookings, payments, messages, subscribers) {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => 
        b.fields['Booking Date'] === today
    ).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
        .filter(p => {
            const paymentDate = new Date(p.fields['Payment Date']);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear &&
                   p.fields.Status === 'Success';
        })
        .reduce((sum, p) => sum + (p.fields.Amount || 0), 0);
    
    const activeClients = new Set(bookings.map(b => b.fields.User?.[0])).size;
    
    const pendingMessages = messages.filter(m => 
        m.fields.Status === 'New' || m.fields.Status === 'In Progress'
    ).length;
    
    document.getElementById('today-bookings').textContent = todayBookings;
    document.getElementById('monthly-revenue').textContent = `$${monthlyRevenue.toFixed(2)}`;
    document.getElementById('active-clients').textContent = activeClients;
    document.getElementById('pending-messages').textContent = pendingMessages;
    document.getElementById('total-subscribers').textContent = subscribers.length;
}

function displayClientBookings(bookings) {
    const container = document.getElementById('bookings-list');
    container.innerHTML = '';
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    
    bookings.forEach(booking => {
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        
        const bookingDate = new Date(booking.fields['Booking Date']).toLocaleDateString();
        const status = booking.fields['Booking Status'];
        const paymentStatus = booking.fields['Payment Status'];
        
        bookingDiv.innerHTML = `
            <h3>${booking.fields['Booking Type']} Booking</h3>
            <p><strong>Date:</strong> ${bookingDate}</p>
            <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
            <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
            <p><strong>Amount:</strong> $${booking.fields['Total Amount']}</p>
            <p><strong>Status:</strong> <span class="booking-status status-${status.toLowerCase()}">${status}</span></p>
            <p><strong>Payment:</strong> <span class="payment-status status-${paymentStatus.toLowerCase()}">${paymentStatus}</span></p>
            ${booking.fields.Notes ? `<p><strong>Notes:</strong> ${booking.fields.Notes}</p>` : ''}
        `;
        
        container.appendChild(bookingDiv);
    });
}

function displayClientPayments(payments) {
    const container = document.getElementById('payments-list');
    container.innerHTML = '';
    
    if (payments.length === 0) {
        container.innerHTML = '<p>No payments found.</p>';
        return;
    }
    
    payments.forEach(payment => {
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'payment-item';
        
        const paymentDate = new Date(payment.fields['Payment Date']).toLocaleDateString();
        
        paymentDiv.innerHTML = `
            <p><strong>Amount:</strong> $${payment.fields.Amount}</p>
            <p><strong>Date:</strong> ${paymentDate}</p>
            <p><strong>Method:</strong> ${payment.fields['Payment Method']}</p>
            <p><strong>Status:</strong> <span class="payment-status status-${payment.fields.Status.toLowerCase()}">${payment.fields.Status}</span></p>
            ${payment.fields['Transaction ID'] ? `<p><strong>Transaction ID:</strong> ${payment.fields['Transaction ID']}</p>` : ''}
            ${payment.fields.Status === 'Success' ? `<button onclick="downloadReceipt('${payment.id}')" class="btn-download">Download Receipt</button>` : ''}
            ${payment.fields.Status === 'Success' ? `<button onclick="downloadReceipt('${payment.id}')" class="btn-download">Download Receipt</button>` : ''}
        `;
        
        container.appendChild(paymentDiv);
    });
}



function displayAdminBookings(bookings) {
    const container = document.getElementById('admin-bookings-list');
    container.innerHTML = '';
    
    bookings.forEach(booking => {
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        
        const bookingDate = new Date(booking.fields['Booking Date']).toLocaleDateString();
        
        bookingDiv.innerHTML = `
            <h3>${booking.fields['Booking Type']} Booking</h3>
            <p><strong>Date:</strong> ${bookingDate}</p>
            <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
            <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
            <p><strong>Amount:</strong> $${booking.fields['Total Amount']}</p>
            <p><strong>Status:</strong> <span class="booking-status status-${booking.fields['Booking Status'].toLowerCase()}">${booking.fields['Booking Status']}</span></p>
            <div class="action-buttons">
                <button class="btn-edit" onclick="editBooking('${booking.id}')">Edit</button>
            </div>
        `;
        
        container.appendChild(bookingDiv);
    });
}

function displayTours(tours) {
    const container = document.getElementById('tours-list');
    container.innerHTML = '';
    
    tours.forEach(tour => {
        const tourDiv = document.createElement('div');
        tourDiv.className = 'item-card';
        
        tourDiv.innerHTML = `
            <h3>${tour.fields['Tour Name']}</h3>
            <p>${tour.fields.Description}</p>
            <p><strong>Duration:</strong> ${tour.fields.Duration} hours</p>
            <p><strong>Price:</strong> $${tour.fields.Price}</p>
            <p><strong>Capacity:</strong> ${tour.fields['Max Capacity']} people</p>
            <p><strong>Type:</strong> ${tour.fields['Tour Type']}</p>
            <div class="action-buttons">
                <button class="btn-edit" onclick="editTour('${tour.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteTour('${tour.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(tourDiv);
    });
}

function displayRentals(rentals) {
    const container = document.getElementById('rentals-list');
    container.innerHTML = '';
    
    rentals.forEach(rental => {
        const rentalDiv = document.createElement('div');
        rentalDiv.className = 'item-card';
        
        rentalDiv.innerHTML = `
            <h3>${rental.fields['Equipment Name']}</h3>
            <p>${rental.fields.Description}</p>
            <p><strong>Category:</strong> ${rental.fields.Category}</p>
            <p><strong>Hourly Rate:</strong> $${rental.fields['Hourly Rate']}</p>
            <p><strong>Daily Rate:</strong> $${rental.fields['Daily Rate']}</p>
            <p><strong>Available:</strong> ${rental.fields['Quantity Available']}</p>
            <div class="action-buttons">
                <button class="btn-edit" onclick="editRental('${rental.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteRental('${rental.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(rentalDiv);
    });
}

function displayMessages(messages) {
    const container = document.getElementById('messages-list');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        
        const createdAt = new Date(message.fields['Created At']).toLocaleDateString();
        
        messageDiv.innerHTML = `
            <div class="message-priority priority-${message.fields.Priority.toLowerCase()}">${message.fields.Priority}</div>
            <h3>${message.fields['Message Type']}</h3>
            <p>${message.fields['Message Content']}</p>
            <p><strong>Date:</strong> ${createdAt}</p>
            <p><strong>Status:</strong> ${message.fields.Status}</p>
            <div class="action-buttons">
                <button class="btn-respond" onclick="respondToMessage('${message.id}')">Respond</button>
            </div>
        `;
        
        container.appendChild(messageDiv);
    });
}

function displayNewsletterSubscribers(subscribers) {
    const container = document.getElementById('subscribers-list');
    container.innerHTML = '';
    
    subscribers.forEach(subscriber => {
        const subscriberDiv = document.createElement('div');
        subscriberDiv.className = 'subscriber-item';
        
        const subscribedDate = new Date(subscriber.fields['Subscribed Date']).toLocaleDateString();
        
        subscriberDiv.innerHTML = `
            <p><strong>Name:</strong> ${subscriber.fields.Name}</p>
            <p><strong>Email:</strong> ${subscriber.fields.Email}</p>
            <p><strong>Subscribed:</strong> ${subscribedDate}</p>
            <p><strong>Status:</strong> ${subscriber.fields.Status}</p>
        `;
        
        container.appendChild(subscriberDiv);
    });
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked menu item
    event.target.classList.add('active');
}

// Profile functions
function loadProfileData() {
    document.getElementById('profile-name').value = currentUser.name;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-phone').value = currentUser.phone || '';
}

async function updateProfile(e) {
    e.preventDefault();
    
    const updatedData = {
        fullName: document.getElementById('profile-name').value,
        phone: document.getElementById('profile-phone').value
    };
    
    try {
        await api.updateUser(currentUser.id, updatedData);
        
        // Update current user data
        currentUser = { ...currentUser, ...updatedData };
        auth.setCurrentUser(currentUser);
        
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Error updating profile. Please try again.');
        console.error('Profile update error:', error);
    }
}

// Filter functions
function filterBookings() {
    // Implementation for filtering client bookings
    loadClientData();
}

function filterAdminBookings() {
    // Implementation for filtering admin bookings
    loadAdminData();
}

// Modal functions for tours and rentals
function openTourModal() {
    document.getElementById('tour-modal').style.display = 'block';
    document.getElementById('tour-form').reset();
    document.getElementById('tour-id').value = '';
}

function closeTourModal() {
    document.getElementById('tour-modal').style.display = 'none';
}

function openRentalModal() {
    document.getElementById('rental-modal').style.display = 'block';
    document.getElementById('rental-form').reset();
    document.getElementById('rental-id').value = '';
}

function closeRentalModal() {
    document.getElementById('rental-modal').style.display = 'none';
}

async function saveTour(e) {
    e.preventDefault();
    
    const tourData = {
        name: document.getElementById('tour-name').value,
        description: document.getElementById('tour-description').value,
        duration: parseInt(document.getElementById('tour-duration').value),
        price: parseFloat(document.getElementById('tour-price').value),
        capacity: parseInt(document.getElementById('tour-capacity').value),
        type: document.getElementById('tour-type').value
    };
    
    const tourId = document.getElementById('tour-id').value;
    
    try {
        if (tourId) {
            await airtable.updateTour(tourId, tourData);
        } else {
            await airtable.createTour(tourData);
        }
        
        closeTourModal();
        loadAdminData();
        alert('Tour saved successfully!');
    } catch (error) {
        alert('Error saving tour. Please try again.');
        console.error('Tour save error:', error);
    }
}

async function saveRental(e) {
    e.preventDefault();
    
    const rentalData = {
        name: document.getElementById('rental-name').value,
        category: document.getElementById('rental-category').value,
        description: document.getElementById('rental-description').value,
        hourlyRate: parseFloat(document.getElementById('rental-hourly-rate').value),
        dailyRate: parseFloat(document.getElementById('rental-daily-rate').value),
        quantity: parseInt(document.getElementById('rental-quantity').value)
    };
    
    const rentalId = document.getElementById('rental-id').value;
    
    try {
        if (rentalId) {
            await airtable.updateRental(rentalId, rentalData);
        } else {
            await airtable.createRental(rentalData);
        }
        
        closeRentalModal();
        loadAdminData();
        alert('Rental saved successfully!');
    } catch (error) {
        alert('Error saving rental. Please try again.');
        console.error('Rental save error:', error);
    }
}

// Edit functions
async function editTour(tourId) {
    // Load tour data and populate form
    // Implementation would fetch tour details and populate the modal
    openTourModal();
    document.getElementById('tour-id').value = tourId;
}

async function editRental(rentalId) {
    // Load rental data and populate form
    openRentalModal();
    document.getElementById('rental-id').value = rentalId;
}

async function deleteTour(tourId) {
    if (confirm('Are you sure you want to delete this tour?')) {
        try {
            await airtable.deleteTour(tourId);
            loadAdminData();
            alert('Tour deleted successfully!');
        } catch (error) {
            alert('Error deleting tour. Please try again.');
        }
    }
}

async function deleteRental(rentalId) {
    if (confirm('Are you sure you want to delete this rental?')) {
        try {
            await airtable.deleteRental(rentalId);
            loadAdminData();
            alert('Rental deleted successfully!');
        } catch (error) {
            alert('Error deleting rental. Please try again.');
        }
    }
}

function respondToMessage(messageId) {
    // Implementation for responding to messages
    alert('Message response functionality would be implemented here.');
}