// Payment Processing System
let stripe = null;
let paypalClientId = null;

// Initialize payment systems
document.addEventListener('DOMContentLoaded', async function() {
    // Get PayPal configuration
    try {
        const response = await fetch(`${API_BASE_URL}/payments/config/paypal`);
        const config = await response.json();
        paypalClientId = config.clientId;
        
        // Update PayPal SDK script
        const paypalScript = document.querySelector('script[src*="paypal.com/sdk"]');
        if (paypalScript && paypalClientId !== 'sb') {
            paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
        }
    } catch (error) {
        console.error('Failed to load PayPal config:', error);
    }
    
    // Initialize Stripe (use test key)
    stripe = Stripe('pk_test_51234567890abcdef');
});

// Show payment modal after booking
function showPaymentModal(bookingData) {
    const modal = document.createElement('div');
    modal.className = 'modal payment-modal';
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
                <div class="payment-option-section">
                    <div class="payment-option-header">
                        <svg width="100" height="25" viewBox="0 0 100 25" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4.917v15.166c0 .92-.747 1.667-1.667 1.667H1.667C.747 21.75 0 21.003 0 20.083V4.917C0 3.997.747 3.25 1.667 3.25h8.666C11.253 3.25 12 3.997 12 4.917z" fill="#003087"/>
                            <path d="M27.917 3.25h8.666c.92 0 1.667.747 1.667 1.667v15.166c0 .92-.747 1.667-1.667 1.667h-8.666c-.92 0-1.667-.747-1.667-1.667V4.917c0-.92.747-1.667 1.667-1.667z" fill="#009cde"/>
                            <text x="50" y="15" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#003087">PayPal</text>
                        </svg>
                        <p>Pay securely with your PayPal account</p>
                    </div>
                    <div id="paypal-button-container"></div>
                </div>
                
                <!-- Credit Card Form -->
                <div class="payment-divider">
                    <span>OR</span>
                </div>
                
                <div class="card-payment">
                    <div class="payment-option-header">
                        <div class="card-icons">
                            <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                                <rect width="30" height="20" rx="3" fill="#1434CB"/>
                                <text x="15" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">VISA</text>
                            </svg>
                            <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                                <rect width="30" height="20" rx="3" fill="#EB001B"/>
                                <circle cx="10" cy="10" r="6" fill="#FF5F00"/>
                                <circle cx="20" cy="10" r="6" fill="#F79E1B"/>
                            </svg>
                        </div>
                        <h5>Pay with Credit Card</h5>
                        <p>Secure payment with SSL encryption</p>
                    </div>
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
                
                <!-- Pay Later Option -->
                <div class="payment-divider">
                    <span>OR</span>
                </div>
                
                <div class="pay-later-option">
                    <div class="payment-option-header">
                        <div class="pay-later-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#FFC107"/>
                            </svg>
                        </div>
                        <h5>Book Now, Pay Later</h5>
                        <p>Reserve your booking and arrange payment details with our team</p>
                    </div>
                    <form id="pay-later-form">
                        <select id="payment-preference" required>
                            <option value="">Select preferred payment method</option>
                            <option value="cash">Cash on arrival</option>
                            <option value="bank-transfer">Bank transfer</option>
                            <option value="check">Check payment</option>
                            <option value="call-to-arrange">Call to arrange payment</option>
                        </select>
                        <textarea id="payment-notes" placeholder="Additional payment instructions or special arrangements" rows="3"></textarea>
                        <button type="submit" class="btn-pay-later">Book Now - Pay Later</button>
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
    initializePayLater(bookingData);
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
            onApprove: async function(data, actions) {
                try {
                    const details = await actions.order.capture();
                    
                    // Process payment through backend
                    const response = await fetch(`${API_BASE_URL}/payments/paypal/process`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            orderId: details.id,
                            payerId: details.payer.payer_id,
                            amount: bookingData.amount,
                            bookingData: bookingData
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        closePaymentModal();
                        showSuccessModal({
                            method: 'PayPal',
                            transactionId: details.id,
                            amount: bookingData.amount
                        });
                    } else {
                        throw new Error(result.error || 'Payment processing failed');
                    }
                    
                } catch (error) {
                    console.error('PayPal processing error:', error);
                    alert('Payment successful but booking failed. Please contact support.');
                }
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
        const submitBtn = document.querySelector('.btn-pay');
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        // For demo purposes, simulate successful payment
        // In production, you would send the token to your server for processing
        setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/payments/stripe/process`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        token: token.id,
                        amount: bookingData.amount,
                        bookingData: bookingData
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    closePaymentModal();
                    showSuccessModal({
                        method: 'Credit Card',
                        transactionId: result.payment.transactionId,
                        amount: bookingData.amount
                    });
                } else {
                    throw new Error(result.error || 'Payment processing failed');
                }
                
            } catch (error) {
                console.error('Stripe processing error:', error);
                alert('Payment failed. Please try again.');
                submitBtn.textContent = `Pay $${bookingData.amount}`;
                submitBtn.disabled = false;
            }
        }, 2000);
        
    } catch (error) {
        console.error('Stripe payment error:', error);
        alert('Payment failed. Please try again.');
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

// Initialize Pay Later option
function initializePayLater(bookingData) {
    const payLaterForm = document.getElementById('pay-later-form');
    if (payLaterForm) {
        payLaterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const paymentPreference = document.getElementById('payment-preference').value;
            const paymentNotes = document.getElementById('payment-notes').value;
            
            if (!paymentPreference) {
                alert('Please select a payment preference');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/payments/pay-later/process`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        bookingData: bookingData,
                        paymentPreference: paymentPreference,
                        paymentNotes: paymentNotes
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    closePaymentModal();
                    showPayLaterSuccessModal({
                        bookingId: result.booking.id,
                        paymentPreference: paymentPreference,
                        amount: bookingData.amount
                    });
                } else {
                    throw new Error(result.error || 'Booking failed');
                }
                
            } catch (error) {
                console.error('Pay later booking error:', error);
                alert('Booking failed. Please try again.');
            }
        });
    }
}

// Show pay later success modal
function showPayLaterSuccessModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'pay-later-success-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="success-content">
                <div class="success-icon">📅</div>
                <h3>Booking Confirmed!</h3>
                <p>Your booking has been reserved. Payment will be arranged as requested.</p>
                <div class="success-details">
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                    <p><strong>Amount:</strong> $${data.amount}</p>
                    <p><strong>Payment Method:</strong> ${data.paymentPreference}</p>
                    <p><strong>Status:</strong> Payment Pending</p>
                </div>
                <div class="pay-later-info">
                    <h4>Next Steps:</h4>
                    <p>Our team will contact you within 24 hours to confirm payment arrangements. You can also reach us at:</p>
                    <p><strong>Phone:</strong> (555) 123-4567</p>
                    <p><strong>Email:</strong> info@backyardadventures.com</p>
                </div>
                <div class="success-actions">
                    <button onclick="closePayLaterSuccessModal()" class="btn-primary">Continue</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closePayLaterSuccessModal() {
    const modal = document.getElementById('pay-later-success-modal');
    if (modal) {
        modal.remove();
    }
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