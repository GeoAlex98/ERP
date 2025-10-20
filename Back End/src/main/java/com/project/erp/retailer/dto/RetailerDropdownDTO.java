package com.project.erp.retailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RetailerDropdownDTO {
    private Long id;
    private String retailerCode;
    private String retailerName;
}
