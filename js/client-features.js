// Enhanced client features for booking, payments, and messaging

function bookResource(type, resourceId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeBookingModal()">&times;</span>
            <h3>Book ${type === 'tour' ? 'Tour' : 'Equipment'}</h3>
            <form id="booking-form">
                <input type="hidden" id="resource-type" value="${type}">
                <input type="hidden" id="resource-id" value="${resourceId}">
                <input type="date" id="booking-date" required>
                <input type="time" id="booking-time" required>
                <input type="number" id="booking-people" placeholder="Number of people" min="1" required>
                ${type === 'rental' ? '<select id="rental-duration"><option value="hourly">Hourly</option><option value="daily">Daily</option></select>' : ''}
                <textarea id="booking-notes" placeholder="Special requests or notes"></textarea>
                <button type="submit">Book Now</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('booking-form').addEventListener('submit', processBooking);
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.remove();
    }
}

async function processBooking(e) {
    e.preventDefault();
    
    const bookingData = {
        userId: currentUser.id,
        type: document.getElementById('resource-type').value,
        resourceId: document.getElementById('resource-id').value,
        date: document.getElementById('booking-date').value,
        startTime: document.getElementById('booking-time').value,
        people: parseInt(document.getElementById('booking-people').value),
        notes: document.getElementById('booking-notes').value
    };
    
    try {
        const result = await airtable.createBooking(bookingData);
        closeBookingModal();
        alert('Booking created successfully! Redirecting to payment...');
        
        const paymentResult = await processPayment(result.records[0]);
        if (paymentResult.success) {
            loadClientData();
        }
    } catch (error) {
        alert('Error creating booking. Please try again.');
        console.error('Booking error:', error);
    }
}

async function processPayment(booking) {
    const paymentData = {
        bookingId: booking.id,
        userId: currentUser.id,
        amount: booking.fields['Total Amount'],
        method: 'PayPal',
        transactionId: 'TXN' + Date.now(),
        status: 'Success'
    };
    
    try {
        await airtable.createPayment(paymentData);
        return { success: true };
    } catch (error) {
        console.error('Payment error:', error);
        return { success: false };
    }
}

function downloadReceipt(paymentId) {
    const receiptContent = `
        BACKYARD ADVENTURES
        Payment Receipt
        
        Payment ID: ${paymentId}
        Date: ${new Date().toLocaleDateString()}
        Customer: ${currentUser.fields['Full Name']}
        
        Thank you for your business!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function sendMessage() {
    const messageContent = prompt('Enter your message:');
    if (messageContent) {
        const messageData = {
            userId: currentUser.id,
            content: messageContent,
            type: 'Support',
            priority: 'Medium'
        };
        
        airtable.createMessage(messageData).then(() => {
            alert('Message sent successfully!');
        }).catch(() => {
            alert('Error sending message. Please try again.');
        });
    }
}

function displayAvailableResources(tours, rentals) {
    let resourcesSection = document.getElementById('available-resources');
    if (!resourcesSection) {
        resourcesSection = document.createElement('div');
        resourcesSection.id = 'available-resources';
        resourcesSection.innerHTML = '<h2>Available for Booking</h2>';
        document.getElementById('client-overview').appendChild(resourcesSection);
    }
    
    const container = document.createElement('div');
    container.className = 'resources-grid';
    
    const toursContainer = document.createElement('div');
    toursContainer.innerHTML = '<h3>Tours & Training</h3>';
    tours.filter(tour => tour.fields.Status === 'Active').forEach(tour => {
        const tourDiv = document.createElement('div');
        tourDiv.className = 'resource-card';
        tourDiv.innerHTML = `
            <h4>${tour.fields['Tour Name']}</h4>
            <p>${tour.fields.Description}</p>
            <p><strong>Duration:</strong> ${tour.fields.Duration} hours</p>
            <p><strong>Price:</strong> $${tour.fields.Price} per person</p>
            <p><strong>Max Capacity:</strong> ${tour.fields['Max Capacity']} people</p>
            <button onclick="bookResource('tour', '${tour.id}')" class="btn-book">Book Now</button>
        `;
        toursContainer.appendChild(tourDiv);
    });
    
    const rentalsContainer = document.createElement('div');
    rentalsContainer.innerHTML = '<h3>Equipment Rentals</h3>';
    rentals.filter(rental => rental.fields.Status === 'Available').forEach(rental => {
        const rentalDiv = document.createElement('div');
        rentalDiv.className = 'resource-card';
        rentalDiv.innerHTML = `
            <h4>${rental.fields['Equipment Name']}</h4>
            <p>${rental.fields.Description}</p>
            <p><strong>Category:</strong> ${rental.fields.Category}</p>
            <p><strong>Hourly Rate:</strong> $${rental.fields['Hourly Rate']}</p>
            <p><strong>Daily Rate:</strong> $${rental.fields['Daily Rate']}</p>
            <p><strong>Available:</strong> ${rental.fields['Quantity Available']} units</p>
            <button onclick="bookResource('rental', '${rental.id}')" class="btn-book">Rent Now</button>
        `;
        rentalsContainer.appendChild(rentalDiv);
    });
    
    container.appendChild(toursContainer);
    container.appendChild(rentalsContainer);
    resourcesSection.appendChild(container);
}