package com.project.erp.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.user.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.annotation.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseAuditEntity {

    @CreatedBy
    @Column(updatable = false, nullable = false)
    private User createdBy;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    private User modifiedBy;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    @Column(name = "active")
    private boolean active = true;

//    @Column(name = "fin_year", nullable = false, length = 7)
//    private FinancialYear finYear;
//
//    @Autowired
//    private FinancialYearService financialYearService;
//
//    public void setFinYearAutomatically() {
//        this.finYear = financialYearService.getCurrentFinYear();
//    }
}