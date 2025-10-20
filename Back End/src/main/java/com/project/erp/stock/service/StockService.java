package com.project.erp.stock.service;

import com.project.erp.stock.dto.StockDTO;
import com.project.erp.stock.entity.Stock;
import com.project.erp.stock.entity.StockLedger;

import java.util.List;

public interface StockService {

    Stock createOrUpdateStock(Long itemId, String color, String size, Integer quantity, Boolean active);

    List<Stock> getByItemId(Long itemId);

    void deactivateStock(Long itemId, String color, String size);

    List<StockDTO> getAllStocks();

    // 👇 New methods
    Stock adjustStockQuantity(Long stockId, Integer adjustedQuantity, String remarks);

    List<StockLedger> getStockLedgerByItem(Long itemId);
}
