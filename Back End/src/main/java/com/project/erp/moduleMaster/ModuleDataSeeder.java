package com.project.erp.moduleMaster;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.moduleMaster.entity.Module;
import com.project.erp.moduleMaster.repository.ModuleMasterRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ModuleDataSeeder {

    private final ModuleMasterRepository moduleMasterRepository;
    private final HeaderIdGenerator headerIdGenerator = new HeaderIdGenerator();
    private final EntityManager entityManager;
    /**
     * This runs AFTER Hibernate has created all tables and the Spring context is fully initialized.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedModules() {
        List<String> modules = Arrays.asList(
                "ITEM",
                "SUPPLIER",
                "ORDER",
                "PURCHASE",
                "SALE",
                "COLLECTION",
                "SALE_RETURN",
                "STOCK",
                "RETAILER",
                "PACKING",
                "USER_MASTER",
                "MODULE_MASTER",
                "FINANCIAL_YEAR_MASTER",
                "FINANCIAL_REPORT"
        );

        SharedSessionContractImplementor session = entityManager.unwrap(SharedSessionContractImplementor.class);

        for (String name : modules) {
            boolean exists = moduleMasterRepository.existsByName(name);
            if (!exists) {
                try {
                    // ✅ Safe ID generation
                    Module tempModule = Module.builder().build();
                    String moduleCode = (String) headerIdGenerator.generate(session , tempModule);

                    System.out.println("✅ Generating module: " + name + " | Code: " + moduleCode);

                    Module m = Module.builder()
                            .moduleCode(moduleCode)
                            .name(name)
                            .active(true)
                            .category(determineCategory(name))
                            .build();

                    moduleMasterRepository.save(m);
                } catch (Exception e) {
                    System.err.println("❌ Error seeding module '" + name + "': " + e.getMessage());
                }
            }
        }

        System.out.println("✅ Module seeding completed successfully!");
    }

    private Module.ModuleCategory determineCategory(String name) {
        return switch (name) {
            case "ITEM", "SUPPLIER", "ORDER", "PURCHASE", "SALE", "COLLECTION", "SALE_RETURN", "STOCK", "RETAILER", "PACKING" ->
                    Module.ModuleCategory.ENTRY;
            case "USER_MASTER", "MODULE_MASTER" ->
                    Module.ModuleCategory.MASTER;
            case "FINANCIAL_REPORT", "FINANCIAL_YEAR_MASTER" ->
                    Module.ModuleCategory.REPORT;
            default -> Module.ModuleCategory.ENTRY;
        };
    }
}
