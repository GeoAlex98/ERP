package com.project.erp.purchase.repository;

import com.project.erp.purchase.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Optional<Purchase> findByPurchaseInvoiceNo(String purchaseInvoiceNo);

    @Query("SELECT p FROM Purchase p WHERE p.sendForPacked = true")
    List<Purchase> findAllSentForPacking();
}
