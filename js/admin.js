// Admin Dashboard JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = auth.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Staff')) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Set admin name
    document.getElementById('admin-name').textContent = `Welcome, ${currentUser.name}`;
    
    // Load initial data
    loadTours();
    loadRentals();
    loadBookings();
    loadNewsletter();
    loadStaff();
    loadAdminProfile();
    
    // Load analytics after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadAnalytics();
    }, 500);
    
    // Setup form handlers
    setupFormHandlers();
});

function setupFormHandlers() {
    // Tour form handler
    document.getElementById('tour-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveTour();
    });
    
    // Rental form handler
    document.getElementById('rental-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveRental();
    });
    
    // Newsletter form handler
    document.getElementById('newsletter-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await sendNewsletter();
    });
    
    // Staff form handler
    document.getElementById('staff-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveStaff();
    });
    
    // Admin profile form handler
    document.getElementById('admin-profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateAdminProfile();
    });
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked menu item
    event.target.classList.add('active');
}

// Tours Management
async function loadTours() {
    try {
        const response = await api.getTours();
        displayTours(response.tours);
    } catch (error) {
        console.error('Error loading tours:', error);
        alert('Error loading tours');
    }
}

async function displayTours(tours) {
    const container = document.getElementById('tours-list');
    container.innerHTML = '';
    
    for (const tour of tours) {
        const tourCard = document.createElement('div');
        tourCard.className = 'item-card';
        
        // Load images for this tour
        let imageHtml = '';
        try {
            const response = await api.getImages('tour', tour.id);
            if (response.images && response.images.length > 0) {
                imageHtml = `<img src="${response.images[0]}" alt="${tour.name}" style="width:100px;height:60px;object-fit:cover;margin-bottom:10px;">`;
            }
        } catch (error) {
            console.log('No images found for tour:', tour.name);
        }
        
        tourCard.innerHTML = `
            <div class="item-header">
                <h3 class="item-title">${tour.name}</h3>
                <span class="status-badge status-${tour.status.toLowerCase()}">${tour.status}</span>
            </div>
            ${imageHtml}
            <div class="item-details">
                <p><strong>Type:</strong> ${tour.tourType}</p>
                <p><strong>Duration:</strong> ${tour.duration} hours</p>
                <p><strong>Price:</strong> $${tour.price}</p>
                <p><strong>Max Capacity:</strong> ${tour.maxCapacity} people</p>
                <p><strong>Description:</strong> ${tour.description}</p>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editTour('${tour.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteTour('${tour.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(tourCard);
    }
}

function openTourModal(tourData = null) {
    const modal = document.getElementById('tour-modal');
    const form = document.getElementById('tour-form');
    const title = document.getElementById('tour-modal-title');
    
    form.reset();
    
    if (tourData) {
        title.textContent = 'Edit Tour';
        document.getElementById('tour-id').value = tourData.id;
        document.getElementById('tour-name').value = tourData.name;
        document.getElementById('tour-description').value = tourData.description;
        document.getElementById('tour-duration').value = tourData.duration;
        document.getElementById('tour-price').value = tourData.price;
        document.getElementById('tour-capacity').value = tourData.maxCapacity;
        document.getElementById('tour-type').value = tourData.tourType;
        document.getElementById('tour-dates').value = tourData.availableDates || '';
        document.getElementById('tour-status').value = tourData.status;
    } else {
        title.textContent = 'Add New Tour';
        document.getElementById('tour-id').value = '';
    }
    
    modal.style.display = 'block';
}

function closeTourModal() {
    document.getElementById('tour-modal').style.display = 'none';
}

async function saveTour() {
    const tourId = document.getElementById('tour-id').value;
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', document.getElementById('tour-name').value);
    formData.append('description', document.getElementById('tour-description').value);
    formData.append('duration', document.getElementById('tour-duration').value);
    formData.append('price', document.getElementById('tour-price').value);
    formData.append('maxCapacity', document.getElementById('tour-capacity').value);
    formData.append('tourType', document.getElementById('tour-type').value);
    formData.append('availableDates', document.getElementById('tour-dates').value);
    formData.append('status', document.getElementById('tour-status').value);
    
    // Add images
    const images = document.getElementById('tour-images').files;
    for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
    }
    
    try {
        if (tourId) {
            formData.append('id', tourId);
            await api.updateTour(tourId, formData);
            alert('Tour updated successfully!');
        } else {
            await api.createTour(formData);
            alert('Tour created successfully!');
        }
        
        closeTourModal();
        loadTours();
    } catch (error) {
        console.error('Error saving tour:', error);
        alert('Error saving tour: ' + error.message);
    }
}

async function editTour(tourId) {
    try {
        const response = await api.getTour(tourId);
        openTourModal(response.tour);
    } catch (error) {
        console.error('Error loading tour:', error);
        alert('Error loading tour details');
    }
}

async function deleteTour(tourId) {
    if (!confirm('Are you sure you want to delete this tour?')) {
        return;
    }
    
    try {
        await api.deleteTour(tourId);
        alert('Tour deleted successfully!');
        loadTours();
    } catch (error) {
        console.error('Error deleting tour:', error);
        alert('Error deleting tour');
    }
}

// Rentals Management
async function loadRentals() {
    try {
        const response = await api.getRentals();
        displayRentals(response.rentals);
    } catch (error) {
        console.error('Error loading rentals:', error);
        alert('Error loading rentals');
    }
}

async function displayRentals(rentals) {
    const container = document.getElementById('rentals-list');
    container.innerHTML = '';
    
    for (const rental of rentals) {
        const rentalCard = document.createElement('div');
        rentalCard.className = 'item-card';
        
        // Load images for this rental
        let imageHtml = '';
        try {
            const response = await api.getImages('rental', rental.id);
            if (response.images && response.images.length > 0) {
                imageHtml = `<img src="${response.images[0]}" alt="${rental.name}" style="width:100px;height:60px;object-fit:cover;margin-bottom:10px;">`;
            }
        } catch (error) {
            console.log('No images found for rental:', rental.name);
        }
        
        rentalCard.innerHTML = `
            <div class="item-header">
                <h3 class="item-title">${rental.name}</h3>
                <span class="status-badge status-${rental.status.toLowerCase()}">${rental.status}</span>
            </div>
            ${imageHtml}
            <div class="item-details">
                <p><strong>Category:</strong> ${rental.category}</p>
                <p><strong>Hourly Rate:</strong> $${rental.hourlyRate}</p>
                <p><strong>Daily Rate:</strong> $${rental.dailyRate}</p>
                <p><strong>Quantity:</strong> ${rental.quantityAvailable}</p>
                <p><strong>Description:</strong> ${rental.description}</p>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editRental('${rental.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteRental('${rental.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(rentalCard);
    }
}

function openRentalModal(rentalData = null) {
    const modal = document.getElementById('rental-modal');
    const form = document.getElementById('rental-form');
    const title = document.getElementById('rental-modal-title');
    
    form.reset();
    
    if (rentalData) {
        title.textContent = 'Edit Rental';
        document.getElementById('rental-id').value = rentalData.id;
        document.getElementById('rental-name').value = rentalData.name;
        document.getElementById('rental-category').value = rentalData.category;
        document.getElementById('rental-description').value = rentalData.description;
        document.getElementById('rental-hourly').value = rentalData.hourlyRate;
        document.getElementById('rental-daily').value = rentalData.dailyRate;
        document.getElementById('rental-quantity').value = rentalData.quantityAvailable;
        document.getElementById('rental-status').value = rentalData.status;
    } else {
        title.textContent = 'Add New Rental';
        document.getElementById('rental-id').value = '';
    }
    
    modal.style.display = 'block';
}

function closeRentalModal() {
    document.getElementById('rental-modal').style.display = 'none';
}

async function saveRental() {
    const rentalId = document.getElementById('rental-id').value;
    const formData = new FormData();
    
    // Add text fields
    formData.append('name', document.getElementById('rental-name').value);
    formData.append('category', document.getElementById('rental-category').value);
    formData.append('description', document.getElementById('rental-description').value);
    formData.append('hourlyRate', document.getElementById('rental-hourly').value);
    formData.append('dailyRate', document.getElementById('rental-daily').value);
    formData.append('quantityAvailable', document.getElementById('rental-quantity').value);
    formData.append('status', document.getElementById('rental-status').value);
    
    // Add images
    const images = document.getElementById('rental-images').files;
    for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
    }
    
    try {
        if (rentalId) {
            formData.append('id', rentalId);
            await api.updateRental(rentalId, formData);
            alert('Rental updated successfully!');
        } else {
            await api.createRental(formData);
            alert('Rental created successfully!');
        }
        
        closeRentalModal();
        loadRentals();
    } catch (error) {
        console.error('Error saving rental:', error);
        alert('Error saving rental: ' + error.message);
    }
}

async function editRental(rentalId) {
    try {
        const response = await api.getRental(rentalId);
        openRentalModal(response.rental);
    } catch (error) {
        console.error('Error loading rental:', error);
        alert('Error loading rental details');
    }
}

async function deleteRental(rentalId) {
    if (!confirm('Are you sure you want to delete this rental?')) {
        return;
    }
    
    try {
        await api.deleteRental(rentalId);
        alert('Rental deleted successfully!');
        loadRentals();
    } catch (error) {
        console.error('Error deleting rental:', error);
        alert('Error deleting rental');
    }
}

// Bookings Management
async function loadBookings() {
    try {
        const response = await api.getBookings();
        displayBookings(response.bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Error loading bookings');
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookings-list');
    container.innerHTML = '';
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    
    bookings.forEach(booking => {
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-card';
        
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
        
        bookingCard.innerHTML = `
            <div class="booking-header">
                <h3>${booking.bookingType} Booking</h3>
                <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
            <div class="booking-details">
                <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${bookingDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${booking.startTime} - ${booking.endTime}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">People</span>
                    <span class="detail-value">${booking.numberOfPeople}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value">$${booking.totalAmount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Payment Status</span>
                    <span class="detail-value">${booking.paymentStatus}</span>
                </div>
            </div>
        `;
        
        container.appendChild(bookingCard);
    });
}

// Analytics
async function loadAnalytics() {
    try {
        const [bookingsResponse, toursResponse, rentalsResponse] = await Promise.all([
            api.getBookings(),
            api.getTours(),
            api.getRentals()
        ]);
        
        const data = {
            bookings: bookingsResponse.bookings || [],
            tours: toursResponse.tours || [],
            payments: [] // Add payments when available
        };
        
        if (typeof initCharts === 'function') {
            initCharts(data);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        // Initialize with empty data if API fails
        if (typeof initCharts === 'function') {
            initCharts({ bookings: [], tours: [], payments: [] });
        }
    }
}

// Newsletter Management
async function loadNewsletter() {
    try {
        const response = await api.getNewsletterSubscribers();
        document.getElementById('total-subscribers').textContent = response.subscribers.length;
        displaySubscribers(response.subscribers);
    } catch (error) {
        console.error('Error loading newsletter data:', error);
    }
}

function displaySubscribers(subscribers) {
    const container = document.getElementById('subscribers-list');
    container.innerHTML = '';
    
    subscribers.forEach(subscriber => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-header">
                <h3>${subscriber.email}</h3>
                <span class="status-badge">${new Date(subscriber.subscribedAt).toLocaleDateString()}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function openNewsletterModal() {
    document.getElementById('newsletter-modal').style.display = 'block';
}

function closeNewsletterModal() {
    document.getElementById('newsletter-modal').style.display = 'none';
    document.getElementById('newsletter-form').reset();
}

async function sendNewsletter() {
    const subject = document.getElementById('newsletter-subject').value;
    const message = document.getElementById('newsletter-message').value;
    
    try {
        await api.sendNewsletter({ subject, message });
        alert('Newsletter sent successfully!');
        closeNewsletterModal();
    } catch (error) {
        console.error('Error sending newsletter:', error);
        alert('Error sending newsletter');
    }
}

// Staff Management
async function loadStaff() {
    try {
        const response = await api.getStaff();
        displayStaff(response.staff);
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function displayStaff(staff) {
    const container = document.getElementById('staff-list');
    container.innerHTML = '';
    
    staff.forEach(member => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-header">
                <h3>${member.name}</h3>
                <span class="status-badge">${member.role}</span>
            </div>
            <div class="item-details">
                <p><strong>Email:</strong> ${member.email}</p>
                <p><strong>Phone:</strong> ${member.phone}</p>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editStaff('${member.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteStaff('${member.id}')">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openStaffModal(staffData = null) {
    const modal = document.getElementById('staff-modal');
    const form = document.getElementById('staff-form');
    
    form.reset();
    
    if (staffData) {
        document.getElementById('staff-id').value = staffData.id;
        document.getElementById('staff-name').value = staffData.name;
        document.getElementById('staff-email').value = staffData.email;
        document.getElementById('staff-phone').value = staffData.phone;
        document.getElementById('staff-role').value = staffData.role;
        document.getElementById('staff-password').removeAttribute('required');
    } else {
        document.getElementById('staff-id').value = '';
        document.getElementById('staff-password').setAttribute('required', 'required');
    }
    
    modal.style.display = 'block';
}

function closeStaffModal() {
    document.getElementById('staff-modal').style.display = 'none';
}

async function saveStaff() {
    const staffId = document.getElementById('staff-id').value;
    const staffData = {
        name: document.getElementById('staff-name').value,
        email: document.getElementById('staff-email').value,
        phone: document.getElementById('staff-phone').value,
        role: document.getElementById('staff-role').value
    };
    
    const password = document.getElementById('staff-password').value;
    if (password) {
        staffData.password = password;
    }
    
    try {
        if (staffId) {
            await api.updateStaff(staffId, staffData);
            alert('Staff member updated successfully!');
        } else {
            await api.createStaff(staffData);
            alert('Staff member added successfully!');
        }
        
        closeStaffModal();
        loadStaff();
    } catch (error) {
        console.error('Error saving staff:', error);
        alert('Error saving staff member');
    }
}

async function editStaff(staffId) {
    try {
        const response = await api.getStaff(staffId);
        openStaffModal(response.staff);
    } catch (error) {
        console.error('Error loading staff:', error);
        alert('Error loading staff details');
    }
}

async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) {
        return;
    }
    
    try {
        await api.deleteStaff(staffId);
        alert('Staff member deleted successfully!');
        loadStaff();
    } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff member');
    }
}

// Admin Profile Management
async function loadAdminProfile() {
    try {
        document.getElementById('admin-name').value = currentUser.name;
        document.getElementById('admin-email').value = currentUser.email;
        document.getElementById('admin-phone').value = currentUser.phone || '';
    } catch (error) {
        console.error('Error loading admin profile:', error);
    }
}

async function updateAdminProfile() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    const profileData = {
        name: document.getElementById('admin-name').value,
        email: document.getElementById('admin-email').value,
        phone: document.getElementById('admin-phone').value
    };
    
    if (newPassword) {
        profileData.currentPassword = currentPassword;
        profileData.newPassword = newPassword;
    }
    
    try {
        await api.updateProfile(profileData);
        alert('Profile updated successfully!');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    }
}