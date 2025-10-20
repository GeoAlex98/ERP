package com.project.erp.stock.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.item.entity.Item;
import com.project.erp.item.repository.ItemRepository;
import com.project.erp.stock.dto.StockDTO;
import com.project.erp.stock.entity.Stock;
import com.project.erp.stock.entity.StockLedger;
import com.project.erp.stock.repository.StockLedgerRepository;
import com.project.erp.stock.repository.StockRepository;
import com.project.erp.stock.service.StockService;
import lombok.AllArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@AllArgsConstructor
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final ItemRepository itemRepository;
    private final FinancialYearService financialYearService;
    @Autowired
    private HibernateSessionProvider sessionProvider;

    @Override
    public Stock createOrUpdateStock(Long itemId, String color, String size, Integer quantity, Boolean active) {
        FinancialYear fy = financialYearService.getCurrentActiveFinYear();

        Stock stock = stockRepository.findByItemIdAndColorAndSize(itemId, color, size)
                .orElseGet(() -> {
                    Stock newStock = new Stock();
                    SharedSessionContractImplementor session = sessionProvider.getSharedSession();
                    Serializable code = new HeaderIdGenerator().generate(session, newStock);
                    newStock.setStockCode(code.toString());
                    Item item = itemRepository.findById(itemId)
                            .orElseThrow(() -> new RuntimeException("Item not found"));
                    newStock.setItem(item);
                    newStock.setColor(color);
                    newStock.setSize(size);
                    newStock.setFinYear(fy);
                    return newStock;
                });

        stock.setQuantity(quantity != null ? quantity : stock.getQuantity());
        stock.setActive(active != null ? active : stock.getActive());
        return stockRepository.save(stock);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Stock> getByItemId(Long itemId) {
        return stockRepository.findActiveStockByItem(itemId);
    }

    @Override
    public void deactivateStock(Long itemId, String color, String size) {
        stockRepository.findByItemIdAndColorAndSize(itemId, color, size)
                .ifPresent(s -> {
                    s.setActive(false);
                    stockRepository.save(s);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockDTO> getAllStocks() {
        List<Stock> stocks = stockRepository.findAllByActiveTrue();

        return stocks.stream().map(stock -> {
            StockDTO dto = new StockDTO();
            dto.setId(stock.getId());
            dto.setItemCode(stock.getItem().getItemCode());
            dto.setName(stock.getItem().getName());
            dto.setColor(stock.getColor());
            dto.setSize(stock.getSize());
            dto.setStockQuantity(stock.getQuantity());
            dto.setInPacking(0); // dummy for now
            return dto;
        }).toList();
    }

    // 🧮 Manual adjustment — creates StockLedger entry
    @Override
    public Stock adjustStockQuantity(Long stockId, Integer adjustedQuantity, String remarks) {
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        int oldQty = stock.getQuantity();
        int diff = adjustedQuantity - oldQty;
        if (diff == 0) return stock; // no change, skip ledger

        FinancialYear fy = financialYearService.getCurrentActiveFinYear();

        // Update stock quantity
        stock.setQuantity(adjustedQuantity);
        stockRepository.save(stock);

        // Add ledger record
        StockLedger ledger = new StockLedger();
        ledger.setStock(stock);
        ledger.setItem(stock.getItem());
        ledger.setQuantity(Math.abs(diff));
        ledger.setMovementType(diff > 0 ? "In" : "Out");
        ledger.setType("ADJUSTMENT");
        ledger.setReferenceNo("MANUAL-" + stock.getStockCode());
        ledger.setColor(stock.getColor());
        ledger.setSize(stock.getSize());
        ledger.setDate(LocalDateTime.now());
        ledger.setFinYear(fy);
        stockLedgerRepository.save(ledger);

        return stock;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedger> getStockLedgerByItem(Long itemId) {
        return stockLedgerRepository.findByItemIdOrderByDateDesc(itemId);
    }
}
