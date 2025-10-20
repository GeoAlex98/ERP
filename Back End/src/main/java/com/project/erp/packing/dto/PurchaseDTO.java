package com.project.erp.packing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PurchaseDTO {
    private String id;                 // purchaseInvoiceNo
    private String purchaseNumber;     // duplicate for UI
    private LocalDate date;            // purchaseDate
    private List<PurchaseDetailDTO> items;
}
