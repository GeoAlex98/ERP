package com.project.erp.purchase.service;

import com.project.erp.order.entity.Orders;
import com.project.erp.purchase.entity.Purchase;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PurchaseService {

    Purchase createPurchase(Purchase purchase);
    Optional<Purchase> getPurchaseByInvoiceNo(String invoiceNo);
    Map<String, Object> getPurchaseDatesAndSuppliers();
    List<Purchase> getAllPurchases();
    List<Purchase> searchPurchases(String keyword);
    Optional<Purchase> updatePurchase(Long id, Purchase purchase);
    boolean deletePurchase(Long id);
    void sendForPacking(Long id);
}
