package com.example.legalaid_backend.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@legalaid.com}")
    private String fromEmail;
    
    /**
     * Send OTP email for password reset
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String username) {
        // Always log OTP for development/testing purposes
        logger.info("========================================");
        logger.info("PASSWORD RESET OTP for {}: {}", toEmail, otp);
        logger.info("========================================");
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Legal Aid Platform - Password Reset OTP");
            
            // Use simple text instead of HTML to debug
            String textContent = "Your OTP for password reset is: " + otp + "\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.";
            helper.setText(textContent, false);
            
            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("Email sending failed. Error type: {}, Message: {}", e.getClass().getName(), e.getMessage());
            e.printStackTrace();
            // Don't throw exception - OTP is logged above for testing
        }
    }
    
    /**
     * Build HTML email template for OTP
     */
    private String buildOtpEmailTemplate(String otp, String username) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); border-radius: 10px 10px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⚖️ Legal Aid Platform</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px 0; color: #1e3a5f; font-size: 24px;">Password Reset Request</h2>
                                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                            Hello <strong>%s</strong>,
                                        </p>
                                        <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                            We received a request to reset your password. Use the OTP below to verify your identity:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td align="center" style="padding: 30px 0;">
                                                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #1e3a5f; border-radius: 10px; padding: 25px 50px; display: inline-block;">
                                                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a5f;">%s</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            <strong>⏰ This OTP will expire in 10 minutes.</strong>
                                        </p>
                                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 10px 10px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                                            This is an automated message from Legal Aid Platform.
                                        </p>
                                        <p style="margin: 0; color: #999999; font-size: 12px;">
                                            © 2026 Legal Aid Platform. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(username != null ? username : "User", otp);
    }
    
    /**
     * Send password reset success confirmation email
     */
    @Async
    public void sendPasswordResetSuccessEmail(String toEmail, String username) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Legal Aid Platform - Password Reset Successful");
            
            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #28a745 0%, #20c997 100%%); border-radius: 10px 10px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✅ Password Reset Successful</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Hello <strong>%s</strong>,
                                            </p>
                                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Your password has been successfully reset. You can now log in with your new password.
                                            </p>
                                            <p style="margin: 0; color: #dc3545; font-size: 14px; line-height: 1.5;">
                                                <strong>⚠️ If you didn't make this change, please contact support immediately.</strong>
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 10px 10px; text-align: center;">
                                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                                © 2026 Legal Aid Platform. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(username != null ? username : "User");
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Password reset success email sent to: {}", toEmail);
            
        } catch (MessagingException e) {
            logger.error("Failed to send password reset success email to {}: {}", toEmail, e.getMessage());
        }
    }
}
