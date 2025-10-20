package com.project.erp.item.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.project.erp.common.BaseEntity;
import com.project.erp.financialYear.entity.FinancialYear;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "item")
public class Item extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String itemCode;

    @Column(nullable = false)
    private String name;

    private String category; // Male, Female, Unisex

    @Column(nullable = false)
    private Double productionCost;

    @Column(nullable = false)
    private Double retailPrice;

    @Column(nullable = false)
    private Double mrp;

    @Column(nullable = true)
    private String hsnCode;

    @Column(nullable = true)
    private Double gstPercentage;

    @Column(nullable = true)
    private Double reorderLevel;

    // --- Sizes and colors ---
    @ElementCollection
    @CollectionTable(name = "item_size", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "size")
    private List<String> sizes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "item_color", joinColumns = @JoinColumn(name = "item_id"))
    @Column(name = "color")
    private List<String> colors = new ArrayList<>();

    @Column(length = 1000)
    private String description;

    // --- Images relationship ---
    @JsonManagedReference
    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    private List<ItemImage> images = new ArrayList<>();

    // --- Profit fields ---
    @Column(nullable = false)
    private Double businessProfit;

    @Column(nullable = false)
    private Double businessProfitPercent;

    @Column(nullable = false)
    private Double retailerProfit;

    @Column(nullable = false)
    private Double retailerMargin;


    //Audit Fields
    @Column(nullable = false)
    private Boolean active = true;

    @CreatedBy
    @Column(updatable = false, nullable = false)
    private String createdBy;

    @Column(updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedBy
    private String lastModifiedBy;

    @LastModifiedDate
    private LocalDateTime lastModifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_year_id", nullable = false, updatable = false)
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JsonIgnore
    private FinancialYear finYear;

}
