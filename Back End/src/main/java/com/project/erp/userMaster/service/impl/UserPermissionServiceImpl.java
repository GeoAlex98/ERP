package com.project.erp.userMaster.service.impl;

import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.moduleMaster.repository.ModuleMasterRepository;
import com.project.erp.user.entity.User;
import com.project.erp.userMaster.entity.UserPermission;
import com.project.erp.userMaster.repository.UserPermissionRepository;
import com.project.erp.userMaster.service.UserPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserPermissionServiceImpl implements UserPermissionService {

    private final ModuleMasterRepository moduleMasterRepository;
    private final UserPermissionRepository permissionRepository;

    // Get all modules
    @Transactional(readOnly = true)
    public List<Module> getAllModules() {
        return moduleMasterRepository.findAll();
    }

    // Get all active modules
    @Transactional(readOnly = true)
    public List<Module> getActiveModules() {
        return moduleMasterRepository.findByActiveTrue();
    }

    // Get permissions of a user
    @Transactional(readOnly = true)
    public List<UserPermission> getUserPermissions(User user) {
        return permissionRepository.findByUser(user);
    }

    // Save permissions for a user
    public void saveUserPermissions(User user, List<UserPermission> permissions) {
        permissions.forEach(p -> p.setUser(user));
        permissionRepository.saveAll(permissions);
    }

}
