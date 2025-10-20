package com.project.erp.item.repository;

import com.project.erp.item.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContainingIgnoreCase(String name);

//    @EntityGraph(attributePaths = {"images"})
//    Optional<Item> findImagesById(Long id);
}
