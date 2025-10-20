package com.project.erp.item.repository;

import com.project.erp.item.entity.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {
    List<ItemImage> findByItemIdOrderByOrderIndexAsc(Long itemId);
}
