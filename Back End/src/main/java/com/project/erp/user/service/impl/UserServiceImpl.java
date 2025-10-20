package com.project.erp.user.service.impl;

import com.project.erp.user.UserPasswordHistoryRepository;
import com.project.erp.user.UserRepository;
import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import com.project.erp.user.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private final UserPasswordHistoryRepository passwordHistoryRepository;

//    @Autowired
//    public UserServiceImpl(UserRepository userRepository,
//                           UserPasswordHistoryRepository passwordHistoryRepository) {
//        this.userRepository = userRepository;
//        this.passwordHistoryRepository = passwordHistoryRepository;
//    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    // ✅ Update Profile
    @Override
    public User updateProfile(String username, String newUsername, String email, String phone, String profilePicUrl, boolean updateProfilePic) {
        User user = userRepository.findByUsername(username).orElseThrow();

        user.setUsername(newUsername);
        user.setEmail(email);
        user.setPhone(phone);

        if (updateProfilePic && profilePicUrl != null) {
            user.setProfilePicUrl(profilePicUrl);
        }

        return userRepository.save(user);
    }

    @Override
    public String storeProfilePic(MultipartFile file, String username) {
        try {
            String uploadDir = "uploads/profilePics/";
//            LocalDateTime now = LocalDateTime.now();

//            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmm");
//            String formattedDateTime = now.format(formatter);
//
//            String filename = username + "_" + formattedDateTime + ".png";
            String filename = username.replaceAll("\\s+", "_") + ".png";
            String thumbFilename = username + "-thumb.png";
            Path filePath = Paths.get(uploadDir + filename);
            Path thumbPath = Paths.get(uploadDir + thumbFilename);

            Files.createDirectories(filePath.getParent());
            Files.write(filePath, file.getBytes());

            // Generate thumbnail
            BufferedImage originalImage = ImageIO.read(file.getInputStream());
            int thumbWidth = 100;  // adjust size as needed
            int thumbHeight = 100;

            // Preserve aspect ratio
            int origWidth = originalImage.getWidth();
            int origHeight = originalImage.getHeight();
            if (origWidth > origHeight) {
                thumbHeight = (origHeight * thumbWidth) / origWidth;
            } else {
                thumbWidth = (origWidth * thumbHeight) / origHeight;
            }

            Image tmp = originalImage.getScaledInstance(thumbWidth, thumbHeight, Image.SCALE_SMOOTH);
            BufferedImage thumbnail = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_ARGB);

            Graphics2D g2d = thumbnail.createGraphics();
            g2d.drawImage(tmp, 0, 0, null);
            g2d.dispose();

            // Save thumbnail
            ImageIO.write(thumbnail, "png", thumbPath.toFile());

            return "uploads/profilePics/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }


    @Override
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Check last 3 passwords
        List<UserPasswordHistory> last3 = passwordHistoryRepository.findTop3ByUserOrderByCreatedAtDesc(user);
        for (UserPasswordHistory ph : last3) {
            if (passwordEncoder.matches(newPassword, ph.getPasswordHash())) {
                throw new RuntimeException("New password must be different from last 3 passwords");
            }
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
