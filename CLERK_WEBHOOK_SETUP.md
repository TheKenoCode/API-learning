# Clerk Webhook Setup Guide

This guide will help you set up Clerk webhooks to automatically sync users between Clerk and your database.

## Why is this needed?

When users sign up through Clerk, they are created in Clerk's system but not automatically in your database. This causes issues where:
- Users can authenticate with Clerk but don't exist in your database
- TRPC calls fail because the user ID is null
- Users get 404 errors or authorization failures

## Solution

I've implemented two solutions:

1. **Webhook (Recommended)**: Automatically creates database users when Clerk users are created
2. **Fallback Mechanism**: Creates database users on-demand during their first app access

## Setup Steps

### 1. Configure Environment Variables

Add this to your `.env` file:
```bash
WEBHOOK_SECRET="whsec_your-clerk-webhook-secret"
```

### 2. Set up Clerk Webhook

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
   - For local development: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
6. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Copy the **Signing Secret** and add it to your `.env` file as `WEBHOOK_SECRET`

### 3. For Local Development (Using ngrok)

Since Clerk needs to send webhooks to your app, you'll need to expose your local server:

```bash
# Install ngrok if you haven't already
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Expose your local server
ngrok http 3000

# Use the HTTPS URL (e.g., https://abc123.ngrok.io) in your Clerk webhook configuration
```

### 4. Test the Setup

1. Go to your app's sign-up page
2. Create a new account with a different email
3. Check your server logs - you should see webhook events being processed
4. The user should now exist in your database and can access protected routes

## How it works

### Webhook Flow (Primary)
1. User signs up in Clerk
2. Clerk sends `user.created` webhook to your app
3. Your app receives the webhook and creates the user in your database
4. User is redirected to dashboard and everything works

### Fallback Flow (Backup)
1. User signs up in Clerk but webhook fails/isn't configured
2. User accesses your app for the first time
3. TRPC context doesn't find user in database
4. App automatically fetches user details from Clerk and creates database record
5. User can now use the app normally

## Troubleshooting

### Webhook not being called
- Check that your webhook URL is accessible from the internet
- Verify the webhook secret matches between Clerk and your environment variables
- Check Clerk dashboard webhook logs for delivery failures

### User still not being created
- Check your server logs for error messages
- Verify your database connection is working
- Make sure the Prisma schema is up to date (`pnpm db:push`)

### Local development issues
- Use ngrok or a similar service to expose your local server
- Make sure your webhook URL uses HTTPS (required by Clerk)
- Check that your local server is running on the correct port

## Benefits

With this setup:
- ✅ Users are automatically synced between Clerk and your database
- ✅ No more 404 errors after sign-up
- ✅ TRPC calls work immediately for new users
- ✅ Fallback mechanism ensures reliability
- ✅ User data stays in sync (updates, deletions)

## Next Steps

After setting this up, you might want to:
- Test the flow with a new account
- Monitor webhook delivery in Clerk dashboard
- Set up monitoring/alerting for webhook failures
- Consider adding user onboarding flows for new accounts 