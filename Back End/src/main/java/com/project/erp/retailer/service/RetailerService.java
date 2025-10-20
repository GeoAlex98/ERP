package com.project.erp.retailer.service;

import com.project.erp.retailer.dto.RetailerDropdownDTO;
import com.project.erp.retailer.entity.Retailer;
import com.project.erp.supplier.dto.SupplierDropdownDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RetailerService {


//    List<Retailer> getAllRetailers();

    List<Retailer> searchRetailers(String keyword);

    Retailer createRetailer(Retailer retailer, MultipartFile retailerImage);

    Retailer updateRetailer(Long id, Retailer retailerDetails, MultipartFile retailerImage);

    void deleteRetailer(Long id);

    Double getPendingAmount(Long retailerId);

    List<RetailerDropdownDTO> findAllActiveRetailersForDropdown();
}
