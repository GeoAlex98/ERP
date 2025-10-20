package com.project.erp.userMaster.service.impl;

import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.moduleMaster.repository.ModuleMasterRepository;
import com.project.erp.user.UserPasswordHistoryRepository;
import com.project.erp.user.UserRepository;
import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import com.project.erp.user.service.AuthService;
import com.project.erp.userMaster.dto.CreateUserDto;
import com.project.erp.userMaster.dto.ModulePermissionDto;
import com.project.erp.userMaster.dto.UserPermissionsDto;
import com.project.erp.userMaster.entity.UserPermission;
import com.project.erp.userMaster.repository.UserPermissionRepository;
import com.project.erp.userMaster.service.UserMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
import java.util.Collections;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserMasterServiceImpl implements UserMasterService {

    private final UserRepository userRepository;
    private final UserPasswordHistoryRepository passwordHistoryRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final ModuleMasterRepository moduleMasterRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final FinancialYearService financialYearService;

    @Override
    @Transactional(readOnly = true)
    public List<User> searchUsers(String search) {
        if (search == null || search.isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserPasswordHistory> getPasswordHistory(Long userId) {
        return passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public User createUser(CreateUserDto dto) {
        User user = dto.getUser();

        // ✅ Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        FinancialYear finYr = financialYearService.getCurrentActiveFinYear();
        user.setFinYear(finYr);

        User savedUser = userRepository.save(user);
        // ✅ Save selected permissions
        for (ModulePermissionDto m : dto.getModules()) {
            moduleMasterRepository.findById(m.getId()).ifPresent(module -> {
                UserPermission perm = UserPermission.builder()
                        .user(savedUser)
                        .module(module)
                        .canView(m.isCanView())
                        .canAdd(m.isCanAdd())
                        .canEdit(m.isCanEdit())
                        .canDelete(m.isCanDelete())
                        .build();
                userPermissionRepository.save(perm);
            });
        }

        return savedUser;
    }

    @Override
    public User updateUser(Long id, String username, String email, String phone, String role, boolean active, String password, String profilePicUrl) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("22222222222222222222222222");
        existingUser.setUsername(username);
        existingUser.setEmail(email);
        existingUser.setPhone(phone);
        existingUser.setRole(User.Role.valueOf(role));
        existingUser.setActive(active);

        if (password != null && !password.isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(password));
        }
        if (profilePicUrl != null) {
            existingUser.setProfilePicUrl(profilePicUrl);
        }
        return userRepository.save(existingUser);
    }

    @Override
    public String generateProfilePicUrl(MultipartFile file, String username) {
        try {
            String uploadDir = "uploads/profilePics/";
//            LocalDateTime now = LocalDateTime.now();
//
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
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public User updatePermissions(Long id, UserPermissionsDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserPermission> permissions = userPermissionRepository.findByUserId(id);

        for (ModulePermissionDto mDto : dto.getModules()) {
            UserPermission up = permissions.stream()
                    .filter(p -> p.getModule().getId().equals(mDto.getId()))
                    .findFirst()
                    .orElseGet(() -> {
                        UserPermission newPerm = new UserPermission();
                        newPerm.setUser(user);
                        moduleMasterRepository.findById(mDto.getId()).ifPresent(newPerm::setModule);
                        permissions.add(newPerm);
                        return newPerm;
                    });

            up.setCanView(mDto.isCanView());
            up.setCanAdd(mDto.isCanAdd());
            up.setCanEdit(mDto.isCanEdit());
            up.setCanDelete(mDto.isCanDelete());
        }

        if (user.getRole() == User.Role.EMPLOYEE) {
            permissions.removeIf(up -> up.getModule().getCategory() == Module.ModuleCategory.MASTER);
        }

        userPermissionRepository.saveAll(permissions);
        return user;
    }

    @Override
    public UserPermissionsDto getPermissionsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserPermission> permissions = userPermissionRepository.findByUser(user);
        if (permissions == null) permissions = Collections.emptyList();

        return new UserPermissionsDto(
                permissions.stream()
                        .map(p -> new ModulePermissionDto(
                                p.getModule().getId(),
                                p.isCanView(),
                                p.isCanAdd(),
                                p.isCanEdit(),
                                p.isCanDelete()
                        )).toList()
        );
    }

}
