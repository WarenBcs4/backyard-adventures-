// Environment Configuration for Vercel deployment
// Add these as environment variables in Vercel dashboard

const ENV_CONFIG = {
    AIRTABLE_TOKEN: process.env.AIRTABLE_TOKEN || '',
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || '',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || ''
};

// Make available globally
if (typeof window !== 'undefined') {
    window.ENV_CONFIG = ENV_CONFIG;
}