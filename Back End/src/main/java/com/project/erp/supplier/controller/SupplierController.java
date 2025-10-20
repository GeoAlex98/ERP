package com.project.erp.supplier.controller;

import com.project.erp.supplier.dto.SupplierDropdownDTO;
import com.project.erp.supplier.entity.Supplier;
import com.project.erp.supplier.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    private final SupplierService supplierService;

    @Autowired
    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public List<Supplier> getSuppliers(@RequestParam(required = false) String search) {
        return supplierService.searchSuppliers(search);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createSupplier(
            @RequestPart("supplier") Supplier supplier,
            @RequestPart(value = "supplierImage", required = false) MultipartFile supplierImage
    ) {
        try {
            Supplier created = supplierService.createSupplier(supplier, supplierImage);
            return ResponseEntity.ok(created);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone, Email, or GST number already exists"));
        }
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateSupplier(
            @PathVariable Long id,
            @RequestPart("supplier") Supplier supplierDetails,
            @RequestPart(value = "supplierImage", required = false) MultipartFile supplierImage
    ) {
        try {
            Supplier updated = supplierService.updateSupplier(id, supplierDetails, supplierImage);
            return ResponseEntity.ok(updated);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone, Email, or GST number already exists"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok().build();
    }



    //For Other Modules
    @GetMapping("/dropdown")
    public List<SupplierDropdownDTO> getSuppliersForDropdown() {
        return supplierService.findAllActiveSuppliersForDropdown();
    }
}
