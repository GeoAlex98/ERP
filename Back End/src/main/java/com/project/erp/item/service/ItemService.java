package com.project.erp.item.service;

import com.project.erp.item.entity.Item;
import com.project.erp.item.entity.ItemImage;

import java.util.List;
import java.util.Optional;

public interface ItemService {
    Item createItem(Item item, List<ItemImage> images);
    Item updateItem(Long id, Item updatedItem, List<ItemImage> incomingImages, List<Long> imagesToDelete);
    Optional<Item> getItemById(Long id);
    List<Item> getAllItems();
    List<Item> searchItems(String keyword);
    String deleteItem(Long id);

//    ItemImage saveImage(Item item, String fileName, String url, int orderIndex) throws IOException;
    List<ItemImage> getImagesByItem(Long itemId);
    ItemImage getImage(Long id);
    void deleteImage(Long id);
}
