package com.project.erp.stock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.erp.common.BaseEntity;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.item.entity.Item;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "stock_ledger")
public class StockLedger extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "stock_ledger_seq_gen")
    @SequenceGenerator(
            name = "stock_ledger_seq_gen",
            sequenceName = "stock_ledger_seq",
            allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    // Optional denormalized fields for reporting and historical snapshot
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private Integer quantity;    // always positive

    @Column(length = 3, nullable = false)
    private String movementType; // "In" for addition, "Out" for deduction

    @Column(nullable = false)
    private String type;         // "Packing" | "Purchase" | "Return" etc.

    @Column(nullable = false)
    private String referenceNo;    // e.g., purchaseDetailId, packingId

    // Historical snapshot of stock attributes
    private String color;
    private String size;

    private LocalDateTime date;

    @CreatedBy
    @Column(updatable = false, nullable = false)
    private String createdBy;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_year_id", nullable = false, updatable = false)
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JsonIgnore
    private FinancialYear finYear;


    @PrePersist
    protected void onCreate() {
//        date = LocalDateTime.now();

        // Snapshot color/size from stock if not already set
        if (stock != null) {
            if (color == null) color = stock.getColor();
            if (size == null) size = stock.getSize();
        }
    }
}
