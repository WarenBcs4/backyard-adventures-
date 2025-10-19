// Payment Processing System
let stripe = null;
let paypalButtons = null;

// Initialize payment systems
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (use test key)
    stripe = Stripe('pk_test_51234567890abcdef'); // Replace with your Stripe publishable key
});

// Show payment modal after booking
function showPaymentModal(bookingData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'payment-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePaymentModal()">&times;</span>
            <h3>Complete Your Payment</h3>
            
            <div class="booking-summary">
                <h4>Booking Summary</h4>
                <p><strong>Service:</strong> ${bookingData.service}</p>
                <p><strong>Date:</strong> ${bookingData.date}</p>
                <p><strong>Time:</strong> ${bookingData.time}</p>
                <p><strong>People:</strong> ${bookingData.people}</p>
                <p><strong>Total Amount:</strong> $${bookingData.amount}</p>
            </div>
            
            <div class="payment-methods">
                <h4>Choose Payment Method</h4>
                
                <!-- PayPal Button -->
                <div id="paypal-button-container"></div>
                
                <!-- Credit Card Form -->
                <div class="payment-divider">
                    <span>OR</span>
                </div>
                
                <div class="card-payment">
                    <h5>Pay with Credit Card</h5>
                    <form id="card-form">
                        <div class="form-group">
                            <label>Card Number</label>
                            <div id="card-number"></div>
                        </div>
                        <div class="payment-form-row">
                            <div class="form-group">
                                <label>Expiry Date</label>
                                <div id="card-expiry"></div>
                            </div>
                            <div class="form-group">
                                <label>CVC</label>
                                <div id="card-cvc"></div>
                            </div>
                        </div>
                        <button type="submit" class="btn-pay">Pay $${bookingData.amount}</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Initialize payment methods
    initializePayPal(bookingData);
    initializeStripe(bookingData);
}

// Initialize PayPal
function initializePayPal(bookingData) {
    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: bookingData.amount.toString()
                        },
                        description: `${bookingData.service} - ${bookingData.date}`
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    processPaymentSuccess({
                        method: 'PayPal',
                        transactionId: details.id,
                        amount: bookingData.amount,
                        bookingData: bookingData
                    });
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                alert('Payment failed. Please try again.');
            }
        }).render('#paypal-button-container');
    }
}

// Initialize Stripe
function initializeStripe(bookingData) {
    if (stripe) {
        const elements = stripe.elements();
        
        // Create card elements
        const cardNumber = elements.create('cardNumber');
        const cardExpiry = elements.create('cardExpiry');
        const cardCvc = elements.create('cardCvc');
        
        // Mount elements
        cardNumber.mount('#card-number');
        cardExpiry.mount('#card-expiry');
        cardCvc.mount('#card-cvc');
        
        // Handle form submission
        const form = document.getElementById('card-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const {token, error} = await stripe.createToken(cardNumber);
            
            if (error) {
                alert('Card validation error: ' + error.message);
            } else {
                processStripePayment(token, bookingData);
            }
        });
    }
}

// Process Stripe payment
async function processStripePayment(token, bookingData) {
    try {
        // In a real app, send token to your server
        // For demo, simulate successful payment
        setTimeout(() => {
            processPaymentSuccess({
                method: 'Credit Card',
                transactionId: 'stripe_' + Date.now(),
                amount: bookingData.amount,
                bookingData: bookingData
            });
        }, 2000);
        
        // Show processing
        const submitBtn = document.querySelector('.btn-pay');
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
    } catch (error) {
        console.error('Stripe payment error:', error);
        alert('Payment failed. Please try again.');
    }
}

// Process successful payment
async function processPaymentSuccess(paymentData) {
    try {
        // Create booking record
        const bookingResponse = await api.createBooking({
            type: paymentData.bookingData.type,
            service: paymentData.bookingData.service,
            date: paymentData.bookingData.date,
            time: paymentData.bookingData.time,
            people: paymentData.bookingData.people,
            amount: paymentData.amount,
            notes: paymentData.bookingData.notes || ''
        });
        
        // Create payment record
        await api.createPayment({
            bookingId: bookingResponse.booking.id,
            amount: paymentData.amount,
            method: paymentData.method,
            transactionId: paymentData.transactionId,
            status: 'Success'
        });
        
        // Show success message
        closePaymentModal();
        showSuccessModal(paymentData);
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Payment successful but booking failed. Please contact support.');
    }
}

// Show success modal
function showSuccessModal(paymentData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'success-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="success-content">
                <div class="success-icon">✅</div>
                <h3>Payment Successful!</h3>
                <p>Your booking has been confirmed.</p>
                <div class="success-details">
                    <p><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>
                    <p><strong>Amount:</strong> $${paymentData.amount}</p>
                    <p><strong>Payment Method:</strong> ${paymentData.method}</p>
                </div>
                <div class="success-actions">
                    <button onclick="closeSuccessModal()" class="btn-primary">Continue</button>
                    <button onclick="downloadReceipt('${paymentData.transactionId}')" class="btn-secondary">Download Receipt</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Close modals
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.remove();
    }
}

// Download receipt
function downloadReceipt(transactionId) {
    // Generate simple receipt
    const receiptContent = `
        BACKYARD ADVENTURES
        Receipt #${transactionId}
        
        Thank you for your booking!
        
        For support, contact:
        Phone: (555) 123-4567
        Email: info@backyardadventures.com
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${transactionId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Update booking form to trigger payment
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const serviceSelect = document.getElementById('service-select');
            if (!serviceSelect || !serviceSelect.value) {
                alert('Please select a service first.');
                return;
            }
            
            const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
            const bookingData = {
                type: document.getElementById('booking-type').value,
                service: selectedOption.text,
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                people: document.getElementById('booking-people').value,
                amount: parseFloat(selectedOption.dataset.price) * parseInt(document.getElementById('booking-people').value),
                notes: document.getElementById('booking-notes').value
            };
            
            closeBookingModal();
            showPaymentModal(bookingData);
        });
    }
});