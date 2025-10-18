// PayPal Integration for Backyard Adventures
const PAYPAL_CONFIG = {
    clientId: ENV_CONFIG.PAYPAL_CLIENT_ID,
    currency: 'USD',
    environment: 'sandbox' // Change to 'production' for live payments
};

class PayPalService {
    constructor() {
        this.isLoaded = false;
        this.loadPayPalSDK();
    }

    loadPayPalSDK() {
        if (document.getElementById('paypal-sdk')) {
            this.isLoaded = true;
            return;
        }

        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}`;
        script.onload = () => {
            this.isLoaded = true;
            console.log('PayPal SDK loaded successfully');
        };
        script.onerror = () => {
            console.error('Failed to load PayPal SDK');
        };
        
        document.head.appendChild(script);
    }

    async createPayment(bookingData) {
        if (!this.isLoaded) {
            throw new Error('PayPal SDK not loaded');
        }

        return new Promise((resolve, reject) => {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: bookingData.amount.toFixed(2),
                                currency_code: PAYPAL_CONFIG.currency
                            },
                            description: this.getPaymentDescription(bookingData)
                        }]
                    });
                },
                
                onApprove: async (data, actions) => {
                    try {
                        const order = await actions.order.capture();
                        const paymentResult = await this.handlePaymentSuccess(order, bookingData);
                        resolve(paymentResult);
                    } catch (error) {
                        console.error('Payment capture failed:', error);
                        reject(error);
                    }
                },
                
                onError: (err) => {
                    console.error('PayPal payment error:', err);
                    reject(err);
                },
                
                onCancel: (data) => {
                    console.log('Payment cancelled:', data);
                    reject(new Error('Payment cancelled by user'));
                }
            }).render('#paypal-button-container');
        });
    }

    getPaymentDescription(bookingData) {
        const type = bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1);
        const date = new Date(bookingData.date).toLocaleDateString();
        return `Backyard Adventures - ${type} Booking for ${date}`;
    }

    async handlePaymentSuccess(order, bookingData) {
        try {
            // Extract payment details from PayPal order
            const transaction = order.purchase_units[0].payments.captures[0];
            
            // Create payment record in Airtable
            const paymentData = {
                bookingId: bookingData.bookingId,
                userId: bookingData.userId,
                amount: parseFloat(transaction.amount.value),
                method: 'PayPal',
                transactionId: transaction.id,
                status: 'Success',
                receiptUrl: '', // PayPal doesn't provide direct receipt URL
                notes: `PayPal Order ID: ${order.id}`
            };

            const paymentResult = await airtable.createPayment(paymentData);

            // Update booking payment status
            await airtable.updateBooking(bookingData.bookingId, {
                'Payment Status': 'Paid'
            });

            return {
                success: true,
                paymentId: paymentResult.records[0].id,
                transactionId: transaction.id,
                orderId: order.id
            };

        } catch (error) {
            console.error('Error processing payment success:', error);
            throw error;
        }
    }

    // Create a payment page for a specific booking
    async createPaymentPage(bookingId) {
        try {
            // Get booking details
            const bookings = await airtable.getBookings();
            const booking = bookings.find(b => b.id === bookingId);
            
            if (!booking) {
                throw new Error('Booking not found');
            }

            const currentUser = auth.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const paymentData = {
                bookingId: bookingId,
                userId: currentUser.id,
                amount: booking.fields['Total Amount'],
                type: booking.fields['Booking Type'],
                date: booking.fields['Booking Date']
            };

            // Create PayPal payment
            return await this.createPayment(paymentData);

        } catch (error) {
            console.error('Error creating payment page:', error);
            throw error;
        }
    }

    // Process refund (admin only)
    async processRefund(paymentId, amount, reason) {
        try {
            // Get payment details
            const payments = await airtable.getPayments();
            const payment = payments.find(p => p.id === paymentId);
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            const transactionId = payment.fields['Transaction ID'];
            
            // Note: Actual PayPal refund API call would go here
            // For demo purposes, we'll just update the payment status
            
            await airtable.updatePayment(paymentId, {
                'Status': 'Refunded',
                'Notes': `${payment.fields.Notes || ''}\nRefund: $${amount} - ${reason}`
            });

            // Update related booking
            if (payment.fields.Booking && payment.fields.Booking[0]) {
                await airtable.updateBooking(payment.fields.Booking[0], {
                    'Payment Status': 'Refunded',
                    'Booking Status': 'Cancelled'
                });
            }

            return {
                success: true,
                refundAmount: amount,
                reason: reason
            };

        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    }
}

// Global PayPal service instance
const paypalService = new PayPalService();

// Payment page functionality
function createPaymentPage(bookingId) {
    const paymentContainer = document.createElement('div');
    paymentContainer.innerHTML = `
        <div class="payment-page">
            <h2>Complete Your Payment</h2>
            <div id="payment-details"></div>
            <div id="paypal-button-container"></div>
            <div id="payment-status"></div>
        </div>
    `;
    
    document.body.appendChild(paymentContainer);
    
    // Load booking details and create payment
    loadBookingForPayment(bookingId);
}

async function loadBookingForPayment(bookingId) {
    try {
        const bookings = await airtable.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Display booking details
        const detailsContainer = document.getElementById('payment-details');
        const bookingDate = new Date(booking.fields['Booking Date']).toLocaleDateString();
        
        detailsContainer.innerHTML = `
            <div class="booking-summary">
                <h3>Booking Summary</h3>
                <p><strong>Type:</strong> ${booking.fields['Booking Type']}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Time:</strong> ${booking.fields['Start Time']} - ${booking.fields['End Time']}</p>
                <p><strong>People:</strong> ${booking.fields['Number of People']}</p>
                <p><strong>Total Amount:</strong> $${booking.fields['Total Amount']}</p>
            </div>
        `;

        // Create PayPal payment
        const currentUser = auth.getCurrentUser();
        const paymentData = {
            bookingId: bookingId,
            userId: currentUser.id,
            amount: booking.fields['Total Amount'],
            type: booking.fields['Booking Type'],
            date: booking.fields['Booking Date']
        };

        await paypalService.createPayment(paymentData);

    } catch (error) {
        console.error('Error loading booking for payment:', error);
        document.getElementById('payment-status').innerHTML = 
            `<div class="error">Error loading payment: ${error.message}</div>`;
    }
}

// Quick payment function for immediate bookings
async function processQuickPayment(bookingData) {
    try {
        // First create the booking
        const bookingResult = await airtable.createBooking(bookingData);
        const newBookingId = bookingResult.records[0].id;
        
        // Then process payment
        const paymentData = {
            ...bookingData,
            bookingId: newBookingId
        };
        
        const paymentResult = await paypalService.createPayment(paymentData);
        
        return {
            success: true,
            bookingId: newBookingId,
            paymentResult: paymentResult
        };
        
    } catch (error) {
        console.error('Error processing quick payment:', error);
        throw error;
    }
}

// Admin refund function
async function initiateRefund(paymentId) {
    if (!auth.isAdmin()) {
        alert('Access denied. Admin privileges required.');
        return;
    }
    
    const amount = prompt('Enter refund amount:');
    const reason = prompt('Enter refund reason:');
    
    if (!amount || !reason) {
        return;
    }
    
    try {
        const result = await paypalService.processRefund(paymentId, parseFloat(amount), reason);
        
        if (result.success) {
            alert(`Refund of $${result.refundAmount} processed successfully.`);
            // Refresh the page or update the UI
            location.reload();
        }
    } catch (error) {
        alert(`Error processing refund: ${error.message}`);
    }
}

// Export functions for global use
window.paypalService = paypalService;
window.createPaymentPage = createPaymentPage;
window.processQuickPayment = processQuickPayment;
window.initiateRefund = initiateRefund;