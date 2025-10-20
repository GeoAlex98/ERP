package com.project.erp.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.common.BaseEntity;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.userMaster.entity.UserPermission;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "user")
public class User extends BaseEntity {

    public enum Role {
        SUPERADMIN,
        ADMIN,
        EMPLOYEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 500)
    private String profilePicUrl;

    @Column(nullable = true, unique = true, length = 50)
    private String fullname;

    @Email
    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @Column(unique = true, length = 15)
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be 10 digits")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 6)
    private String resetCode;

    private LocalDateTime resetCodeExpiresAt;
    private int failedResetAttempts;
    private LocalDateTime resetCooldownStart;

    private int failedLoginAttempts;
    private LocalDateTime lastFailedLoginAt;
    private LocalDateTime loginCooldownStart;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserPermission> modulePermissions = new ArrayList<>();



    //Audit Fields
    @Column(nullable = false)
    private Boolean active = true;

    @CreatedBy
    @Column(updatable = false, nullable = false)
    private String createdBy;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    private String lastModifiedBy;

    @LastModifiedDate
    private LocalDateTime lastModifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_year_id", nullable = false, updatable = false)
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JsonIgnore
    private FinancialYear finYear;


//    // --- Lifecycle Hook ---
//    @PrePersist
//    protected void onCreate() {
//        this.createdAt = LocalDateTime.now();
//    }
//
//    @PreUpdate
//    protected void onUpdate() {
//        modifiedAt = LocalDateTime.now();
//    }

    public User(String username, String password, Role role, String email, String phoneNumber) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.email = email;
        this.phone = phoneNumber;
    }
}
