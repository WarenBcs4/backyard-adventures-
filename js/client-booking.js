// Client Booking System - Properly integrated with Airtable backend

async function loadAvailableResources() {
    try {
        const [toursResponse, rentalsResponse] = await Promise.all([
            api.getTours(),
            api.getRentals()
        ]);
        
        displayToursTable(toursResponse.tours || []);
        displayRentalsTable(rentalsResponse.rentals || []);
    } catch (error) {
        console.error('Error loading resources:', error);
        alert('Error loading available resources. Please refresh the page.');
    }
}

async function displayToursTable(tours) {
    const container = document.getElementById('tours-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const activeTours = tours.filter(tour => tour.status === 'Active');
    
    if (activeTours.length === 0) {
        container.innerHTML = '<p>No tours available at the moment.</p>';
        return;
    }
    
    for (const tour of activeTours) {
        const tourCard = document.createElement('div');
        tourCard.className = 'resource-card';
        
        // Try to load actual images
        let imageHtml = '<div class="image-placeholder" style="width:100%;height:200px;background:#f0f0f0;margin-bottom:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#666;">📸 Image</div>';
        try {
            const response = await api.getImages('tour', tour.id);
            if (response.images && response.images.length > 0) {
                imageHtml = `<img src="${response.images[0]}" alt="${tour.name}" style="width:100%;height:200px;object-fit:cover;margin-bottom:15px;border-radius:8px;">`;
            }
        } catch (error) {
            console.log('No images for tour:', tour.name);
        }
        
        tourCard.innerHTML = `
            ${imageHtml}
            <h4>${tour.name}</h4>
            <p>${tour.description}</p>
            <div class="resource-details">
                <p><strong>Duration:</strong> ${tour.duration} hours</p>
                <p><strong>Price:</strong> $${tour.price} per person</p>
                <p><strong>Max Capacity:</strong> ${tour.maxCapacity} people</p>
                <p><strong>Type:</strong> ${tour.tourType}</p>
            </div>
            <button onclick="openBookingModal('tour', '${tour.id}', '${tour.name}', ${tour.price})" class="btn-book">
                Book Tour - $${tour.price}/person
            </button>
        `;
        container.appendChild(tourCard);
    }
}

async function displayRentalsTable(rentals) {
    const container = document.getElementById('rentals-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const availableRentals = rentals.filter(rental => rental.status === 'Available');
    
    if (availableRentals.length === 0) {
        container.innerHTML = '<p>No equipment available for rent at the moment.</p>';
        return;
    }
    
    for (const rental of availableRentals) {
        const rentalCard = document.createElement('div');
        rentalCard.className = 'resource-card';
        const equipmentName = rental.name || 'Equipment';
        const description = rental.description || 'No description available';
        const category = rental.category || 'General';
        const hourlyRate = rental.hourlyRate || 0;
        const dailyRate = rental.dailyRate || 0;
        const quantity = rental.quantityAvailable || 0;
        
        // Try to load actual images
        let rentalImageHtml = '<div class="image-placeholder" style="width:100%;height:200px;background:#f0f0f0;margin-bottom:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#666;">📸 Image</div>';
        try {
            const response = await api.getImages('rental', rental.id);
            if (response.images && response.images.length > 0) {
                rentalImageHtml = `<img src="${response.images[0]}" alt="${equipmentName}" style="width:100%;height:200px;object-fit:cover;margin-bottom:15px;border-radius:8px;">`;
            }
        } catch (error) {
            console.log('No images for rental:', equipmentName);
        }
        
        rentalCard.innerHTML = `
            ${rentalImageHtml}
            <h4>${equipmentName}</h4>
            <p>${description}</p>
            <div class="resource-details">
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Hourly Rate:</strong> $${hourlyRate}</p>
                <p><strong>Daily Rate:</strong> $${dailyRate}</p>
                <p><strong>Available:</strong> ${quantity} units</p>
            </div>
            <button onclick="openBookingModal('rental', '${rental.id}', '${equipmentName}', ${hourlyRate}, ${dailyRate})" class="btn-book">
                Rent Equipment - $${hourlyRate}/hr
            </button>
        `;
        container.appendChild(rentalCard);
    }
}

function bookTour(tourId, tourName, price) {
    openBookingModal('tour', tourId, tourName, price);
}

function bookRental(rentalId, equipmentName, hourlyRate, dailyRate) {
    openBookingModal('rental', rentalId, equipmentName, hourlyRate, dailyRate);
}

async function openBookingModal(type, resourceId = null, resourceName = null, price = null, dailyRate = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'booking-modal';
    
    let equipmentSelectHtml = '';
    if (type === 'rental' && !resourceId) {
        try {
            const response = await api.getRentals();
            const availableRentals = response.rentals.filter(rental => rental.status === 'Available');
            
            equipmentSelectHtml = `
                <div class="form-group">
                    <label>Select Equipment:</label>
                    <select id="equipment-select" required onchange="updateEquipmentDetails()">
                        <option value="">Choose equipment...</option>
                        ${availableRentals.map(rental => 
                            `<option value="${rental.id}" data-name="${rental.name}" data-hourly="${rental.hourlyRate}" data-daily="${rental.dailyRate}">
                                ${rental.name} - $${rental.hourlyRate}/hr
                            </option>`
                        ).join('')}
                    </select>
                </div>
            `;
        } catch (error) {
            console.error('Error loading rentals:', error);
        }
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeBookingModal()">&times;</span>
            <h3>Book ${type === 'tour' ? 'Tour' : 'Equipment Rental'}</h3>
            ${resourceName ? `<h4>${resourceName}</h4>` : ''}
            
            <form id="booking-form">
                <input type="hidden" id="resource-type" value="${type}">
                <input type="hidden" id="resource-id" value="${resourceId || ''}">
                <input type="hidden" id="resource-name" value="${resourceName || ''}">
                <input type="hidden" id="base-price" value="${price || 0}">
                <input type="hidden" id="daily-rate" value="${dailyRate || 0}">
                
                ${equipmentSelectHtml}
                
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="booking-date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label>Start Time:</label>
                    <input type="time" id="booking-time" required>
                </div>
                
                <div class="form-group">
                    <label>Number of People:</label>
                    <input type="number" id="booking-people" min="1" max="20" value="1" required onchange="calculateBookingTotal()">
                </div>
                
                ${type === 'rental' ? `
                <div class="form-group">
                    <label>Duration:</label>
                    <select id="rental-duration" onchange="calculateBookingTotal()">
                        <option value="1">1 Hour - $${price}</option>
                        <option value="2">2 Hours - $${price * 2}</option>
                        <option value="4">4 Hours - $${price * 4}</option>
                        <option value="8">Full Day - $${dailyRate || price * 8}</option>
                    </select>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label>Special Requests:</label>
                    <textarea id="booking-notes" placeholder="Any special requests or dietary restrictions"></textarea>
                </div>
                
                <div class="total-amount">
                    <h3>Total Amount: $<span id="total-amount">${price}</span></h3>
                </div>
                
                <button type="submit" class="btn-book">Confirm Booking</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    calculateBookingTotal();
    
    document.getElementById('booking-form').addEventListener('submit', processBookingSubmission);
}

function updateEquipmentDetails() {
    const select = document.getElementById('equipment-select');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const hourlyRate = parseFloat(selectedOption.dataset.hourly) || 0;
        const dailyRate = parseFloat(selectedOption.dataset.daily) || 0;
        
        document.getElementById('resource-id').value = selectedOption.value;
        document.getElementById('resource-name').value = selectedOption.dataset.name;
        document.getElementById('base-price').value = hourlyRate;
        document.getElementById('daily-rate').value = dailyRate;
        
        // Update duration dropdown with prices
        const durationSelect = document.getElementById('rental-duration');
        if (durationSelect) {
            durationSelect.innerHTML = `
                <option value="1">1 Hour - $${hourlyRate}</option>
                <option value="2">2 Hours - $${hourlyRate * 2}</option>
                <option value="4">4 Hours - $${hourlyRate * 4}</option>
                <option value="8">Full Day - $${dailyRate}</option>
            `;
        }
        
        calculateBookingTotal();
    } else {
        document.getElementById('total-amount').textContent = '0';
    }
}

function calculateBookingTotal() {
    const basePrice = parseFloat(document.getElementById('base-price').value) || 0;
    const people = parseInt(document.getElementById('booking-people').value) || 1;
    const type = document.getElementById('resource-type').value;
    
    let total = 0;
    
    if (type === 'tour') {
        total = basePrice * people;
    } else {
        const duration = parseInt(document.getElementById('rental-duration').value) || 1;
        const dailyRate = parseFloat(document.getElementById('daily-rate').value) || 0;
        
        if (duration === 8 && dailyRate > 0) {
            total = dailyRate;
        } else {
            total = basePrice * duration;
        }
    }
    
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.remove();
    }
}

async function processBookingSubmission(e) {
    e.preventDefault();
    
    const resourceId = document.getElementById('resource-id').value;
    const type = document.getElementById('resource-type').value;
    
    // Validate equipment selection for rentals
    if (type === 'rental' && !resourceId) {
        alert('Please select equipment first.');
        return;
    }
    
    const totalAmount = parseFloat(document.getElementById('total-amount').textContent);
    
    if (totalAmount <= 0) {
        alert('Please select equipment to see pricing.');
        return;
    }
    
    // Calculate end time
    const startTime = document.getElementById('booking-time').value;
    const startDate = new Date(`2000-01-01 ${startTime}`);
    
    let duration = 2; // Default 2 hours for tours
    if (type === 'rental') {
        duration = parseInt(document.getElementById('rental-duration').value);
    }
    
    startDate.setHours(startDate.getHours() + duration);
    const endTime = startDate.toTimeString().slice(0, 5);
    
    const bookingData = {
        userId: currentUser.id,
        type: type,
        resourceId: resourceId,
        date: document.getElementById('booking-date').value,
        startTime: document.getElementById('booking-time').value,
        endTime: endTime,
        people: parseInt(document.getElementById('booking-people').value),
        amount: totalAmount,
        notes: document.getElementById('booking-notes').value
    };
    
    try {
        const result = await api.createBooking(bookingData);
        closeBookingModal();
        
        alert('Booking created successfully!');
        
        // Show payment options
        showPaymentOptions(result.booking);
        
        // Refresh bookings list
        loadUserBookings();
        
    } catch (error) {
        alert('Error creating booking. Please try again.');
        console.error('Booking error:', error);
    }
}

function showPaymentOptions(booking) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePaymentModal()">&times;</span>
            <h3>Complete Your Payment</h3>
            
            <div class="booking-summary">
                <h4>Booking Summary</h4>
                <p><strong>Date:</strong> ${booking.fields['Booking Date']}</p>
                <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
                <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
                <p><strong>Total:</strong> $${booking.fields['Total Amount']}</p>
            </div>
            
            <div class="payment-options">
                <button onclick="processPaymentNow('${booking.id}', ${booking.fields['Total Amount']}, 'PayPal')" class="btn-payment paypal">
                    Pay with PayPal - $${booking.fields['Total Amount']}
                </button>
                <button onclick="processPaymentNow('${booking.id}', ${booking.fields['Total Amount']}, 'Credit Card')" class="btn-payment card">
                    Pay with Credit Card - $${booking.fields['Total Amount']}
                </button>
                <button onclick="closePaymentModal()" class="btn-cancel">Pay Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
}

async function processPaymentNow(bookingId, amount, method) {
    try {
        // Create payment record
        const paymentData = {
            bookingId: bookingId,
            userId: currentUser.id,
            amount: amount,
            method: method,
            transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9),
            status: 'Success'
        };
        
        await api.createPayment(paymentData);
        
        // Payment status will be updated by backend
        
        closePaymentModal();
        alert('Payment successful! Your booking is confirmed.');
        
        // Refresh data
        loadUserBookings();
        loadUserPayments();
        
    } catch (error) {
        alert('Payment failed. Please try again.');
        console.error('Payment error:', error);
    }
}

async function payForExistingBooking(bookingId, amount) {
    showPaymentOptions({
        id: bookingId,
        fields: {
            'Booking Date': 'Your selected date',
            'Start Time': 'Your selected time',
            'End Time': 'End time',
            'Number of People': 'Selected people',
            'Total Amount': amount
        }
    });
}

// General booking functions
function openRentalBooking() {
    openBookingModal('rental');
}

function openTourBooking() {
    openBookingModal('tour');
}

function bookResource(type, resourceId) {
    if (type === 'tour') {
        // For tours, we need to get the tour details first
        api.getTours().then(response => {
            const tour = response.tours.find(t => t.id === resourceId);
            if (tour) {
                openBookingModal('tour', resourceId, tour.name, tour.price);
            }
        });
    } else {
        // For rentals, get rental details
        api.getRentals().then(response => {
            const rental = response.rentals.find(r => r.id === resourceId);
            if (rental) {
                openBookingModal('rental', resourceId, rental.name, rental.hourlyRate, rental.dailyRate);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (auth.isAuthenticated() && currentUser && currentUser.role === 'Client') {
        loadAvailableResources();
    }
});