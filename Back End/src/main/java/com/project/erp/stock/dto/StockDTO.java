package com.project.erp.stock.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockDTO {
    private Long id;
    private String itemCode;
    private String name;
    private String color;
    private String size;
    private Integer stockQuantity;
    private Integer inPacking; // optional, dummy for now
}

