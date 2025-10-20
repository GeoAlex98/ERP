package com.project.erp.userMaster.repository;

import com.project.erp.user.entity.User;
import com.project.erp.userMaster.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserPermissionRepository extends JpaRepository<UserPermission, String> {
    List<UserPermission> findByUser(User user);

    List<UserPermission> findByUserId(Long id);
}