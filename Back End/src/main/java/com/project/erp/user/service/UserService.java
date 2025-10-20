package com.project.erp.user.service;

import com.project.erp.user.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
//    Optional<User> findByUsername(String username);
//
//    Optional<User> findByEmail(String email);

    User getCurrentUser(String username);
    User updateProfile(String username, String newUsername, String email, String phone, String profilePicUrl, boolean updateProfilePic);
    void changePassword(String username, String currentPassword, String newPassword);
    String storeProfilePic(MultipartFile file, String username);
}
