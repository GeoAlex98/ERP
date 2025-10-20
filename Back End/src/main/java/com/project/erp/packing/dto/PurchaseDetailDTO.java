package com.project.erp.packing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PurchaseDetailDTO {
    private Long id;           // PurchaseDetail.id
    private String referenceNo;
    private String name;       // Item name
    private String color;
    private String size;
    private Integer quantity;  // ordered qty
    private Integer packed;    // packed qty (sum of PackingDetail)
}
