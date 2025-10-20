package com.project.erp.user.service;

import com.project.erp.common.EmailService;
import com.project.erp.user.UserPasswordHistoryRepository;
import com.project.erp.user.UserRepository;
import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserPasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // --- Security constants ---
    public static final int LOGIN_ATTEMPT_LOCK = 8;
    private static final int LOGIN_COOLDOWN_MINUTES = 15;
    public static final int RESET_EMAIL_LOCK = 4;
    private static final int RESET_EMAIL_COOLDOWN_MINUTES = 60;

//    public AuthService(UserRepository userRepository,
//                       UserPasswordHistoryRepository passwordHistoryRepository,
//                       PasswordEncoder passwordEncoder,
//                       EmailService emailService) {
//        this.userRepository = userRepository;
//        this.passwordHistoryRepository = passwordHistoryRepository;
//        this.passwordEncoder = passwordEncoder;
//        this.emailService = emailService;
//    }

    // --- LOGIN ---
    public User login(String identifier, String rawPassword) {
        // identifier can be either email or username
        Optional<User> optionalUser = userRepository.findByEmail(identifier);
        if (optionalUser.isEmpty()) {
            optionalUser = userRepository.findByUsername(identifier);
        }

        User user = optionalUser.orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Check if user is active
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new RuntimeException("Account disabled!!");
        }

        // Check login cooldown
        if (user.getFailedLoginAttempts() >= LOGIN_ATTEMPT_LOCK &&
                user.getLoginCooldownStart() != null &&
                user.getLoginCooldownStart().plusMinutes(LOGIN_COOLDOWN_MINUTES).isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Account locked. Try again later.");
        }

        // Verify password
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            user.setLastFailedLoginAt(LocalDateTime.now());
            if (user.getFailedLoginAttempts() >= LOGIN_ATTEMPT_LOCK) {
                user.setLoginCooldownStart(LocalDateTime.now());
            }
            userRepository.save(user);
            throw new RuntimeException("Invalid credentials");
        }

        // Success → reset attempts
        user.setFailedLoginAttempts(0);
        user.setLoginCooldownStart(null);
        userRepository.save(user);

        return user;
    }

    public boolean checkEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // --- SEND RESET CODE ---
    public void sendResetCode(String email) throws MessagingException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Enter a valid email-Id"));

        // Check reset attempt lock
        if (user.getFailedResetAttempts() >= RESET_EMAIL_LOCK &&
                user.getResetCooldownStart() != null &&
                user.getResetCooldownStart().plusMinutes(RESET_EMAIL_COOLDOWN_MINUTES).isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Too many reset attempts. Try again later.");
        }

        // Generate 6-digit code
        String resetCode = String.format("%06d", new Random().nextInt(999999));
        user.setResetCode(resetCode);
        user.setResetCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Send email
        emailService.sendResetCodeEmail(email, resetCode);
    }

    // --- RESET PASSWORD ---
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        // Check code validity
        if (user.getResetCode() == null ||
                !user.getResetCode().equals(code) ||
                user.getResetCodeExpiresAt() == null ||
                LocalDateTime.now().isAfter(user.getResetCodeExpiresAt())) {
            incrementFailedResetAttempts(user);
            throw new RuntimeException("Invalid or expired verification code");
        }

        // Check last 3 passwords
        List<UserPasswordHistory> last3 = passwordHistoryRepository.findTop3ByUserOrderByCreatedAtDesc(user);
        for (UserPasswordHistory ph : last3) {
            if (passwordEncoder.matches(newPassword, ph.getPasswordHash())) {
                throw new RuntimeException("New password must be different from last 3 passwords");
            }
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetCode(null);
        user.setResetCodeExpiresAt(null);
        user.setFailedResetAttempts(0);
        user.setResetCooldownStart(null);
        userRepository.save(user);

        // Save password history
        UserPasswordHistory history = new UserPasswordHistory();
        history.setUser(user);
        history.setPasswordHash(user.getPassword());
        passwordHistoryRepository.save(history);
    }

    // --- Increment failed reset attempts ---
    private void incrementFailedResetAttempts(User user) {
        int failed = user.getFailedResetAttempts() + 1;
        user.setFailedResetAttempts(failed);
        if (failed >= RESET_EMAIL_LOCK) {
            user.setResetCooldownStart(LocalDateTime.now());
        }
        userRepository.save(user);
    }

    // --- Remaining login attempts for frontend ---
    public int getRemainingLoginAttempts(String identifier) {
        Optional<User> optUser = userRepository.findByEmail(identifier);
        if (optUser.isEmpty()) {
            optUser = userRepository.findByUsername(identifier);
        }
        return optUser.map(u -> LOGIN_ATTEMPT_LOCK - u.getFailedLoginAttempts())
                .orElse(LOGIN_ATTEMPT_LOCK);
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));
        }
        throw new RuntimeException("No authenticated user");
    }
}
