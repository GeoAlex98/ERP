package com.project.erp.stock.repository;

import com.project.erp.stock.entity.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {

    @Query("SELECT SUM(sl.quantity) FROM StockLedger sl WHERE sl.referenceNo = :referenceNo")
    Integer sumQuantityByReferenceNo(@Param("referenceNo") String referenceNo);

    List<StockLedger> findByStockIdOrderByDateDesc(Long stockId);

    List<StockLedger> findByItemIdOrderByDateDesc(Long itemId);

}
