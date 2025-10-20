package com.project.erp.user.controller;

import com.project.erp.filter.JwtUtil;
import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.moduleMaster.repository.ModuleMasterRepository;
import com.project.erp.user.UserRepository;
import com.project.erp.user.entity.User;
import com.project.erp.user.service.AuthService;
import com.project.erp.userMaster.service.UserPermissionService;
import jakarta.mail.MessagingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static com.project.erp.user.service.AuthService.LOGIN_ATTEMPT_LOCK;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final ModuleMasterRepository moduleMasterRepository;
    private final UserPermissionService userPermissionService;
    
    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsService userDetailsService,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthService authService,
                          ModuleMasterRepository moduleMasterRepository,
                          UserPermissionService userPermissionService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.moduleMasterRepository = moduleMasterRepository;
        this.userPermissionService = userPermissionService;
    }

    // ✅ Login API
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String identifier = request.get("email"); // may be email or username
        String password = request.get("password");

        try {
            User user = authService.login(identifier, password);
            String token = jwtUtil.generateToken(user.getUsername());

            
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id" , user.getId(),
                    "name", user.getUsername(),
                    "role", user.getRole(),
                    "profilePicThumbUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl().replace(".png", "-thumb.png") : ""
                    , // if stored as base64 or URL
                    "remainingAttempts", LOGIN_ATTEMPT_LOCK - user.getFailedLoginAttempts(),
                    "allowedModules", getAllAllowedModules(user)
                    
            ));

        } catch (RuntimeException e) {
            int remaining = authService.getRemainingLoginAttempts(identifier);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage(), "remainingAttempts", remaining));
        }
    }
    @GetMapping("/allowedModules")
    public List<Module> getAllAllowedModules(User user){

        List<Module> allowedModules;
        if (user.getRole() == User.Role.SUPERADMIN) {
            allowedModules = userPermissionService.getActiveModules();
        } else if (user.getRole() == User.Role.ADMIN) {
            // Return active modules assigned to the admin
            allowedModules = moduleMasterRepository.findActiveModulesByUser(user)
                    .stream()
                    .distinct()
                    .toList();
        } else { // EMPLOYEE
            // Return only active non-master modules assigned to the employee
            allowedModules = moduleMasterRepository.findActiveModulesByUser(user)
                    .stream()
                    .filter(m -> m.getCategory() != Module.ModuleCategory.MASTER)
                    .distinct()
                    .toList();
        }

        return allowedModules;
    }


    //Password Reset

    // Check email
    @PostMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("exists", false));
        }
        boolean exists = authService.checkEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Send reset code
    @PostMapping("/send-reset-code")
    public ResponseEntity<Map<String, String>> sendResetCode(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        try {
            authService.sendResetCode(email);
            return ResponseEntity.ok(Map.of("message", "Verification code sent"));
        } catch (MessagingException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send code"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    // Reset password
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String code = req.get("code");
        String newPassword = req.get("newPassword");

        if (email == null || code == null || newPassword == null ||
                email.isBlank() || code.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "All fields are required"));
        }

        try {
            authService.resetPassword(email, code, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


/*
    // ✅ Registration API
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(User.Role.EMPLOYEE);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }
    */
    /*@GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(Map.of(
                "username", authentication.getName()
        ));
    }*/
}
