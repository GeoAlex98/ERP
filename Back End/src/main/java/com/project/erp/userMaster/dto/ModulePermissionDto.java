package com.project.erp.userMaster.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModulePermissionDto {
    private Long id;
    private boolean canView;
    private boolean canAdd;
    private boolean canEdit;
    private boolean canDelete;
}
