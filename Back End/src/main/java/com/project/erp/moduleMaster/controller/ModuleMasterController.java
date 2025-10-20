package com.project.erp.moduleMaster.controller;

import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.moduleMaster.repository.ModuleMasterRepository;
import com.project.erp.user.entity.User;
import com.project.erp.user.service.UserService;
import com.project.erp.userMaster.service.UserPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleMasterController {

    private final UserPermissionService userPermissionService;
    private final ModuleMasterRepository moduleMasterRepository;
    private final UserService userService;

    @GetMapping("/user")
    public List<Module> getModulesForCurrentUser(Principal principal) {
        User user = userService.getCurrentUser(principal.getName());
        return moduleMasterRepository.findActiveModulesByUser(user)
                .stream()
                .distinct()
                .toList();
    }
    @GetMapping("/all")
    public List<Module> getAllModules() {
        return userPermissionService.getAllModules();
    }

    // Get active modules
    @GetMapping("/active")
    public List<Module> getActiveModules() {
        return userPermissionService.getActiveModules();
    }

    @PutMapping("/update-all")
    public ResponseEntity<?> updateAllModules(@RequestBody List<Module> modules) {
        // Save all modules at once
        List<Module> updatedModules = moduleMasterRepository.saveAll(modules);
        return ResponseEntity.ok(updatedModules);
    }
}
