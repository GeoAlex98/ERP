package com.project.erp.purchase.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.item.entity.Item;
import com.project.erp.item.repository.ItemRepository;
import com.project.erp.packing.entity.Packing;
import com.project.erp.packing.entity.PackingDetail;
import com.project.erp.packing.repository.PackingDetailRepository;
import com.project.erp.packing.repository.PackingRepository;
import com.project.erp.purchase.entity.Purchase;
import com.project.erp.purchase.entity.PurchaseDetail;
import com.project.erp.purchase.repository.PurchaseRepository;
import com.project.erp.purchase.service.PurchaseService;
import com.project.erp.supplier.entity.Supplier;
import com.project.erp.supplier.repository.SupplierRepository;
import lombok.AllArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;
    private final FinancialYearService financialYearService;
    @Autowired
    private HibernateSessionProvider sessionProvider;


    public Purchase createPurchase(Purchase purchase) {
//        LocalDate today = LocalDate.now();
//        purchase.setPurchaseDate(today);

        Supplier supplier = supplierRepository.findById(
                purchase.getSupplier().getId()
        ).orElseThrow(() -> new RuntimeException("Supplier not found"));

        purchase.setSupplier(supplier);

        // 1️⃣ Generate header ID if missing
        if (purchase.getPurchaseInvoiceNo() == null || purchase.getPurchaseInvoiceNo().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable invoiceNo = new HeaderIdGenerator().generate(session, purchase);
            purchase.setPurchaseInvoiceNo(invoiceNo.toString());
            System.out.println("Generated invoiceNo === " + invoiceNo);
        }

        // 2️⃣ Link details + generate detail IDs
        if (purchase.getPurchaseDetail() != null && !purchase.getPurchaseDetail().isEmpty()) {
            int counter = 1;
            for (PurchaseDetail detail : purchase.getPurchaseDetail()) {
                if (detail.getReferenceNo() == null || detail.getReferenceNo().isEmpty()) {
                    String referenceNo = purchase.getPurchaseInvoiceNo() + "-" + String.format("%02d", counter++);
                    detail.setReferenceNo(referenceNo);
                }
                detail.setPurchase(purchase);
            }
        }

        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        purchase.setFinYear(fy);

        return purchaseRepository.save(purchase);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Purchase> getPurchaseByInvoiceNo(String invoiceNo) {
        return purchaseRepository.findByPurchaseInvoiceNo(invoiceNo).map(purchase -> {
            if (purchase.getPurchaseDetail() != null) {
                purchase.getPurchaseDetail().forEach(pi -> {
                    Item item = itemRepository.findById(pi.getItem().getId())
                            .orElse(null);
                    if (item != null) {
                        pi.setSizesForItem(item.getSizes());
                        pi.setColorsForItem(item.getColors());
                    }
                });
            }
            return purchase;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Purchase> searchPurchases(String keyword) {
        System.out.println("keyword==="+keyword);
        String lowerKeyword = keyword.toLowerCase();
        return purchaseRepository.findAll().stream()
                .filter(p -> {
                    boolean matchInvoiceNo = p.getPurchaseInvoiceNo() != null &&
                            p.getPurchaseInvoiceNo().toLowerCase().contains(lowerKeyword);

                    boolean matchSupplier = p.getSupplier() != null &&
                            p.getSupplier().getSupplierName() != null &&
                            p.getSupplier().getSupplierName().toLowerCase().contains(lowerKeyword);

                    return matchInvoiceNo || matchSupplier;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseDatesAndSuppliers() {
        List<Purchase> allPurchases = purchaseRepository.findAll();

        // Unique dates in ISO format, latest first
        List<String> dates = allPurchases.stream()
                .map(p -> p.getPurchaseDate() != null ? p.getPurchaseDate().toString() : null)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder()) // descending
                .collect(Collectors.toList());

        // Unique suppliers
        List<Supplier> suppliers = allPurchases.stream()
                .map(Purchase::getSupplier)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(Supplier::getSupplierName))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("dates", dates);
        result.put("suppliers", suppliers);
        return result;
    }


    @Override
    @Transactional(readOnly = true)
    public List<Purchase> getAllPurchases() {
        List<Purchase> all = purchaseRepository.findAll();

        all.sort(Comparator.comparing(Purchase::getPurchaseDate)
                .thenComparing(Purchase::getPurchaseInvoiceNo)
                .reversed());
        return all;
    }

    @Override
    public Optional<Purchase> updatePurchase(Long id, Purchase updatedPurchase) {
        return purchaseRepository.findById(id).map(existing -> {

            // --- Update header fields ---
            existing.setPurchaseDate(updatedPurchase.getPurchaseDate());
            existing.setSupplier(updatedPurchase.getSupplier());
            existing.setTotalAmount(updatedPurchase.getTotalAmount());

            int maxSeq = existing.getPurchaseDetail().stream()
                    .map(PurchaseDetail::getReferenceNo)
                    .map(ref -> ref.substring(ref.lastIndexOf('-') + 1)) // get XX part
                    .mapToInt(Integer::parseInt)
                    .max()
                    .orElse(0);
            // --- Handle PurchaseDetails safely ---
            List<PurchaseDetail> newDetails = updatedPurchase.getPurchaseDetail() != null
                    ? updatedPurchase.getPurchaseDetail()
                    : new ArrayList<>();

            // 1️⃣ Remove details that no longer exist
            existing.getPurchaseDetail().removeIf(oldDetail ->
                    newDetails.stream().noneMatch(nd -> nd.getId() != null && nd.getId().equals(oldDetail.getId()))
            );

            // 2️⃣ Update existing or add new
            int nextIndex = existing.getPurchaseDetail().size() + 1;

            for (PurchaseDetail newDetail : newDetails) {
                // If detail already exists, update its fields
                Optional<PurchaseDetail> existingDetailOpt = existing.getPurchaseDetail().stream()
                        .filter(d -> d.getId() != null && d.getId().equals(newDetail.getId()))
                        .findFirst();

                if (existingDetailOpt.isPresent()) {
                    PurchaseDetail existingDetail = existingDetailOpt.get();
                    existingDetail.setItem(newDetail.getItem());
                    existingDetail.setQuantity(newDetail.getQuantity());
                    existingDetail.setPrice(newDetail.getPrice());
                    existingDetail.setTotalAmt(newDetail.getTotalAmt());
                    existingDetail.setSize(newDetail.getSize());
                    existingDetail.setColor(newDetail.getColor());
                } else {
                    // Otherwise, it's a new detail — generate new ID if needed
                    String referenceNo = existing.getPurchaseInvoiceNo() + "-" + String.format("%02d", ++maxSeq);
                    newDetail.setReferenceNo(referenceNo);
                    newDetail.setPurchase(existing);
                    existing.getPurchaseDetail().add(newDetail);

                    System.out.println("✅ New detail added successfully (linked to Purchase ID: " + existing.getId() + ")");
                }
            }
            // --- Finally save ---
            return purchaseRepository.save(existing);
        });
    }


    @Override
    public boolean deletePurchase(Long id) {
        if (purchaseRepository.existsById(id)) {
            purchaseRepository.deleteById(id);
            return true;
        }
        return false;
    }


    private final PackingRepository packingRepository;
    private final PackingDetailRepository packingDetailRepository;

    public void sendForPacking(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found"));

        if (Boolean.TRUE.equals(purchase.getSendForPacked())) {
            throw new RuntimeException("Purchase already sent for packing");
        }

        // Mark as sent for packing
        purchase.setSendForPacked(true);
        purchaseRepository.save(purchase);

        Packing packing = new Packing();
        SharedSessionContractImplementor session = sessionProvider.getSharedSession();
        Serializable packingNo = new HeaderIdGenerator().generate(session, packing);
        System.out.println("Generated packingNo === " + packingNo);
        FinancialYear fy = financialYearService.getCurrentActiveFinYear();

        // Create Packing entry
        packing = Packing.builder()
                .packingNo(packingNo.toString())
                .purchase(purchase)
                .packedDate(LocalDate.now())
                .fullyPacked(false)
                .finYear(fy)
                .build();
        packingRepository.save(packing);

        int counter=1;
        // Create PackingDetail entries for each purchase item
        for (PurchaseDetail pi : purchase.getPurchaseDetail()) {
                String referenceNo = purchase.getPurchaseInvoiceNo() + "-" + String.format("%02d", counter++);
            if (pi.getQuantity() != null && pi.getQuantity() > 0) {
                PackingDetail packingDetail = PackingDetail.builder()
                        .referenceNo(referenceNo)
                        .packing(packing)
                        .purchaseDetail(pi)
                        .packedQuantity(0)
                        .fullyPacked(false)
                        .build();
                packingDetailRepository.save(packingDetail);
            }
        }
    }
}