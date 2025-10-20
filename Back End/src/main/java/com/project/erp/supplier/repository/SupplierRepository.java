package com.project.erp.supplier.repository;

import com.project.erp.supplier.dto.SupplierDropdownDTO;
import com.project.erp.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findBySupplierNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPlaceContainingIgnoreCaseOrRegionContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String supplierName, String ownerName, String place, String region, String email
    );

    @Query("SELECT new com.project.erp.supplier.dto.SupplierDropdownDTO(s.id, s.supplierCode, s.supplierName) FROM Supplier s WHERE s.active = true")
    List<SupplierDropdownDTO> findAllActiveSuppliersForDropdown();
}
