package com.project.erp.supplier.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.common.BaseEntity;
import com.project.erp.financialYear.entity.FinancialYear;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Supplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String supplierCode;

    @Column(length = 500)
    private String supplierImage;

    @Column(nullable = false, length = 100)
    private String supplierName;

    @Column(nullable = false, length = 100)
    private String ownerName;

    @Column(nullable = false, length = 250)
    private String address;

    @Column(length = 150)
    private String landmark;

    @Column(nullable = false, length = 50)
    private String place;

    @Column(nullable = false, length = 50)
    private String region;

    @Column(nullable = false, unique = true, length = 15)
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be 10 digits")
    private String phone;

    @Email
    @Column(unique = true, length = 50)
    private String email;

    @Column(unique = true, length = 50)
    private String gstNo;



    //Audit Fields
    @Column(nullable = false)
    private Boolean active = true;

    @CreatedBy
    @Column(updatable = false, nullable = false)
    private String createdBy;

    @Column(updatable = false)
    @CreatedDate
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
}
