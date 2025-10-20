package com.project.erp.userMaster.dto;

import com.project.erp.user.entity.User;
import lombok.Data;

import java.util.List;

@Data
public class CreateUserDto {
    private User user;
    private List<ModulePermissionDto> modules;
}
