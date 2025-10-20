package com.project.erp.userMaster.controller;

import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import com.project.erp.userMaster.dto.CreateUserDto;
import com.project.erp.userMaster.dto.ModulePermissionDto;
import com.project.erp.userMaster.dto.UserPermissionsDto;
import com.project.erp.userMaster.service.UserMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/usermaster/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserMasterController {

    private final UserMasterService userMasterService;

    @GetMapping
    public ResponseEntity<List<User>> getUsers(@RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(userMasterService.searchUsers(search));
    }

    @GetMapping("/light")
    public ResponseEntity<List<LightUserDto>> getLightUsers(@RequestParam(value = "search", required = false) String search) {
        List<User> users = userMasterService.searchUsers(search);
        List<LightUserDto> lightUsers = users.stream()
                .map(u -> new LightUserDto(u.getId(), u.getUsername(), u.getRole().name()))
                .toList();
        return ResponseEntity.ok(lightUsers);
    }

    public record LightUserDto(Long id, String username, String role) {}

    @GetMapping("/{id}")
    public ResponseEntity<FullUserDto> getUser(@PathVariable Long id) {
        User u = userMasterService.getUserById(id);
        FullUserDto dto = new FullUserDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getPhone(),
                u.getRole().name(),
                u.getProfilePicUrl(),  // ✅ changed
                u.getActive()
        );
        return ResponseEntity.ok(dto);
    }

    public record FullUserDto(
            Long id,
            String username,
            String email,
            String phone,
            String role,
            String profilePicUrl,  // ✅ changed
            boolean active
    ) {}

    @GetMapping("/{id}/password-history")
    public ResponseEntity<List<UserPasswordHistory>> getPasswordHistory(@PathVariable Long id) {
        return ResponseEntity.ok(userMasterService.getPasswordHistory(id));
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<UserPermissionsDto> getUserPermissions(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userMasterService.getPermissionsByUserId(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(new UserPermissionsDto(Collections.emptyList()));
        }
    }

    @PostMapping(value = "/add", consumes = {"multipart/form-data"})
    public ResponseEntity<User> createUser(
            @RequestPart("username") String username,
            @RequestPart("email") String email,
            @RequestPart("phone") String phone,
            @RequestPart("role") String role,
            @RequestPart("password") String password,
            @RequestPart(value = "profilePic", required = false) MultipartFile profilePic,
            @RequestParam(value = "modules", required = false) List<ModulePermissionDto> modules
    ) {
        String profilePicUrl = null;
        if (profilePic != null && !profilePic.isEmpty()) {
            profilePicUrl = userMasterService.generateProfilePicUrl(profilePic, username);
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(User.Role.valueOf(role));
        user.setPassword(password);
        user.setProfilePicUrl(profilePicUrl);

        CreateUserDto dto = new CreateUserDto();
        dto.setUser(user);
        dto.setModules(modules != null ? modules : Collections.emptyList());

        User createdUser = userMasterService.createUser(dto);
        return ResponseEntity.ok(createdUser);
    }



    @PutMapping("/{id}/permissions")
    public ResponseEntity<User> updatePermissions(
            @PathVariable Long id,
            @RequestBody UserPermissionsDto permissionsDto
    ) {
        return ResponseEntity.ok(userMasterService.updatePermissions(id, permissionsDto));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("role") String role,
            @RequestParam("active") boolean active,
            @RequestParam(value = "password", required = false) String password,
            @RequestPart(value = "profilePic", required = false) MultipartFile profilePic
    ) {
        String profilePicUrl = null;
        if (profilePic != null && !profilePic.isEmpty()) {
            profilePicUrl = userMasterService.generateProfilePicUrl(profilePic, username);
        }
        System.out.println("profilePicUrl===="+profilePicUrl);
        User updatedUser = userMasterService.updateUser(id, username, email, phone, role, active, password, profilePicUrl);
        return ResponseEntity.ok(updatedUser);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userMasterService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
