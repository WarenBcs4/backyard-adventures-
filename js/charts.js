// Charts and Analytics functionality using Chart.js
let revenueChart, bookingTypesChart, clientFlowChart, engagementChart;

function loadCharts(bookings, payments) {
    // Only load charts if we're on the analytics section and user is admin
    if (!auth.isAdmin()) return;
    
    loadRevenueChart(payments);
    loadBookingTypesChart(bookings);
    loadClientFlowChart(bookings);
    loadEngagementChart(bookings, payments);
}

function loadRevenueChart(payments) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;
    
    // Process payment data for monthly revenue
    const monthlyRevenue = processMonthlyRevenue(payments);
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                label: 'Monthly Revenue',
                data: monthlyRevenue.data,
                borderColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function loadBookingTypesChart(bookings) {
    const ctx = document.getElementById('booking-types-chart');
    if (!ctx) return;
    
    // Process booking types data
    const bookingTypes = processBookingTypes(bookings);
    
    if (bookingTypesChart) {
        bookingTypesChart.destroy();
    }
    
    bookingTypesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: bookingTypes.labels,
            datasets: [{
                data: bookingTypes.data,
                backgroundColor: [
                    '#333333',
                    '#666666',
                    '#999999',
                    '#cccccc'
                ],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function loadClientFlowChart(bookings) {
    const ctx = document.getElementById('client-flow-chart');
    if (!ctx) return;
    
    // Process daily client flow data
    const clientFlow = processDailyClientFlow(bookings);
    
    if (clientFlowChart) {
        clientFlowChart.destroy();
    }
    
    clientFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: clientFlow.labels,
            datasets: [{
                label: 'Daily Bookings',
                data: clientFlow.data,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function loadEngagementChart(bookings, payments) {
    const ctx = document.getElementById('engagement-chart');
    if (!ctx) return;
    
    // Process customer engagement data
    const engagement = processCustomerEngagement(bookings, payments);
    
    if (engagementChart) {
        engagementChart.destroy();
    }
    
    engagementChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: engagement.labels,
            datasets: [{
                data: engagement.data,
                backgroundColor: [
                    '#000000',
                    '#333333',
                    '#666666',
                    '#999999'
                ],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Data processing functions
function processMonthlyRevenue(payments) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentDate = new Date();
    const labels = [];
    const data = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        labels.push(monthNames[date.getMonth()]);
        
        // Calculate revenue for this month
        const monthRevenue = payments
            .filter(payment => {
                if (!payment.fields['Payment Date'] || payment.fields.Status !== 'Success') return false;
                const paymentDate = new Date(payment.fields['Payment Date']);
                return paymentDate.getMonth() === date.getMonth() && 
                       paymentDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, payment) => sum + (payment.fields.Amount || 0), 0);
        
        data.push(monthRevenue);
    }
    
    return { labels, data };
}

function processBookingTypes(bookings) {
    const types = {};
    
    bookings.forEach(booking => {
        const type = booking.fields['Booking Type'] || 'Unknown';
        types[type] = (types[type] || 0) + 1;
    });
    
    return {
        labels: Object.keys(types),
        data: Object.values(types)
    };
}

function processDailyClientFlow(bookings) {
    const labels = [];
    const data = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Count bookings for this day
        const dayBookings = bookings.filter(booking => 
            booking.fields['Booking Date'] === dateString
        ).length;
        
        data.push(dayBookings);
    }
    
    return { labels, data };
}

function processCustomerEngagement(bookings, payments) {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.fields['Booking Status'] === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.fields['Booking Status'] === 'Cancelled').length;
    const upcomingBookings = bookings.filter(b => {
        const bookingDate = new Date(b.fields['Booking Date']);
        return bookingDate >= new Date() && b.fields['Booking Status'] === 'Confirmed';
    }).length;
    
    return {
        labels: ['Completed', 'Upcoming', 'Cancelled', 'Other'],
        data: [
            completedBookings,
            upcomingBookings,
            cancelledBookings,
            totalBookings - completedBookings - upcomingBookings - cancelledBookings
        ]
    };
}

// Utility function to update charts when data changes
function updateCharts() {
    if (auth.isAdmin()) {
        // Reload data and update charts
        loadDashboardData();
    }
}

// Export functions for use in other modules
window.loadCharts = loadCharts;
window.updateCharts = updateCharts;