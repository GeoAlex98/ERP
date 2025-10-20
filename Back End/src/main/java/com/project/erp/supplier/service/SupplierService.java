package com.project.erp.supplier.service;

import com.project.erp.supplier.dto.SupplierDropdownDTO;
import com.project.erp.supplier.entity.Supplier;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SupplierService {

//    List<Supplier> getAllSuppliers();

    List<Supplier> searchSuppliers(String keyword);

    Supplier createSupplier(Supplier supplier, MultipartFile supplierImage);

    Supplier updateSupplier(Long id, Supplier supplierDetails, MultipartFile supplierImage);

    void deleteSupplier(Long id);


    //For Other Modules
    List<SupplierDropdownDTO> findAllActiveSuppliersForDropdown();
}
