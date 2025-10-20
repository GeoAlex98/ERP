package com.project.erp.user.controller;

import com.project.erp.filter.JwtUtil;
import com.project.erp.user.entity.User;
import com.project.erp.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/account")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // ✅ Get current user details
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        User user = userService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "profilePicUrl", user.getProfilePicUrl() != null ? user.getProfilePicUrl() : ""
        ));
    }

    // ✅ Update profile with optional file upload
    @PutMapping(value = "/update", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateProfile(
            Principal principal,
            @RequestPart("username") String username,
            @RequestPart("email") String email,
            @RequestPart("phone") String phone,
            @RequestPart(value = "profilePic", required = false) MultipartFile profilePic
    ) {
        User updated;
        if (profilePic != null && !profilePic.isEmpty()) {
            String profilePicUrl = userService.storeProfilePic(profilePic, username);
            updated = userService.updateProfile(principal.getName(), username, email, phone, profilePicUrl, true);
        } else {
            // call updateProfile without changing profile pic
            updated = userService.updateProfile(principal.getName(), username, email, phone, null, false);
        }


        return ResponseEntity.ok(Map.of(
                "username", updated.getUsername(),
                "email", updated.getEmail(),
                "phone", updated.getPhone(),
                "profilePicUrl", updated.getProfilePicUrl() != null ? updated.getProfilePicUrl() : "",
                "token", jwtUtil.generateToken(updated.getUsername())
        ));
    }

    // ✅ Change password
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Principal principal, @RequestBody Map<String, String> body) {
        userService.changePassword(
                principal.getName(),
                body.get("currentPassword"),
                body.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
