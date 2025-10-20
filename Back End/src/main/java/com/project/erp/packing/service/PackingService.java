package com.project.erp.packing.service;

import com.project.erp.packing.dto.PackUpdateDTO;
import com.project.erp.packing.dto.PurchaseDTO;

import java.util.List;
import java.util.Map;

public interface PackingService {

    List<PurchaseDTO> getNotPackedPurchases();
    void packAndMoveToStock(Map<String, List<PackUpdateDTO>> purchaseMap);
}
