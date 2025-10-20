package com.project.erp.retailer.repository;

import com.project.erp.retailer.dto.RetailerDropdownDTO;
import com.project.erp.retailer.entity.Retailer;
import com.project.erp.supplier.dto.SupplierDropdownDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Repository
public interface RetailerRepository extends JpaRepository<Retailer, Long> {

    List<Retailer> findByRetailerNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPlaceContainingIgnoreCaseOrRegionContainingIgnoreCaseOrEmailContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            String retailerName,
            String ownerName,
            String place,
            String region,
            String email,
            String category
    );

    @Query("SELECT new com.project.erp.retailer.dto.RetailerDropdownDTO(r.id, r.retailerCode, r.retailerName) FROM Retailer r WHERE r.active = true")
    List<RetailerDropdownDTO> findAllActiveRetailersForDropdown();
}
