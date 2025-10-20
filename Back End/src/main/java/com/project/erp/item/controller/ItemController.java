package com.project.erp.item.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.erp.item.entity.Item;
import com.project.erp.item.entity.ItemImage;
import com.project.erp.item.service.ItemService;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;
    private ObjectMapper objectMapper;

    private static final String UPLOAD_DIR = "uploads/";

    public ItemController(ItemService itemService, ObjectMapper objectMapper) {
        this.itemService = itemService;
        this.objectMapper = objectMapper;
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory", e);
        }
    }

    // ----------------- HOME / LIST -----------------
    @GetMapping("/home")
    public ResponseEntity<List<Map<String, Object>>> getItemsForHome(
            @RequestParam(required = false) String search
    ) {
        List<Item> items = (search != null && !search.trim().isEmpty())
                ? itemService.searchItems(search)
                : itemService.getAllItems();

        List<Map<String, Object>> dtoList = items.stream().map(item -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("name", item.getName());
            map.put("retailPrice", item.getRetailPrice());
            map.put("mrp", item.getMrp());

            String safeItemName = item.getName().replaceAll("[^a-zA-Z0-9-_]", "_");
            String thumbUrl = "/uploads/items/" + safeItemName + "/thumbnail.png";
            map.put("thumbnail", thumbUrl);

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemDetails(@PathVariable Long id) {
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (item.getImages() != null) {
            item.getImages().sort(Comparator.comparing(ItemImage::getOrderIndex));
        }

        return ResponseEntity.ok(item);
    }

    @GetMapping
    public ResponseEntity<List<Item>> getAllItems(@RequestParam(required = false) String keyword) {
        List<Item> items = (keyword != null && !keyword.trim().isEmpty())
                ? itemService.searchItems(keyword)
                : itemService.getAllItems();

        items.forEach(i -> {
            if (i.getImages() != null) {
                i.getImages().sort(Comparator.comparing(ItemImage::getOrderIndex));
            }
        });

        return ResponseEntity.ok(items);
    }

    // ----------------- FILE HELPERS -----------------
    private String saveFileAndGetUrl(MultipartFile file, String itemName, boolean isFirstImage) throws IOException {
        String safeItemName = itemName.replaceAll("[^a-zA-Z0-9-_]", "_");
        Path itemDir = Paths.get(UPLOAD_DIR, "items", safeItemName);
        Files.createDirectories(itemDir);

        String fileName = file.getOriginalFilename();
        Path filePath = itemDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        if (isFirstImage) {
            Path thumbPath = itemDir.resolve("thumbnail.png");
            Thumbnails.of(filePath.toFile())
                    .size(200, 200)
                    .toFile(thumbPath.toFile());
        }

        return "/uploads/items/" + safeItemName + "/" + fileName;
    }

    private void deleteFileIfExists(String url) {
        if (url != null && url.startsWith("/uploads/items/")) {
            String relativePath = url.replace("/uploads/", "");
            Path filePath = Paths.get(UPLOAD_DIR).resolve(relativePath);
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private void regenerateThumbnail(String itemName, String fileName) throws IOException {
        String safeItemName = itemName.replaceAll("[^a-zA-Z0-9-_]", "_");
        Path itemDir = Paths.get(UPLOAD_DIR, "items", safeItemName);
        Path filePath = itemDir.resolve(fileName);
        Path thumbPath = itemDir.resolve("thumbnail.png");

        if (Files.exists(filePath)) {
            Thumbnails.of(filePath.toFile())
                    .size(200, 200)
                    .toFile(thumbPath.toFile());
        }
    }

    // ----------------- CREATE ITEM -----------------
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Item> createItem(
            @RequestPart("item") Item item,
            MultipartHttpServletRequest multipartRequest,
            @RequestPart(value = "finalOrder", required = false) String finalOrderJson
    ) throws IOException {

        List<ItemImage> images = new ArrayList<>();
        if (finalOrderJson != null && !finalOrderJson.isEmpty()) {
            List<Map<String,Object>> finalOrder = objectMapper.readValue(
                    finalOrderJson, new TypeReference<List<Map<String,Object>>>() {}
            );

            for (int i = 0; i < finalOrder.size(); i++) {
                Map<String,Object> entry = finalOrder.get(i);
                if (entry.containsKey("tempId")) {
                    String tempId = entry.get("tempId").toString();
                    MultipartFile file = multipartRequest.getFile("newImage_" + tempId);
                    if (file != null && !file.isEmpty()) {
                        String url = saveFileAndGetUrl(file, item.getName(), i == 0);
                        ItemImage img = new ItemImage();
                        img.setFileName(file.getOriginalFilename());
                        img.setUrl(url);
                        img.setOrderIndex(i);
                        images.add(img);
                    }
                }
            }
        }

        Item savedItem = itemService.createItem(item, images);

        return ResponseEntity.ok(savedItem);
    }


    // ----------------- UPDATE ITEM -----------------
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Item> updateItem(
            @PathVariable Long id,
            @RequestPart("item") Item updatedItem,
            @RequestPart(value = "imagesToDelete", required = false) String imagesToDeleteJson,
            @RequestPart(value = "finalOrder", required = false) String finalOrderJson,
            MultipartHttpServletRequest multipartRequest
    ) throws IOException {

        List<ItemImage> incomingImages = new ArrayList<>();
        System.out.println("-------------AAAAAAAAAAAAAAAAAAAAAA----------");
        // Parse new + existing image order
        if (finalOrderJson != null && !finalOrderJson.isEmpty()) {
            List<Map<String, Object>> finalOrder = objectMapper.readValue(
                    finalOrderJson, new TypeReference<List<Map<String, Object>>>() {}
            );
            System.out.println("------------ZZZZZZ-----------");
            int orderIndex;
            for (int i = 0; i < finalOrder.size(); i++) {
                Map<String, Object> entry = finalOrder.get(i);
                orderIndex = i;
                System.out.println("------------XXXXX-----------");
                // Existing image reference
                if (entry.containsKey("id") && entry.get("id") != null) {
                    Number idNum = (Number) entry.get("id");
                    Long imageId = idNum.longValue();
                    ItemImage existing = new ItemImage();
                    existing.setId(imageId);
                    System.out.println("------------WWWWWWW-----------");
                    existing.setOrderIndex(orderIndex);
                    incomingImages.add(existing);
                }

                // New image
                else if (entry.containsKey("tempId") && entry.get("tempId") != null) {
                    String tempId = entry.get("tempId").toString();
                    MultipartFile file = multipartRequest.getFile("newImage_" + tempId);
                    if (file != null && !file.isEmpty()) {
                        String url = saveFileAndGetUrl(file, updatedItem.getName(), orderIndex == 0);
                        ItemImage newImg = new ItemImage();
                        newImg.setFileName(file.getOriginalFilename());
                        newImg.setUrl(url);
                        System.out.println("----------QQQQQQQQQQQQQQQQQ-------------");
                        newImg.setOrderIndex(orderIndex);
                        incomingImages.add(newImg);
                    }
                }
            }
        }

        // Deleted images
        List<Long> imagesToDelete = new ArrayList<>();
        if (imagesToDeleteJson != null && !imagesToDeleteJson.isEmpty()) {
            imagesToDelete = objectMapper.readValue(imagesToDeleteJson, new TypeReference<List<Long>>() {});
            for (Long imageId : imagesToDelete) {
                ItemImage img = itemService.getImage(imageId);
                if (img != null) deleteFileIfExists(img.getUrl());
            }
        }

        Item savedItem = itemService.updateItem(id, updatedItem, incomingImages, imagesToDelete);
        System.out.println("-----------EEEEEEEEEEEEEEEEEE------------");
        // Regenerate thumbnail if first image changed
        if (savedItem.getImages() != null && !savedItem.getImages().isEmpty()) {
            regenerateThumbnail(savedItem.getName(), savedItem.getImages().get(0).getFileName());
        }

        return ResponseEntity.ok(savedItem);
    }





    // ----------------- DELETE ITEM -----------------
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteItem(@PathVariable Long id) {
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id " + id));

        // Try deleting and get result message
        String message = itemService.deleteItem(id);

        // If deletion was blocked due to stock quantity > 0
        if (message.contains("Cannot delete item")) {
            return ResponseEntity.badRequest().body(message);
        }

        // Delete associated image files if deletion succeeded
//        if (item.getImages() != null) {
//            for (ItemImage img : item.getImages()) {
//                deleteFileIfExists(img.getUrl());
//            }
//
//
//        }
        deleteItemFolder(item.getName());

        return ResponseEntity.ok(message);
    }

    private void deleteItemFolder(String itemName) {
        try {
            String safeItemName = itemName.replaceAll("[^a-zA-Z0-9-_]", "_");
            Path itemFolder = Paths.get(UPLOAD_DIR, "items", safeItemName);

            if (Files.exists(itemFolder)) {
                // Delete folder recursively (Java 8+)
                Files.walk(itemFolder)
                        .sorted(Comparator.reverseOrder()) // delete files before folders
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                                System.out.println("🗑️ Deleted: " + path);
                            } catch (IOException e) {
                                System.err.println("⚠️ Failed to delete " + path + ": " + e.getMessage());
                            }
                        });
                System.out.println("✅ Folder deleted: " + itemFolder.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("⚠️ Error deleting folder: " + e.getMessage());
        }
    }


    // ----------------- IMAGE ENDPOINTS -----------------
//    @PostMapping("/{itemId}/images")
//    @Transactional
//    public ResponseEntity<ItemImage> uploadImage(
//            @PathVariable Long itemId,
//            @RequestParam("file") MultipartFile file
//    ) throws IOException {
//        Item item = itemService.getItemById(itemId)
//                .orElseThrow(() -> new RuntimeException("Item not found"));
//
//        String url = saveFileAndGetUrl(file, item.getName(), false);
//        ItemImage saved = itemService.saveImage(item, file.getOriginalFilename(), url, 0);
//
//        return ResponseEntity.ok(saved);
//    }

    @GetMapping("/{itemId}/images")
    public ResponseEntity<List<ItemImage>> getItemImages(@PathVariable Long itemId) {
        return ResponseEntity.ok(itemService.getImagesByItem(itemId));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<String> deleteImage(@PathVariable Long imageId) {
        ItemImage img = itemService.getImage(imageId);
        if (img != null) {
            deleteFileIfExists(img.getUrl());
            itemService.deleteImage(imageId);
            return ResponseEntity.ok("Image deleted successfully");
        }
        return ResponseEntity.notFound().build();
    }

    // ----------------- DROPDOWN -----------------
    @GetMapping("/dropdown")
    public ResponseEntity<List<Map<String, Object>>> getItemsDropdown() {
        List<Item> items = itemService.getAllItems();
        List<Map<String, Object>> dtoList = items.stream().map(item -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("name", item.getName());
            map.put("sizes", item.getSizes() != null ? item.getSizes() : Collections.emptyList());
            map.put("colors", item.getColors() != null ? item.getColors() : Collections.emptyList());
            map.put("price", item.getProductionCost() != null ? item.getProductionCost() : 0.0);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }
}
