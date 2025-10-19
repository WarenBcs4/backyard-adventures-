// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

// Service card animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate cards on scroll
document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.service-card');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    // Set initial state for animations
    [...serviceCards, ...galleryItems].forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
});

// Newsletter subscription
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('newsletter-email').value;
        const name = document.getElementById('newsletter-name').value;
        
        try {
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            await api.subscribeNewsletter({ email, name });
            
            alert('Thank you for subscribing to our newsletter!');
            newsletterForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        } catch (error) {
            alert('Error subscribing to newsletter. Please try again.');
        }
    });
}

// Contact form
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

// Chat functionality
let chatOpen = false;

function openChat() {
    const chatModal = document.getElementById('chat-modal');
    chatModal.style.display = 'block';
    chatOpen = true;
}

function closeChat() {
    const chatModal = document.getElementById('chat-modal');
    chatModal.style.display = 'none';
    chatOpen = false;
}

function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add message to chat
    addMessageToChat('You', message, 'user');
    chatInput.value = '';
    
    // Auto-response
    setTimeout(() => {
        addMessageToChat('Support', 'Thank you for your message. A team member will respond shortly.', 'support');
    }, 1000);
}

function addMessageToChat(sender, message, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Booking functionality
let currentBookingType = '';

function openBookingModal(type) {
    currentBookingType = type;
    const modal = document.getElementById('booking-modal');
    const title = document.getElementById('booking-title');
    const typeInput = document.getElementById('booking-type');
    
    title.textContent = `Book ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    typeInput.value = type;
    
    loadServiceOptions(type);
    modal.style.display = 'block';
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.style.display = 'none';
}

function loadServiceOptions(type) {
    const serviceOptions = document.getElementById('service-options');
    serviceOptions.innerHTML = '';
    
    const select = document.createElement('select');
    select.id = 'service-select';
    select.required = true;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Select ${type}`;
    select.appendChild(defaultOption);
    
    // Sample options based on type
    const options = {
        tour: [
            { value: 'scenic', text: 'Scenic Bay Tour - $89', price: 89 },
            { value: 'sunset', text: 'Sunset Cruise - $129', price: 129 },
            { value: 'wildlife', text: 'Wildlife Watching - $149', price: 149 }
        ],
        rental: [
            { value: 'kayak', text: 'Kayak Rental - $35/hour', price: 35 },
            { value: 'jetski', text: 'Jet Ski - $85/hour', price: 85 },
            { value: 'boat', text: 'Motorboat - $150/hour', price: 150 }
        ],
        training: [
            { value: 'beginner', text: 'Beginner Course - $199', price: 199 },
            { value: 'intermediate', text: 'Intermediate Course - $299', price: 299 },
            { value: 'advanced', text: 'Advanced Course - $399', price: 399 }
        ]
    };
    
    options[type].forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        optionElement.dataset.price = option.price;
        select.appendChild(optionElement);
    });
    
    serviceOptions.appendChild(select);
}

// Booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const serviceSelect = document.getElementById('service-select');
            const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
            const price = selectedOption.dataset.price;
            const people = document.getElementById('booking-people').value;
            const totalAmount = price * people;
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert(`Booking confirmed!\nTotal: $${totalAmount}\nRedirecting to payment...`);
                closeBookingModal();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const chatModal = document.getElementById('chat-modal');
    const bookingModal = document.getElementById('booking-modal');
    
    if (event.target === chatModal) {
        closeChat();
    }
    
    if (event.target === bookingModal) {
        closeBookingModal();
    }
});

// Chat input enter key
document.addEventListener('keypress', function(e) {
    if (e.target.id === 'chat-input' && e.key === 'Enter') {
        sendMessage();
    }
});

// Add hover effects to service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
        this.style.borderColor = '#1E88E5';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.borderColor = '#e0e0e0';
    });
});

// Gallery item hover effects
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Mobile menu functionality
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (navMenu && menuBtn) {
        navMenu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    }
}

// Close menu when clicking on any link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const navMenu = document.getElementById('nav-menu');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            if (navMenu && menuBtn) {
                navMenu.classList.remove('active');
                menuBtn.classList.remove('active');
            }
        });
    });
});

console.log('Backyard Adventures website loaded successfully!');