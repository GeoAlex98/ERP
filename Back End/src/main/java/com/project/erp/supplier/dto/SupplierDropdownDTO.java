package com.project.erp.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SupplierDropdownDTO {
    private Long id;
    private String supplierCode;
    private String supplierName;
}
