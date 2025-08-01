# Email Setup for Password Reset Feature

This guide explains how to configure email functionality for the forgot password feature.

## Required Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
CLIENT_URL=http://localhost:5173
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

## Alternative Email Services

### SendGrid
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

### Mailgun
```env
EMAIL_SERVICE=mailgun
EMAIL_USER=your_mailgun_username
EMAIL_PASSWORD=your_mailgun_api_key
```

### Brevo (formerly Sendinblue)
```env
EMAIL_SERVICE=brevo
EMAIL_USER=your_brevo_username
EMAIL_PASSWORD=your_brevo_api_key
```

## Testing the Email Feature

1. Start your server: `npm run dev`
2. Go to the login page and click "Forgot password?"
3. Enter your email address
4. Check your email for the reset link
5. Click the link to reset your password

## Security Notes

- Reset tokens expire after 1 hour
- Tokens are hashed before storing in the database
- The system doesn't reveal whether an email exists or not
- Google OAuth users cannot use password reset (they should use Google Sign-In)

## Troubleshooting

### Email not sending
- Check your email credentials
- Ensure 2FA is enabled for Gmail
- Verify your app password is correct
- Check server logs for error messages

### Reset link not working
- Ensure the token hasn't expired (1 hour limit)
- Check that the CLIENT_URL is correct
- Verify the token in the URL matches what was sent

## Production Considerations

For production, consider using dedicated email services like:
- SendGrid
- Mailgun
- Amazon SES
- Brevo

These services provide better deliverability and monitoring than Gmail. 