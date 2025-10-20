package com.project.erp.retailer.controller;

import com.project.erp.retailer.dto.RetailerDropdownDTO;
import com.project.erp.retailer.entity.Retailer;
import com.project.erp.retailer.service.RetailerService;
import com.project.erp.supplier.dto.SupplierDropdownDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/retailers")
@CrossOrigin(origins = "*")
public class RetailerController {

    private final RetailerService retailerService;

    @Autowired
    public RetailerController(RetailerService retailerService) {
        this.retailerService = retailerService;
    }

//    // --- Get all retailers ---
//    @GetMapping("/all")
//    public ResponseEntity<List<Retailer>> getAllRetailers() {
//        List<Retailer> retailers = retailerService.getAllRetailers();
//        return ResponseEntity.ok(retailers);
//    }

    // --- Search retailer ---
    @GetMapping
    public List<Retailer> getRetailers(@RequestParam(required = false) String search) {
        return retailerService.searchRetailers(search);
    }

    // --- Create new retailer ---
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createRetailer(
            @RequestPart("retailer") Retailer retailer,
            @RequestPart(value = "retailerImage", required = false) MultipartFile retailerImage
    ) {
        try {
            System.out.println("retailer========="+retailer);
            Retailer created = retailerService.createRetailer(retailer, retailerImage);
            return ResponseEntity.ok(created);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone, Email, or GST number already exists"));
        }
    }

    // --- Update existing retailer ---
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateRetailer(
            @PathVariable Long id,
            @RequestPart("retailer") Retailer retailerDetails,
            @RequestPart(value = "retailerImage", required = false) MultipartFile retailerImage
    ) {
        try {
            Retailer updated = retailerService.updateRetailer(id, retailerDetails, retailerImage);
            return ResponseEntity.ok(updated);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone, Email, or GST number already exists"));
        }
    }

    // --- Delete retailer ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRetailer(@PathVariable Long id) {
        retailerService.deleteRetailer(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/retailers/{id}/pendingAmount")
    public Double getPendingAmount(@PathVariable Long id) {
        return retailerService.getPendingAmount(id);
    }

    @GetMapping("/dropdown")
    public List<RetailerDropdownDTO> getRetailerForDropdown() {
        return retailerService.findAllActiveRetailersForDropdown();
    }
}
