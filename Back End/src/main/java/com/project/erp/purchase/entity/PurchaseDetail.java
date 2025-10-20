package com.project.erp.purchase.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.item.entity.Item;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "purchase_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @GeneratedValue(generator = "detail-id-generator")
//    @GenericGenerator(
//            name = "detail-id-generator",
//            strategy = "com.project.erp.common.DetailIdGenerator"
//    )
    private Long id;
    @Column(length = 20, nullable = false, unique = true)
    private String referenceNo;

    private String size;   // must match one of Item.sizes
    private String color;  // must match one of Item.colors

    private Integer quantity;

    private BigDecimal price;        // unit price
    private BigDecimal totalAmt;  // quantity * price

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false)
    @JsonBackReference
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;


    @Transient
    private List<String> sizesForItem;

    @Transient
    private List<String> colorsForItem;
}
