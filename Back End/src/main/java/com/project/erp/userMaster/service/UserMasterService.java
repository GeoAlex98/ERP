package com.project.erp.userMaster.service;

import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import com.project.erp.userMaster.dto.CreateUserDto;
import com.project.erp.userMaster.dto.UserPermissionsDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserMasterService {

    List<User> searchUsers(String search);

    User getUserById(Long id);

    List<UserPasswordHistory> getPasswordHistory(Long userId);

    User createUser(CreateUserDto dto);

    User updateUser(Long id, String username, String email, String phone, String role, boolean active, String password, String profilePicUrl);

    void deleteUser(Long id);

    UserPermissionsDto getPermissionsByUserId(Long userId);

    User updatePermissions(Long id, UserPermissionsDto dto);

    String generateProfilePicUrl(MultipartFile file, String username);
}
