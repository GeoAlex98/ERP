package com.project.erp.purchase.controller;

import com.project.erp.order.entity.Orders;
import com.project.erp.purchase.entity.Purchase;
import com.project.erp.purchase.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/purchase")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    // ✅ Create or Save a Purchase
    @PostMapping
    public ResponseEntity<Purchase> savePurchase(@RequestBody Purchase purchase) {
        Purchase saved = purchaseService.createPurchase(purchase);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Purchase>> getAllItems(@RequestParam(required = false) String keyword) {
        List<Purchase> purchase = (keyword != null && !keyword.trim().isEmpty())
                ? purchaseService.searchPurchases(keyword)
                : purchaseService.getAllPurchases();

        return ResponseEntity.ok(purchase);
    }

    // ✅ Get Purchase by ID (search by Purchase No)
    @GetMapping("/{invoiceNo}")
    public ResponseEntity<Purchase> getPurchase(@PathVariable String invoiceNo) {
        Optional<Purchase> purchase = purchaseService.getPurchaseByInvoiceNo(invoiceNo);
        return purchase.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dates-and-suppliers")
    public ResponseEntity<Map<String, Object>> getDatesAndSuppliers() {
        Map<String, Object> result = purchaseService.getPurchaseDatesAndSuppliers();
        return ResponseEntity.ok(result);
    }

    // ✅ Get all purchases (for list/search dropdown)
    @GetMapping("/all")
    public List<Purchase> getAllPurchases() {
        return purchaseService.getAllPurchases();
    }

    // ✅ Update Purchase
    @PutMapping("/{id}")
    public ResponseEntity<Purchase> updatePurchase(@PathVariable Long id, @RequestBody Purchase purchase) {
        Optional<Purchase> updated = purchaseService.updatePurchase(id, purchase);
        return updated.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // ✅ Delete Purchase
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchase(@PathVariable Long id) {
        boolean deleted = purchaseService.deletePurchase(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/send-for-packing")
    public ResponseEntity<Void> sendForPacking(@PathVariable Long id) {
        purchaseService.sendForPacking(id);
        return ResponseEntity.ok().build();
    }
}
