package com.project.erp.stock.controller;

import com.project.erp.stock.dto.StockDTO;
import com.project.erp.stock.entity.Stock;
import com.project.erp.stock.entity.StockLedger;
import com.project.erp.stock.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<Stock>> getStockByItem(@PathVariable Long itemId) {
        List<Stock> stockList = stockService.getByItemId(itemId);
        return ResponseEntity.ok(stockList);
    }

    @PostMapping("/update")
    public ResponseEntity<Stock> updateStock(@RequestParam Long itemId,
                                             @RequestParam String color,
                                             @RequestParam String size,
                                             @RequestParam Integer quantity) {
        Stock stock = stockService.createOrUpdateStock(itemId, color, size, quantity, true);
        return ResponseEntity.ok(stock);
    }

    @PostMapping("/deactivate")
    public ResponseEntity<String> deactivateStock(@RequestParam Long itemId,
                                                  @RequestParam String color,
                                                  @RequestParam String size) {
        stockService.deactivateStock(itemId, color, size);
        return ResponseEntity.ok("Stock deactivated successfully");
    }

    @GetMapping("/all")
    public ResponseEntity<List<StockDTO>> getAllStocks() {
        return ResponseEntity.ok(stockService.getAllStocks());
    }


    // 🧮 Manual Adjustment Endpoint
    @PostMapping("/adjust/{stockId}")
    public ResponseEntity<Stock> adjustStock(@PathVariable Long stockId,
                                             @RequestParam Integer adjustedQuantity,
                                             @RequestParam(required = false) String remarks) {
        Stock stock = stockService.adjustStockQuantity(stockId, adjustedQuantity, remarks);
        return ResponseEntity.ok(stock);
    }

    // 📊 Ledger view
    @GetMapping("/ledger/{itemId}")
    public ResponseEntity<List<StockLedger>> getStockLedgerByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(stockService.getStockLedgerByItem(itemId));
    }
}
