package com.project.erp.packing.dto;

import lombok.Data;

@Data
public class PackUpdateDTO {
    private Long purchaseDetailId;
    private String referenceNo;
    private Integer packedQuantity;
}

