package com.project.erp.userMaster.service;

import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.user.entity.User;
import com.project.erp.userMaster.entity.UserPermission;

import java.util.List;

public interface UserPermissionService {

    // Get all modules
    List<Module> getAllModules();

    // Get all active modules
    List<Module> getActiveModules();

    // Get all permissions of a user
    List<UserPermission> getUserPermissions(User user);

    // Save permissions for a user
    void saveUserPermissions(User user, List<UserPermission> permissions);
}