package com.project.erp.packing.controller;

import com.project.erp.packing.dto.PackUpdateDTO;
import com.project.erp.packing.dto.PurchaseDTO;
import com.project.erp.packing.service.PackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/packing")
@RequiredArgsConstructor
public class PackingController {

    private final PackingService packingService;

    @GetMapping("/not-packed")
    public List<PurchaseDTO> getNotPackedPurchases() {
        return packingService.getNotPackedPurchases();
    }

    @PostMapping("/update-stock")
    public void packAndMoveToStock(@RequestBody Map<String, List<PackUpdateDTO>> itemsByPurchase) {
        System.out.println("Received grouped payload: " + itemsByPurchase);
        packingService.packAndMoveToStock(itemsByPurchase);
    }
}
