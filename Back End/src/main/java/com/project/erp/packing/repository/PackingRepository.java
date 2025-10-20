package com.project.erp.packing.repository;

import com.project.erp.packing.entity.Packing;
import com.project.erp.purchase.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackingRepository extends JpaRepository<Packing, Long> {
    List<Packing> findByFullyPackedFalse();
    Packing findByPurchase(Purchase purchase);

    List<Packing> findByPurchase_PurchaseInvoiceNo(String purchaseInvoiceNo);

}