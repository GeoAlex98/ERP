package com.project.erp.purchase.repository;

import com.project.erp.purchase.entity.PurchaseDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PurchaseDetailRepository extends JpaRepository<PurchaseDetail, Long> {
    Optional<Object> findPurchaseDetailById(Long purchaseDetailId);
}
