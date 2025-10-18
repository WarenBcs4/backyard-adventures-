// Enhanced Client Dashboard Functionality

async function loadAvailableResources() {
    try {
        const [tours, rentals] = await Promise.all([
            airtable.getTours(),
            airtable.getRentals()
        ]);
        
        displayTours(tours);
        displayRentals(rentals);
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

function displayTours(tours) {
    const container = document.getElementById('tours-grid');
    container.innerHTML = '';
    
    tours.filter(tour => tour.fields.Status === 'Active').forEach(tour => {
        const tourCard = document.createElement('div');
        tourCard.className = 'resource-card';
        tourCard.innerHTML = `
            <h4>${tour.fields['Tour Name']}</h4>
            <p>${tour.fields.Description}</p>
            <div class="resource-details">
                <p><strong>Duration:</strong> ${tour.fields.Duration} hours</p>
                <p><strong>Price:</strong> $${tour.fields.Price} per person</p>
                <p><strong>Max Capacity:</strong> ${tour.fields['Max Capacity']} people</p>
                <p><strong>Type:</strong> ${tour.fields['Tour Type']}</p>
            </div>
            <button onclick="openBookingModal('tour', '${tour.id}', ${tour.fields.Price})" class="btn-book">Book Tour - $${tour.fields.Price}</button>
        `;
        container.appendChild(tourCard);
    });
}

function displayRentals(rentals) {
    const container = document.getElementById('rentals-grid');
    container.innerHTML = '';
    
    rentals.filter(rental => rental.fields.Status === 'Available').forEach(rental => {
        const rentalCard = document.createElement('div');
        rentalCard.className = 'resource-card';
        rentalCard.innerHTML = `
            <h4>${rental.fields['Equipment Name']}</h4>
            <p>${rental.fields.Description}</p>
            <div class="resource-details">
                <p><strong>Category:</strong> ${rental.fields.Category}</p>
                <p><strong>Hourly Rate:</strong> $${rental.fields['Hourly Rate']}</p>
                <p><strong>Daily Rate:</strong> $${rental.fields['Daily Rate']}</p>
                <p><strong>Available:</strong> ${rental.fields['Quantity Available']} units</p>
            </div>
            <button onclick="openBookingModal('rental', '${rental.id}', ${rental.fields['Hourly Rate']})" class="btn-book">Rent Equipment - $${rental.fields['Hourly Rate']}/hr</button>
        `;
        container.appendChild(rentalCard);
    });
}

function openBookingModal(type, resourceId, price) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeBookingModal()">&times;</span>
            <h3>Book ${type === 'tour' ? 'Tour' : 'Equipment Rental'}</h3>
            <form id="booking-form">
                <input type="hidden" id="resource-type" value="${type}">
                <input type="hidden" id="resource-id" value="${resourceId}">
                <input type="hidden" id="base-price" value="${price}">
                
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="booking-date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label>Time:</label>
                    <input type="time" id="booking-time" required>
                </div>
                
                <div class="form-group">
                    <label>Number of People:</label>
                    <input type="number" id="booking-people" min="1" max="20" value="1" required onchange="calculateTotal()">
                </div>
                
                ${type === 'rental' ? `
                <div class="form-group">
                    <label>Duration:</label>
                    <select id="rental-duration" onchange="calculateTotal()">
                        <option value="1">1 Hour</option>
                        <option value="2">2 Hours</option>
                        <option value="4">4 Hours</option>
                        <option value="8">Full Day (8 Hours)</option>
                    </select>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label>Special Requests:</label>
                    <textarea id="booking-notes" placeholder="Any special requests or notes"></textarea>
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
    
    calculateTotal();
    
    document.getElementById('booking-form').addEventListener('submit', processBooking);
}

function calculateTotal() {
    const basePrice = parseFloat(document.getElementById('base-price').value);
    const people = parseInt(document.getElementById('booking-people').value) || 1;
    const type = document.getElementById('resource-type').value;
    
    let total = basePrice;
    
    if (type === 'tour') {
        total = basePrice * people;
    } else {
        const duration = parseInt(document.getElementById('rental-duration').value) || 1;
        total = basePrice * duration;
    }
    
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.remove();
    }
}

async function processBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const totalAmount = parseFloat(document.getElementById('total-amount').textContent);
    
    const bookingData = {
        userId: currentUser.id,
        type: document.getElementById('resource-type').value,
        resourceId: document.getElementById('resource-id').value,
        date: document.getElementById('booking-date').value,
        startTime: document.getElementById('booking-time').value,
        people: parseInt(document.getElementById('booking-people').value),
        amount: totalAmount,
        notes: document.getElementById('booking-notes').value
    };
    
    // Calculate end time
    const startTime = new Date(`2000-01-01 ${bookingData.startTime}`);
    if (bookingData.type === 'rental') {
        const duration = parseInt(document.getElementById('rental-duration').value);
        startTime.setHours(startTime.getHours() + duration);
    } else {
        startTime.setHours(startTime.getHours() + 2); // Default 2 hours for tours
    }
    bookingData.endTime = startTime.toTimeString().slice(0, 5);
    
    try {
        const result = await airtable.createBooking(bookingData);
        closeBookingModal();
        
        // Show payment modal
        openPaymentModal(result.records[0]);
        
    } catch (error) {
        alert('Error creating booking. Please try again.');
        console.error('Booking error:', error);
    }
}

function openPaymentModal(booking) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePaymentModal()">&times;</span>
            <h3>Complete Payment</h3>
            <div class="booking-summary">
                <h4>Booking Summary</h4>
                <p><strong>Date:</strong> ${booking.fields['Booking Date']}</p>
                <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
                <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
                <p><strong>Total Amount:</strong> $${booking.fields['Total Amount']}</p>
            </div>
            
            <div class="payment-methods">
                <h4>Payment Method</h4>
                <button onclick="processPayment('${booking.id}', ${booking.fields['Total Amount']}, 'PayPal')" class="btn-payment paypal">
                    Pay with PayPal - $${booking.fields['Total Amount']}
                </button>
                <button onclick="processPayment('${booking.id}', ${booking.fields['Total Amount']}, 'Credit Card')" class="btn-payment card">
                    Pay with Credit Card - $${booking.fields['Total Amount']}
                </button>
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

async function processPayment(bookingId, amount, method) {
    try {
        // Simulate payment processing
        const paymentData = {
            bookingId: bookingId,
            userId: currentUser.id,
            amount: amount,
            method: method,
            transactionId: 'TXN' + Date.now(),
            status: 'Success'
        };
        
        await airtable.createPayment(paymentData);
        
        // Update booking payment status
        await airtable.updateBooking(bookingId, {
            'Payment Status': 'Paid'
        });
        
        closePaymentModal();
        alert('Payment successful! Your booking is confirmed.');
        
        // Refresh dashboard data
        loadClientData();
        
    } catch (error) {
        alert('Payment failed. Please try again.');
        console.error('Payment error:', error);
    }
}

async function loadUserBookings() {
    try {
        const bookings = await airtable.getBookings(currentUser.id);
        displayUserBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function displayUserBookings(bookings) {
    const container = document.getElementById('bookings-list');
    container.innerHTML = '';
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>No bookings found. <a href="#" onclick="showSection(\'available-resources\')">Book your first adventure!</a></p>';
        return;
    }
    
    bookings.forEach(booking => {
        const bookingDiv = document.createElement('div');
        bookingDiv.className = 'booking-item';
        
        const bookingDate = new Date(booking.fields['Booking Date']).toLocaleDateString();
        const paymentStatus = booking.fields['Payment Status'] || 'Pending';
        const bookingStatus = booking.fields['Booking Status'] || 'Confirmed';
        
        bookingDiv.innerHTML = `
            <div class="booking-header">
                <h3>${booking.fields['Booking Type']} Booking</h3>
                <span class="booking-status status-${bookingStatus.toLowerCase()}">${bookingStatus}</span>
            </div>
            <div class="booking-details">
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
                <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
                <p><strong>Amount:</strong> $${booking.fields['Total Amount']}</p>
                <p><strong>Payment:</strong> <span class="payment-status status-${paymentStatus.toLowerCase()}">${paymentStatus}</span></p>
                ${booking.fields.Notes ? `<p><strong>Notes:</strong> ${booking.fields.Notes}</p>` : ''}
            </div>
            <div class="booking-actions">
                ${paymentStatus === 'Pending' ? `<button onclick="payForBooking('${booking.id}', ${booking.fields['Total Amount']})" class="btn-pay">Pay Now - $${booking.fields['Total Amount']}</button>` : ''}
                ${paymentStatus === 'Paid' ? `<button onclick="downloadReceipt('${booking.id}')" class="btn-download">Download Receipt</button>` : ''}
                ${bookingStatus === 'Confirmed' && paymentStatus === 'Paid' ? `<button onclick="cancelBooking('${booking.id}')" class="btn-cancel">Cancel Booking</button>` : ''}
            </div>
        `;
        
        container.appendChild(bookingDiv);
    });
}

async function payForBooking(bookingId, amount) {
    openPaymentModal({
        id: bookingId,
        fields: {
            'Booking Date': 'Selected Date',
            'Start Time': 'Selected Time',
            'End Time': 'End Time',
            'Number of People': 'Selected People',
            'Total Amount': amount
        }
    });
}

async function loadUserPayments() {
    try {
        const payments = await airtable.getPayments(currentUser.id);
        displayUserPayments(payments);
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function displayUserPayments(payments) {
    const container = document.getElementById('payments-list');
    container.innerHTML = '';
    
    if (payments.length === 0) {
        container.innerHTML = '<p>No payments found.</p>';
        return;
    }
    
    payments.forEach(payment => {
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'payment-item';
        
        const paymentDate = new Date(payment.fields['Payment Date'] || payment.fields['Created At']).toLocaleDateString();
        
        paymentDiv.innerHTML = `
            <div class="payment-header">
                <h4>Payment #${payment.fields['Transaction ID']}</h4>
                <span class="payment-status status-${payment.fields.Status.toLowerCase()}">${payment.fields.Status}</span>
            </div>
            <div class="payment-details">
                <p><strong>Amount:</strong> $${payment.fields.Amount}</p>
                <p><strong>Date:</strong> ${paymentDate}</p>
                <p><strong>Method:</strong> ${payment.fields['Payment Method']}</p>
            </div>
            <div class="payment-actions">
                ${payment.fields.Status === 'Success' ? `<button onclick="downloadReceipt('${payment.id}')" class="btn-download">Download Receipt</button>` : ''}
            </div>
        `;
        
        container.appendChild(paymentDiv);
    });
}

function downloadReceipt(paymentId) {
    const receiptContent = `
BACKYARD ADVENTURES
Payment Receipt

Receipt ID: ${paymentId}
Date: ${new Date().toLocaleDateString()}
Customer: ${currentUser.fields['Full Name']}
Email: ${currentUser.fields.Email}

Thank you for choosing Backyard Adventures!
For support, contact us at info@backyardadventures.com
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentId}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize client dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (auth.isLoggedIn() && !auth.isAdmin()) {
        loadAvailableResources();
        loadUserBookings();
        loadUserPayments();
    }
});