package com.project.erp.order.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.item.entity.Item;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "order_detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String referenceNo;

    private String size;
    private String color;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalAmt;  // quantity * price

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orders_id")
    @JsonBackReference
    private Orders order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(nullable = false)
    private Boolean status = true;

    @Transient
    private List<String> sizesForItem;

    @Transient
    private List<String> colorsForItem;
}
