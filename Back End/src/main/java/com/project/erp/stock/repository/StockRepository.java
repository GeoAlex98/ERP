package com.project.erp.stock.repository;

import com.project.erp.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByItemIdAndColorAndSize(Long itemId, String color, String size);

    List<Stock> findByItemId(Long id);

    List<Stock> findAllByActiveTrue();

    @Query("SELECT s FROM Stock s WHERE s.item.id = :itemId AND s.active = true ORDER BY s.color, s.size")
    List<Stock> findActiveStockByItem(Long itemId);

}
