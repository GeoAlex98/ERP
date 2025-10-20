package com.project.erp.packing.service.impl;

import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.packing.dto.PackUpdateDTO;
import com.project.erp.packing.dto.PurchaseDTO;
import com.project.erp.packing.dto.PurchaseDetailDTO;
import com.project.erp.packing.entity.Packing;
import com.project.erp.packing.entity.PackingDetail;
import com.project.erp.packing.repository.PackingDetailRepository;
import com.project.erp.packing.repository.PackingRepository;
import com.project.erp.packing.service.PackingService;
import com.project.erp.purchase.entity.Purchase;
import com.project.erp.stock.entity.Stock;
import com.project.erp.stock.entity.StockLedger;
import com.project.erp.stock.repository.StockLedgerRepository;
import com.project.erp.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PackingServiceImpl implements PackingService {

    private final PackingRepository packingRepository;
    private final PackingDetailRepository packingDetailRepository;
    private final StockRepository stockRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final FinancialYearService financialYearService;

    // === 1️⃣ Track packing progress only ===
    @Override
    public void packAndMoveToStock(Map<String, List<PackUpdateDTO>> purchaseMap) {

        for (Map.Entry<String, List<PackUpdateDTO>> entry : purchaseMap.entrySet()) {
            String purchaseInvoiceNo = entry.getKey();
            List<PackUpdateDTO> itemsForPurchase = entry.getValue();

            // Get all packings for this purchase
            List<Packing> packings = packingRepository.findByPurchase_PurchaseInvoiceNo(purchaseInvoiceNo);

            for (Packing packing : packings) {
                // Process only those DTOs that actually belong to this packing
                for (PackUpdateDTO dto : itemsForPurchase) {
                    // Try to find PackingDetail under this packing for the given purchaseDetailId
                    PackingDetail packedItem = packingDetailRepository
                            .findByPackingIdAndPurchaseDetailId(packing.getId(), dto.getPurchaseDetailId())
                            .orElse(null);

                    if (packedItem == null) {
                        // This DTO does not belong to this packing — skip it
                        continue;
                    }

                    int packedQty = dto.getPackedQuantity() != null ? dto.getPackedQuantity() : 0;
                    packedItem.setPackedQuantity(packedQty);
                    packedItem.setFullyPacked(packedQty == packedItem.getPurchaseDetail().getQuantity());
                    packingDetailRepository.save(packedItem);

                    // Incremental stock & ledger
                    Integer alreadyMovedQty = stockLedgerRepository.sumQuantityByReferenceNo(dto.getReferenceNo());
                    if (alreadyMovedQty == null) alreadyMovedQty = 0;

                    int remainingQty = packedQty - alreadyMovedQty;
                    if (remainingQty > 0) {
                        Stock stock = stockRepository.findByItemIdAndColorAndSize(
                                packedItem.getPurchaseDetail().getItem().getId(),
                                packedItem.getPurchaseDetail().getColor(),
                                packedItem.getPurchaseDetail().getSize()
                        ).orElseThrow(() -> new RuntimeException("Stock not found"));

                        stock.setQuantity(stock.getQuantity() + remainingQty);
                        stockRepository.save(stock);

                        StockLedger ledger = new StockLedger();
                        ledger.setStock(stock);
                        ledger.setItem(stock.getItem());
                        ledger.setColor(stock.getColor());
                        ledger.setSize(stock.getSize());
                        ledger.setQuantity(remainingQty);
                        ledger.setMovementType("In");
                        ledger.setType("Purchase");
                        ledger.setReferenceNo(dto.getReferenceNo());
                        ledger.setDate(LocalDateTime.now());

                        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
                        ledger.setFinYear(fy);
                        stockLedgerRepository.save(ledger);
                    }
                }

                // --- Now check ALL PackingDetail for this packing from DB ---
                List<PackingDetail> allItemsForPacking = packingDetailRepository.findByPackingId(packing.getId());

                boolean allPacked = allItemsForPacking.stream().allMatch(pi -> {
                    Integer packedQ = pi.getPackedQuantity() == null ? 0 : pi.getPackedQuantity();
                    Integer requiredQ = pi.getPurchaseDetail() != null && pi.getPurchaseDetail().getQuantity() != null
                            ? pi.getPurchaseDetail().getQuantity()
                            : 0;
                    return packedQ >= requiredQ; // treat >= as fully packed (safe)
                });

                // Only update header if its state actually changes
                if (packing.getFullyPacked() == null || packing.getFullyPacked() != allPacked) {
                    packing.setFullyPacked(allPacked);
                    packingRepository.save(packing);
                }
            }
        }
    }

    // === 3️⃣ Fetch not packed purchases ===
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseDTO> getNotPackedPurchases() {
        List<PackingDetail> notPackedItems = packingDetailRepository.fetchNotPackedItems();

        // Group by Purchase
        Map<String, List<PackingDetail>> grouped = notPackedItems.stream()
                .collect(Collectors.groupingBy(pi -> pi.getPurchaseDetail().getPurchase().getPurchaseInvoiceNo()));

        List<PurchaseDTO> result = new ArrayList<>();

        for (var entry : grouped.entrySet()) {
            List<PackingDetail> items = entry.getValue();

            List<PurchaseDetailDTO> itemDTOs = items.stream().map(pi -> {
                var pItem = pi.getPurchaseDetail();
                return PurchaseDetailDTO.builder()
                        .id(pItem.getId())
                        .referenceNo(pItem.getReferenceNo())
                        .name(pItem.getItem().getName())
                        .color(pItem.getColor())
                        .size(pItem.getSize())
                        .quantity(pItem.getQuantity())
                        .packed(pi.getPackedQuantity() != null ? pi.getPackedQuantity() : 0)
                        .build();
            }).toList();

            Purchase purchase = items.get(0).getPurchaseDetail().getPurchase();
            result.add(PurchaseDTO.builder()
                    .id(purchase.getPurchaseInvoiceNo())
                    .purchaseNumber(purchase.getPurchaseInvoiceNo())
                    .date(purchase.getPurchaseDate())
                    .items(itemDTOs)
                    .build());
        }

        return result;
    }
}
