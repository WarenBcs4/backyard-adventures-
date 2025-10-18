// Client Records Management - View bookings and payments from Airtable

async function loadUserBookings() {
    try {
        const response = await api.getBookings();
        const bookings = response.bookings || [];
        displayUserBookingsTable(bookings);
        updateBookingStats(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function displayUserBookingsTable(bookings) {
    const container = document.getElementById('bookings-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No bookings found.</p>
                <a href="#" onclick="showSection('available-resources')" class="btn-book">Book Your First Adventure!</a>
            </div>
        `;
        return;
    }
    
    // Filter bookings based on selected filter
    const filter = document.getElementById('booking-filter')?.value || 'all';
    const filteredBookings = filterBookings(bookings, filter);
    
    filteredBookings.forEach(booking => {
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-item';
        
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
        const paymentStatus = booking.paymentStatus || 'Pending';
        const bookingStatus = booking.status || 'Confirmed';
        const amount = booking.totalAmount || 0;
        
        bookingCard.innerHTML = `
            <div class="booking-header">
                <h3>${booking.bookingType} Booking</h3>
                <div class="status-badges">
                    <span class="booking-status status-${bookingStatus.toLowerCase()}">${bookingStatus}</span>
                    <span class="payment-status status-${paymentStatus.toLowerCase()}">${paymentStatus}</span>
                </div>
            </div>
            
            <div class="booking-details">
                <div class="detail-row">
                    <span><strong>Date:</strong> ${bookingDate}</span>
                    <span><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</span>
                </div>
                <div class="detail-row">
                    <span><strong>People:</strong> ${booking.numberOfPeople}</span>
                    <span><strong>Amount:</strong> $${amount}</span>
                </div>
                ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>
            
            <div class="booking-actions">
                ${paymentStatus === 'Pending' ? `
                    <button onclick="payForExistingBooking('${booking.id}', ${amount})" class="btn-pay">
                        Pay Now - $${amount}
                    </button>
                ` : ''}
                
                ${paymentStatus === 'Paid' ? `
                    <button onclick="downloadBookingReceipt('${booking.id}')" class="btn-download">
                        Download Receipt
                    </button>
                ` : ''}
                
                ${bookingStatus === 'Confirmed' && paymentStatus === 'Paid' ? `
                    <button onclick="cancelBooking('${booking.id}')" class="btn-cancel">
                        Cancel Booking
                    </button>
                ` : ''}
                
                <button onclick="viewBookingDetails('${booking.id}')" class="btn-view">
                    View Details
                </button>
            </div>
        `;
        
        container.appendChild(bookingCard);
    });
}

function filterBookings(bookings, filter) {
    const now = new Date();
    
    switch (filter) {
        case 'upcoming':
            return bookings.filter(b => 
                new Date(b.bookingDate) >= now && 
                b.status === 'Confirmed'
            );
        case 'completed':
            return bookings.filter(b => b.status === 'Completed');
        case 'cancelled':
            return bookings.filter(b => b.status === 'Cancelled');
        case 'paid':
            return bookings.filter(b => b.paymentStatus === 'Paid');
        case 'unpaid':
            return bookings.filter(b => b.paymentStatus === 'Pending');
        default:
            return bookings;
    }
}

async function loadUserPayments() {
    try {
        const response = await api.getPayments();
        displayUserPaymentsTable(response.payments || []);
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function displayUserPaymentsTable(payments) {
    const container = document.getElementById('payments-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (payments.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No payments found.</p></div>';
        return;
    }
    
    payments.forEach(payment => {
        const paymentCard = document.createElement('div');
        paymentCard.className = 'payment-item';
        
        const paymentDate = new Date(payment.fields['Payment Date'] || payment.fields['Created At']).toLocaleDateString();
        const status = payment.fields.Status || 'Pending';
        const amount = payment.fields.Amount || 0;
        
        paymentCard.innerHTML = `
            <div class="payment-header">
                <h4>Payment #${payment.fields['Transaction ID']}</h4>
                <span class="payment-status status-${status.toLowerCase()}">${status}</span>
            </div>
            
            <div class="payment-details">
                <div class="detail-row">
                    <span><strong>Amount:</strong> $${amount}</span>
                    <span><strong>Date:</strong> ${paymentDate}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Method:</strong> ${payment.fields['Payment Method']}</span>
                    <span><strong>Status:</strong> ${status}</span>
                </div>
            </div>
            
            <div class="payment-actions">
                ${status === 'Success' ? `
                    <button onclick="downloadPaymentReceipt('${payment.id}', '${payment.fields['Transaction ID']}')" class="btn-download">
                        Download Receipt
                    </button>
                ` : ''}
                
                <button onclick="viewPaymentDetails('${payment.id}')" class="btn-view">
                    View Details
                </button>
            </div>
        `;
        
        container.appendChild(paymentCard);
    });
}

function updateBookingStats(bookings) {
    const now = new Date();
    
    // Calculate stats
    const upcomingBookings = bookings.filter(b => 
        new Date(b.bookingDate) >= now && 
        b.status === 'Confirmed'
    ).length;
    
    const completedAdventures = bookings.filter(b => 
        b.status === 'Completed'
    ).length;
    
    const totalSpent = bookings
        .filter(b => b.paymentStatus === 'Paid')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Update dashboard stats
    const upcomingEl = document.getElementById('upcoming-bookings');
    const completedEl = document.getElementById('completed-adventures');
    const spentEl = document.getElementById('total-spent');
    
    if (upcomingEl) upcomingEl.textContent = upcomingBookings;
    if (completedEl) completedEl.textContent = completedAdventures;
    if (spentEl) spentEl.textContent = `$${totalSpent.toFixed(2)}`;
}

function downloadBookingReceipt(bookingId) {
    downloadPaymentReceipt(bookingId, `BOOKING-${bookingId}`);
}

function downloadPaymentReceipt(paymentId, transactionId) {
    const receiptContent = `
BACKYARD ADVENTURES
Payment Receipt

Receipt ID: ${transactionId}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Customer Information:
Name: ${currentUser.fields['Full Name']}
Email: ${currentUser.fields.Email}
Phone: ${currentUser.fields.Phone || 'N/A'}

Payment Details:
Transaction ID: ${transactionId}
Payment ID: ${paymentId}
Status: Completed

Thank you for choosing Backyard Adventures!

For questions or support:
Email: info@backyardadventures.com
Phone: (555) 123-4567

Visit us again for more amazing water adventures!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BackyardAdventures-Receipt-${transactionId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }
    
    try {
        await api.cancelBooking(bookingId);
        
        alert('Booking cancelled successfully.');
        loadUserBookings();
        
    } catch (error) {
        alert('Error cancelling booking. Please try again.');
        console.error('Cancel booking error:', error);
    }
}

function viewBookingDetails(bookingId) {
    alert('Booking details view would open here with full booking information.');
}

function viewPaymentDetails(paymentId) {
    alert('Payment details view would open here with full payment information.');
}

// Filter event listener
document.addEventListener('DOMContentLoaded', function() {
    const bookingFilter = document.getElementById('booking-filter');
    if (bookingFilter) {
        bookingFilter.addEventListener('change', function() {
            loadUserBookings();
        });
    }
});

// Initialize when user is logged in
document.addEventListener('DOMContentLoaded', function() {
    if (auth.isAuthenticated() && currentUser && currentUser.role === 'Client') {
        loadUserBookings();
        loadUserPayments();
    }
});