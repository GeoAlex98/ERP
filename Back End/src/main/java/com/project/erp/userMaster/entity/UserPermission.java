package com.project.erp.userMaster.entity;

import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "user_permission")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPermission {

    @Id
    @GeneratedValue(generator = "header-id-generator")
    @GenericGenerator(
            name = "header-id-generator",
            strategy = "com.project.erp.common.HeaderIdGenerator"
    )
    private String id;

    // Many permissions per user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Module
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    // Permissions
    @Column(nullable = false)
    private boolean canView;

    @Column(nullable = false)
    private boolean canAdd;

    @Column(nullable = false)
    private boolean canEdit;

    @Column(nullable = false)
    private boolean canDelete;
}
