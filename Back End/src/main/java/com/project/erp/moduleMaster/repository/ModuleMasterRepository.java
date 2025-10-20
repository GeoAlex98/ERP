package com.project.erp.moduleMaster.repository;

import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModuleMasterRepository extends JpaRepository<Module, Long> {
    List<Module> findByActiveTrue();

    @Query("SELECT p.module FROM UserPermission p " +
            "WHERE p.user = :user AND p.module.active = true AND p.canView = true")
    List<Module> findActiveModulesByUser(@Param("user") User user);

    boolean existsByName(String name);
}
