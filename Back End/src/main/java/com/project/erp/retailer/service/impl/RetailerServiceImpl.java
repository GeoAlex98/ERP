package com.project.erp.retailer.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.retailer.dto.RetailerDropdownDTO;
import com.project.erp.retailer.entity.Retailer;
import com.project.erp.retailer.repository.RetailerRepository;
import com.project.erp.retailer.service.RetailerService;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.project.erp.order.repository.OrderRepository;

import java.io.IOException;
import java.io.Serializable;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class RetailerServiceImpl implements RetailerService {

    private final RetailerRepository retailerRepository;
    private final FinancialYearService financialYearService;
    @Autowired
    private HibernateSessionProvider sessionProvider;

    @Override
    @Transactional(readOnly = true)
    public List<Retailer> searchRetailers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return retailerRepository.findAll();
        }
        return retailerRepository
                .findByRetailerNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPlaceContainingIgnoreCaseOrRegionContainingIgnoreCaseOrEmailContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                        keyword, keyword, keyword, keyword, keyword, keyword
                );
    }

    @Override
    public Retailer createRetailer(Retailer retailer, MultipartFile retailerImage) {
        if (retailer.getRetailerCode() == null || retailer.getRetailerCode().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable retailerCode = new HeaderIdGenerator().generate(session, retailer);
            retailer.setRetailerCode(retailerCode.toString());
            System.out.println("Generated retailerCode === " + retailerCode);
        }
        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        retailer.setFinYear(fy);
        storeRetailerImage(retailer, retailerImage);
        return retailerRepository.save(retailer);
    }

    @Override
    public Retailer updateRetailer(Long id, Retailer retailerDetails, MultipartFile retailerImage) {
        return retailerRepository.findById(id).map(existingRetailer -> {

            existingRetailer.setRetailerName(retailerDetails.getRetailerName());
            existingRetailer.setOwnerName(retailerDetails.getOwnerName());
            existingRetailer.setAddress(retailerDetails.getAddress());
            existingRetailer.setLandmark(retailerDetails.getLandmark());
            existingRetailer.setPlace(retailerDetails.getPlace());
            existingRetailer.setRegion(retailerDetails.getRegion());
            existingRetailer.setPhone(retailerDetails.getPhone());
            existingRetailer.setEmail(retailerDetails.getEmail());
            existingRetailer.setGstNo(retailerDetails.getGstNo());
            existingRetailer.setCategory(retailerDetails.getCategory());
            existingRetailer.setActive(retailerDetails.getActive());

            storeRetailerImage(existingRetailer, retailerImage);

            return retailerRepository.save(existingRetailer);
        }).orElseThrow(() -> new RuntimeException("Retailer not found with id " + id));
    }

    @Override
    public void deleteRetailer(Long id) {
        retailerRepository.findById(id).ifPresent(retailerRepository::delete);
    }

    private void storeRetailerImage(Retailer retailer, MultipartFile retailerImage) {
        if (retailerImage != null && !retailerImage.isEmpty()) {
            try {
                String uploadDir = "uploads/retailers/";
                String filename = retailer.getRetailerName().replaceAll("\\s+", "_") + ".png";
                Path filePath = Paths.get(uploadDir + filename);

                Files.createDirectories(filePath.getParent());
                Files.write(filePath, retailerImage.getBytes());

                retailer.setRetailerImage(uploadDir + filename);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store retailerretailer image", e);
            }
        }
    }

    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public Double getPendingAmount(Long retailerId) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getRetailer().getId().equals(retailerId))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0)
                .sum();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RetailerDropdownDTO> findAllActiveRetailersForDropdown() {
        return retailerRepository.findAllActiveRetailersForDropdown();
    }
}
