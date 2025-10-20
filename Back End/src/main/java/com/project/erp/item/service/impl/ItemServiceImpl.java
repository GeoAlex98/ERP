package com.project.erp.item.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.item.entity.Item;
import com.project.erp.item.entity.ItemImage;
import com.project.erp.item.repository.ItemImageRepository;
import com.project.erp.item.repository.ItemRepository;
import com.project.erp.item.service.ItemService;
import com.project.erp.stock.entity.Stock;
import com.project.erp.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final StockRepository stockRepository;
    private final FinancialYearService financialYearService;
    private final HeaderIdGenerator headerIdGen = new HeaderIdGenerator();

    @Autowired
    private HibernateSessionProvider sessionProvider;


    // ----------------- Create item -----------------
    @Override
    public Item createItem(Item item, List<ItemImage> images) {
        if (item.getItemCode() == null || item.getItemCode().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable code = new HeaderIdGenerator().generate(session, item);
            System.out.println("code===="+code);
            item.setItemCode(code.toString());
        }

        // 2️⃣ Compute profits
        double productionCost = Optional.ofNullable(item.getProductionCost()).orElse(0.0);
        double retailPrice = Optional.ofNullable(item.getRetailPrice()).orElse(0.0);
        double mrp = Optional.ofNullable(item.getMrp()).orElse(0.0);

        item.setBusinessProfit(retailPrice - productionCost);
        item.setBusinessProfitPercent(productionCost > 0 ? ((retailPrice - productionCost) / productionCost) * 100 : 0);
        item.setRetailerProfit(mrp - retailPrice);
        item.setRetailerMargin(mrp > 0 ? ((mrp - retailPrice) / mrp) * 100 : 0);

        // 3️⃣ Attach images and link parent
        if (images != null && !images.isEmpty()) {
//            int counter = 1;
            for (ItemImage img : images) {
//                if (img.getId() == null || img.getId().isEmpty()) {
//                    // Generate detail ID manually based on header
//                    String detailId = item.getId() + "-" + String.format("%02d", counter++);
//                    img.setId(detailId);
//                    System.out.println("detailId====="+detailId);
//                }
                img.setItem(item);
            }
            item.setImages(images);
        }

        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        System.out.println("fy===="+fy.getFinYrCode());
        item.setFinYear(fy);
        // 4️⃣ Save item (Hibernate will generate detail IDs)
        Item savedItem = itemRepository.save(item);

        // 5️⃣ Optional: update related tables (e.g., stock)
        SharedSessionContractImplementor session = sessionProvider.getSharedSession();
        updateStocks(savedItem, session);

        return savedItem;
    }

    @Override
    public Item updateItem(Long id, Item updatedItem, List<ItemImage> incomingImages, List<Long> imagesToDelete) {
        Item existingItem = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id " + id));
        System.out.println("-----------1111111111111111111111111111------------");
        // 1️⃣ Basic fields
        existingItem.setName(updatedItem.getName());
        existingItem.setCategory(updatedItem.getCategory());
        existingItem.setProductionCost(updatedItem.getProductionCost());
        existingItem.setRetailPrice(updatedItem.getRetailPrice());
        existingItem.setMrp(updatedItem.getMrp());
        existingItem.setSizes(updatedItem.getSizes());
        existingItem.setColors(updatedItem.getColors());
        existingItem.setDescription(updatedItem.getDescription());
        System.out.println("-----------2222222222222222------------");
        // 2️⃣ Profit recalculation
        double productionCost = Optional.ofNullable(existingItem.getProductionCost()).orElse(0.0);
        double retailPrice = Optional.ofNullable(existingItem.getRetailPrice()).orElse(0.0);
        double mrp = Optional.ofNullable(existingItem.getMrp()).orElse(0.0);

        existingItem.setBusinessProfit(retailPrice - productionCost);
        existingItem.setBusinessProfitPercent(productionCost > 0 ? ((retailPrice - productionCost) / productionCost) * 100 : 0);
        existingItem.setRetailerProfit(mrp - retailPrice);
        existingItem.setRetailerMargin(mrp > 0 ? ((mrp - retailPrice) / mrp) * 100 : 0);
        System.out.println("--------------333333333333333333333333---------");
        // 3️⃣ Delete removed images
        if (imagesToDelete != null && !imagesToDelete.isEmpty()) {
            imagesToDelete.forEach(itemImageRepository::deleteById);
        }
        System.out.println("------------44444444444444444-----------");
        // 4️⃣ Handle new + existing images
        List<ItemImage> existingImages = itemImageRepository.findByItemIdOrderByOrderIndexAsc(id);
//        int nextIndex = getNextDetailSuffix(existingItem.getId(), existingImages);

        for (ItemImage img : incomingImages) {
            if (img.getId() == null) {
//                // ➕ New image
//                String newId = existingItem.getId() + "-" + String.format("%02d", nextIndex++);
//                img.setId(newId);
                System.out.println("------------55555555555-----------");
                img.setItem(existingItem);
                itemImageRepository.save(img);
                System.out.println("------------6666666666-----------");
            } else {
                // 🔄 Existing image: update order index if changed
                ItemImage existing = existingImages.stream()
                        .filter(e -> e.getId().equals(img.getId()))
                        .findFirst()
                        .orElse(null);
                System.out.println("-----------777777777------------");
                if (existing != null) {
                    existing.setOrderIndex(img.getOrderIndex());
                    System.out.println("-----------888888888888888------------");
                    itemImageRepository.save(existing);
                }
            }
        }
        System.out.println("------------99999999999999-----------");
        // 5️⃣ Refresh the collection safely (no replacement)
        existingItem.getImages().clear();
        existingItem.getImages().addAll(itemImageRepository.findByItemIdOrderByOrderIndexAsc(id));
        System.out.println("----------000000000-------------");
        // 6️⃣ Update related stocks
        SharedSessionContractImplementor session = sessionProvider.getSharedSession();
        updateStocks(existingItem, session);
        System.out.println("------------123456789-----------");
        return itemRepository.save(existingItem);
    }


