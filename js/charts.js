// Charts and Analytics functionality using Chart.js
let bookingTypesChart, paymentStatusChart, tourCategoriesChart, monthlyRevenueChart;

function initCharts(data) {
    loadBookingTypesChart(data.bookings || []);
    loadPaymentStatusChart(data.payments || []);
    loadTourCategoriesChart(data.tours || []);
    loadMonthlyRevenueChart(data.payments || []);
}

function loadMonthlyRevenueChart(payments) {
    const ctx = document.getElementById('monthly-revenue-chart');
    if (!ctx) return;
    
    const monthlyRevenue = processMonthlyRevenue(payments);
    
    if (monthlyRevenueChart) {
        monthlyRevenueChart.destroy();
    }
    
    monthlyRevenueChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                data: monthlyRevenue.data,
                backgroundColor: ['#ff6b35', '#90EE90', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFB6C1'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
}

function loadBookingTypesChart(bookings) {
    const ctx = document.getElementById('booking-types-chart');
    if (!ctx) return;
    
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
                backgroundColor: ['#ff6b35', '#90EE90', '#87CEEB', '#DDA0DD'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
}

function loadPaymentStatusChart(payments) {
    const ctx = document.getElementById('payment-status-chart');
    if (!ctx) return;
    
    const paymentStatus = processPaymentStatus(payments);
    
    if (paymentStatusChart) {
        paymentStatusChart.destroy();
    }
    
    paymentStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: paymentStatus.labels,
            datasets: [{
                data: paymentStatus.data,
                backgroundColor: ['#90EE90', '#ff6b35', '#87CEEB'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
}

function loadTourCategoriesChart(tours) {
    const ctx = document.getElementById('tour-categories-chart');
    if (!ctx) return;
    
    const tourCategories = processTourCategories(tours);
    
    if (tourCategoriesChart) {
        tourCategoriesChart.destroy();
    }
    
    tourCategoriesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: tourCategories.labels,
            datasets: [{
                data: tourCategories.data,
                backgroundColor: ['#ff6b35', '#90EE90', '#87CEEB', '#DDA0DD', '#F0E68C'],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
}



// Data processing functions
function processMonthlyRevenue(payments) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentDate = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        labels.push(monthNames[date.getMonth()] || monthNames[i]);
        
        const monthRevenue = payments
            .filter(payment => {
                const paymentDate = payment.paymentDate || payment.fields?.['Payment Date'];
                const status = payment.status || payment.fields?.Status;
                if (!paymentDate || status !== 'Success') return false;
                const pDate = new Date(paymentDate);
                return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, payment) => sum + (payment.amount || payment.fields?.Amount || 0), 0);
        
        data.push(monthRevenue);
    }
    
    return { labels, data };
}

function processBookingTypes(bookings) {
    const types = {};
    
    bookings.forEach(booking => {
        const type = booking.bookingType || booking.fields?.['Booking Type'] || 'Unknown';
        types[type] = (types[type] || 0) + 1;
    });
    
    return {
        labels: Object.keys(types),
        data: Object.values(types)
    };
}

function processPaymentStatus(payments) {
    const status = {};
    
    payments.forEach(payment => {
        const paymentStatus = payment.status || payment.fields?.Status || 'Unknown';
        status[paymentStatus] = (status[paymentStatus] || 0) + 1;
    });
    
    return {
        labels: Object.keys(status),
        data: Object.values(status)
    };
}

function processTourCategories(tours) {
    const categories = {};
    
    tours.forEach(tour => {
        const category = tour.tourType || tour.fields?.['Tour Type'] || 'General';
        categories[category] = (categories[category] || 0) + 1;
    });
    
    return {
        labels: Object.keys(categories),
        data: Object.values(categories)
    };
}



// Export functions for use in other modules
window.initCharts = initCharts;