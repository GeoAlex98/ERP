package com.project.erp.supplier.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.supplier.dto.SupplierDropdownDTO;
import com.project.erp.supplier.entity.Supplier;
import com.project.erp.supplier.repository.SupplierRepository;
import com.project.erp.supplier.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.Serializable;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final FinancialYearService financialYearService;
    @Autowired
    private HibernateSessionProvider sessionProvider;

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> searchSuppliers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return supplierRepository.findAll();
        }
        return supplierRepository
                .findBySupplierNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPlaceContainingIgnoreCaseOrRegionContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        keyword, keyword, keyword, keyword, keyword
                );
    }

    @Override
    public Supplier createSupplier(Supplier supplier, MultipartFile supplierImage) {
        if (supplier.getSupplierCode() == null || supplier.getSupplierCode().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable supplierCode = new HeaderIdGenerator().generate(session, supplier);
            supplier.setSupplierCode(supplierCode.toString());
            System.out.println("Generated supplierCode === " + supplierCode);
        }

        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        supplier.setFinYear(fy);
        storeSupplierImage(supplier, supplierImage);
        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier updateSupplier(Long id, Supplier supplierDetails, MultipartFile supplierImage) {
        return supplierRepository.findById(id).map(existing -> {
            existing.setSupplierName(supplierDetails.getSupplierName());
            existing.setOwnerName(supplierDetails.getOwnerName());
            existing.setAddress(supplierDetails.getAddress());
            existing.setLandmark(supplierDetails.getLandmark());
            existing.setPlace(supplierDetails.getPlace());
            existing.setRegion(supplierDetails.getRegion());
            existing.setPhone(supplierDetails.getPhone());
            existing.setEmail(supplierDetails.getEmail());
            existing.setGstNo(supplierDetails.getGstNo());
            existing.setActive(supplierDetails.getActive());
            storeSupplierImage(existing, supplierImage);
            return supplierRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Supplier not found with id " + id));
    }

    @Override
    public void deleteSupplier(Long id) {
        supplierRepository.findById(id).ifPresent(supplierRepository::delete);
    }

    private void storeSupplierImage(Supplier supplier, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            try {
                String folder = "uploads/supplierImages/";
                Files.createDirectories(Paths.get(folder));
                String filename = supplier.getSupplierName().replaceAll("\\s+", "_") + ".png";
                Path path = Paths.get(folder + filename);
                Files.write(path, image.getBytes());
                supplier.setSupplierImage(folder + filename);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store supplier image", e);
            }
        }
    }


    //For Other Modules
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDropdownDTO> findAllActiveSuppliersForDropdown(){
        return supplierRepository.findAllActiveSuppliersForDropdown();
    };
}
