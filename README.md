# Adobe Cloud File Manager

A secure file management system with authentication and session management.

## Environment Variables Setup

To fix the "Server configuration error", you need to set up the following environment variables in your Netlify dashboard:

### Required Environment Variables:

1. **TELEGRAM_BOT_TOKEN** - Your Telegram bot token
2. **TELEGRAM_CHAT_ID** - Your Telegram chat ID  
3. **UPSTASH_REDIS_REST_URL** - Your Upstash Redis REST URL
4. **UPSTASH_REDIS_REST_TOKEN** - Your Upstash Redis REST token

### How to Set Environment Variables in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** for each required variable
5. Add the variable name and value
6. Click **Save**
7. Redeploy your site

### Getting the Required Values:

#### Telegram Bot Setup:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token (TELEGRAM_BOT_TOKEN)
4. Add your bot to a chat/channel
5. Get the chat ID using: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

#### Upstash Redis Setup:
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and REST TOKEN from the database details

### Example Environment Variables:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

## Local Development

For local development, create a `.env` file in your project root:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

## Deployment

After setting up environment variables:

1. Push your changes to GitHub
2. Netlify will automatically redeploy
3. Test the authentication functionality

## Troubleshooting

- **Server configuration error**: Missing environment variables
- **Network errors**: Check if Netlify functions are deployed correctly
- **Session issues**: Verify Redis connection and credentials
