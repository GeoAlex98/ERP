package com.project.erp.packing.entity;

import com.project.erp.purchase.entity.PurchaseDetail;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "packing_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false, unique = true)
    private String referenceNo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "packing_id", nullable = false)
    private Packing packing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_item_id", nullable = false)
    private PurchaseDetail purchaseDetail;

    private Integer packedQuantity;

    @Transient
    private Integer pendingQuantity;

    private Boolean fullyPacked;
}
