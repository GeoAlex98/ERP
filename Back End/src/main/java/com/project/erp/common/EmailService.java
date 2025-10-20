package com.project.erp.common;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Send the HTML email with the reset code
    public void sendResetCodeEmail(String email, String resetCode) throws MessagingException {
        String subject = "Your Password Reset Code";
        String body = "<html>"
                + "<body>"
                + "<h2>Password Reset Request</h2>"
                + "<p>We received a request to reset your password. Please use the following code to reset your password:</p>"
                + "<h1 style='font-size: 48px; color: #4CAF50; text-align: center;'>" + resetCode + "</h1>"
                + "<p style='font-size: 18px; text-align: center;'>This code will expire in 5 minutes.</p>"
                + "<p style='font-size: 16px;'>If you did not request this, please ignore this email.</p>"
                + "</body>"
                + "</html>";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(body, true);  // Set the body as HTML content

        mailSender.send(message);
    }
}
