package com.project.erp.common;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.io.Serializable;

public class DetailIdGenerator implements IdentifierGenerator {

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) {
        String headerId = getHeaderId(object);
        System.out.println("headerId=====DDDDDD====="+headerId);
        // 🔹 Convert CamelCase class name to snake_case table name
        String tableName = object.getClass().getSimpleName()
                .replaceAll("([a-z])([A-Z]+)", "$1_$2")
                .toLowerCase();

        // Fetch latest detail id for this header
        System.out.println("tableName=====DDDDDD====="+tableName);
        String sql = "SELECT id FROM " + tableName +
                " WHERE id LIKE :pattern ORDER BY id DESC LIMIT 1";

        try {
            String lastId = (String) session.createNativeQuery(sql)
                    .setParameter("pattern", headerId + "-%")
                    .uniqueResult();

            int nextSeq = 1;
            if (lastId != null && lastId.contains("-")) {
                String seqStr = lastId.substring(lastId.lastIndexOf('-') + 1);
                nextSeq = Integer.parseInt(seqStr) + 1;
            }

            return String.format("%s-%02d", headerId, nextSeq);
        } catch (Exception e) {
            return String.format("%s-%02d", headerId, 1);
        }
    }

    private String getHeaderId(Object object) {
        try {
            // Reflectively fetch header ID (e.g., purchase.getId())
            var field = object.getClass().getDeclaredField(getHeaderFieldName(object));
            field.setAccessible(true);
            Object headerObj = field.get(object);

            var idField = headerObj.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            return (String) idField.get(headerObj);
        } catch (Exception e) {
            throw new RuntimeException("Unable to fetch header ID for detail entity", e);
        }
    }

    private String getHeaderFieldName(Object object) {
        String className = object.getClass().getSimpleName().toLowerCase();
        System.out.println("className===="+className);
        return switch (className) {
            case "userpasswordhistory" -> "user";      // maps to Purchase entity
            case "itemimage" -> "item";      // maps to Purchase entity
            case "purchasedetail" -> "purchase";      // maps to Purchase entity
            case "packingdetail" -> "packing";      // maps to Packing entity
            case "saledetail" -> "sale";              // maps to Sale entity
            case "orderdetail" -> "order";            // maps to Order entity
            case "salereturndetail" -> "salereturn";  // maps to SaleReturn entity
            case "collectiondetail" -> "collection";  // maps to Collection entity
            default -> "header";                       // fallback
        };
    }
}
