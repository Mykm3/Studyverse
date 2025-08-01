const nodemailer = require('nodemailer');

// Create transporter for development (using Gmail or other SMTP service)
const createTransporter = () => {
  // For development, you can use Gmail or other SMTP services
  // For production, consider using services like SendGrid, Mailgun, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email service configuration
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development configuration - using Gmail or other SMTP
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

const sendPasswordResetEmail = async (email, resetToken, displayName) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration missing. Skipping email send.');
      console.log('Reset URL for testing:', `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`);
      return true; // Return success to not block the flow
    }

    const transporter = createTransporter();
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@studyscheduler.com',
      to: email,
      subject: 'Password Reset Request - Study Scheduler',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Study Scheduler</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${displayName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your Study Scheduler account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons. If you need to reset your password again, 
              please visit the login page and click "Forgot Password?".
            </p>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #495057; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, 
                please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from Study Scheduler. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request - Study Scheduler
        
        Hello ${displayName},
        
        We received a request to reset your password for your Study Scheduler account. 
        If you didn't make this request, you can safely ignore this email.
        
        To reset your password, click the following link:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        Study Scheduler Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

const sendPasswordChangedEmail = async (email, displayName) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration missing. Skipping confirmation email send.');
      return true; // Return success to not block the flow
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@studyscheduler.com',
      to: email,
      subject: 'Password Changed Successfully - Study Scheduler',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Study Scheduler</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Changed Successfully</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${displayName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your password has been successfully changed. If you made this change, you can safely ignore this email.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>✓ Password Change Confirmed</strong><br>
                Your Study Scheduler account password has been updated successfully.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't change your password, please contact our support team immediately 
              as your account may have been compromised.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from Study Scheduler. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Changed Successfully - Study Scheduler
        
        Hello ${displayName},
        
        Your password has been successfully changed. If you made this change, you can safely ignore this email.
        
        If you didn't change your password, please contact our support team immediately 
        as your account may have been compromised.
        
        Best regards,
        Study Scheduler Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password change confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password change confirmation email:', error);
    // Don't throw error for confirmation email as it's not critical
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
}; 