//    private int getNextDetailSuffix(String itemId, List<ItemImage> existingImages) {
//        return existingImages.stream()
//                .map(ItemImage::getId)
//                .filter(id -> id != null && id.startsWith(itemId + "-"))
//                .mapToInt(id -> {
//                    String[] parts = id.split("-");
//                    if (parts.length > 1) {
//                        try {
//                            return Integer.parseInt(parts[1]);
//                        } catch (NumberFormatException e) {
//                            return 0;
//                        }
//                    }
//                    return 0;
//                })
//                .max()
//                .orElse(0) + 1;
//    }

    // =====================================================
    // ✅ Save individual image
    // =====================================================
//    @Override
//    public ItemImage saveImage(Item item, String fileName, String url, int orderIndex) {
//        Item managedItem = itemRepository.getReferenceById(item.getId());
//        ItemImage img = new ItemImage();
//        img.setFileName(fileName);
//        img.setUrl(url);
//        img.setItem(managedItem);
//        img.setOrderIndex(orderIndex);
//        return itemImageRepository.save(img);
//    }

    // =====================================================
    // ✅ Stock synchronization logic
    // =====================================================
    private void updateStocks(Item savedItem, SharedSessionContractImplementor session) {
        List<Stock> existingStocks = stockRepository.findByItemId(savedItem.getId());

        // Disable obsolete combinations
        for (Stock s : existingStocks) {
            boolean colorExists = savedItem.getColors().contains(s.getColor());
            boolean sizeExists = savedItem.getSizes().contains(s.getSize());
            s.setActive(colorExists && sizeExists);
            stockRepository.save(s);
        }

        // Add new combinations
        Stock newStock;
        Serializable code;
        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        System.out.println("fy===="+fy.getFinYrCode());

        for (String color : savedItem.getColors()) {
            for (String size : savedItem.getSizes()) {
                boolean exists = existingStocks.stream()
                        .anyMatch(s -> s.getColor().equals(color) && s.getSize().equals(size));
                if (!exists) {
                    newStock = new Stock();
                    code = new HeaderIdGenerator().generate(session, newStock);
                        System.out.println("code===="+code);
                    newStock.setStockCode(code.toString());
                    newStock.setItem(savedItem);
                    newStock.setColor(color);
                    newStock.setSize(size);
                    newStock.setQuantity(0);
                    newStock.setActive(true);
                    newStock.setFinYear(fy);
                    stockRepository.save(newStock);
                }
            }
        }
    }

    // ----------------- Other CRUD -----------------
    @Override
    @Transactional(readOnly = true)
    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }
//    @Override
//    @Transactional(readOnly = true)
//    public Optional<Item> getItemById(Long id) {
//        return itemRepository.findWithCollectionsById(id);
//    }
    @Override
    @Transactional(readOnly = true)
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Item> searchItems(String keyword) {
        return itemRepository.findAll().stream()
                .filter(i -> i.getName() != null && i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .toList();
    }

    @Override
    public String deleteItem(Long id) {
        // Fetch all stock entries linked to this item
        List<Stock> stocks = stockRepository.findByItemId(id);

        // If no stock found, just delete the item safely
        if (stocks == null || stocks.isEmpty()) {
            itemRepository.deleteById(id);
            return "Item deleted successfully (no stock found).";
        }

        // Check if any stock has quantity > 0
        boolean hasPositiveStock = stocks.stream()
                .anyMatch(stock -> stock.getQuantity() > 0);

        if (hasPositiveStock) {
            return "Cannot delete item. Stock still contains positive quantity.";
        }

        // All quantities ≤ 0 → safe to delete
        stockRepository.deleteAll(stocks);
        itemRepository.deleteById(id);

        return "Item deleted successfully.";
    }


    @Override
    @Transactional(readOnly = true)
    public List<ItemImage> getImagesByItem(Long itemId) {
        return itemImageRepository.findByItemIdOrderByOrderIndexAsc(itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemImage getImage(Long imageId) {
        return itemImageRepository.findById(imageId).orElse(null);
    }

    @Override
    public void deleteImage(Long imageId) {
        itemImageRepository.deleteById(imageId);
    }

}
