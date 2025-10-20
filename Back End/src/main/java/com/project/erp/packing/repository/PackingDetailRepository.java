package com.project.erp.packing.repository;

import com.project.erp.packing.entity.PackingDetail;
import com.project.erp.purchase.entity.PurchaseDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PackingDetailRepository extends JpaRepository<PackingDetail, Long> {
    List<PackingDetail> findByPackingId(Long packingId);
    List<PackingDetail> findByPurchaseDetail(PurchaseDetail purchaseDetail);

    @Query("SELECT pi FROM PackingDetail pi WHERE pi.packedQuantity < pi.purchaseDetail.quantity")
    List<PackingDetail> fetchNotPackedItems();

    @Query("SELECT pi FROM PackingDetail pi WHERE pi.packing.id = :packingId AND pi.purchaseDetail.id = :purchaseDetailId")
    Optional<PackingDetail> findByPackingIdAndPurchaseDetailId(
            @Param("packingId") Long packingId,
            @Param("purchaseDetailId") Long purchaseDetailId
    );
}
