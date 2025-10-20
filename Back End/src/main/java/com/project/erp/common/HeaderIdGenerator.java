package com.project.erp.common;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;


public class HeaderIdGenerator implements IdentifierGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyMMdd");

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) {

        // 🔹 Special case for FinancialYear
        if (object instanceof com.project.erp.financialYear.entity.FinancialYear fy) {
            String yr = fy.getYear(); // e.g., "2024-2025"
            String[] parts = yr.split("-");
            if (parts.length == 2) {
                return parts[0].substring(2) + "-" + parts[1].substring(2); // "24-25"
            } else {
                return yr; // fallback
            }
        }

        String entityCode = getEntityCode(object);
        boolean isTransactional = isTransactionalEntity(entityCode);

        // 🔹 Convert CamelCase entity class name to snake_case table name
        String tableName = object.getClass().getSimpleName()
                .replaceAll("([a-z])([A-Z]+)", "$1_$2")
                .toLowerCase();
        if (isTransactional) {
            String dateKey = LocalDate.now().format(DATE_FMT);
            int nextSeq = getNextSequenceForDay(session, tableName, entityCode, dateKey);
            return String.format("%s%02d-%s", entityCode, nextSeq, dateKey);
        } else {
            // Use sequence for master entities
            long nextSeq = getNextMasterSequence(session, tableName);
            if(tableName.equals("module"))
                return String.format("%s%02d", entityCode, nextSeq);
            else
                return String.format("%s%03d", entityCode, nextSeq);
        }
    }

    // 🔹 For transactional entities (daily sequence)
    private int getNextSequenceForDay(SharedSessionContractImplementor session, String table, String code, String dateKey) {
        String primaryKey;
        if(table.equals("purchase"))
            primaryKey = "purchase_invoice_no";
        else if(table.equals("orders"))
            primaryKey = "order_no";
        else if(table.equals("sale"))
            primaryKey = "sale_invoice_no";
        else
            primaryKey = "id";
        String sql = "SELECT "+primaryKey+" FROM " + table + " WHERE "+primaryKey+" LIKE :pattern ORDER BY id DESC LIMIT 1";
        System.out.println("sql====="+sql);
        String likePattern = code + "%-" + dateKey;
        try {
            String lastId = (String) session.createNativeQuery(sql)
                    .setParameter("pattern", likePattern)
                    .uniqueResult();
            System.out.println("likePattern====="+likePattern);
            System.out.println("lastId====="+lastId);
            if (lastId != null && lastId.length() >= 4) {
                String seqStr = lastId.substring(1, 3);
                int seq = Integer.parseInt(seqStr);
                return seq + 1;
            }
        } catch (Exception ignored) {
            ignored.printStackTrace();
            System.out.println(ignored);
        }
        return 1;
    }

    // 🔹 For master entities: sequence generator table
    private long getNextMasterSequence(SharedSessionContractImplementor session, String tableName) {
        try {
            // 1️⃣ Create sequence_generator table if not exists
            session.createNativeQuery(
                    "CREATE TABLE IF NOT EXISTS sequence_generator (" +
                            "name VARCHAR(50) PRIMARY KEY, " +
                            "next_val BIGINT NOT NULL)"
            ).executeUpdate();

            // 2️⃣ Insert row if missing
            session.createNativeQuery(
                    "INSERT IGNORE INTO sequence_generator (name, next_val) VALUES (:name, 0)"
            ).setParameter("name", tableName).executeUpdate();


            // 3️⃣ Increment and fetch next value atomically
            session.createNativeQuery(
                    "UPDATE sequence_generator SET next_val = LAST_INSERT_ID(next_val + 1) WHERE name = :name"
            ).setParameter("name", tableName).executeUpdate();

            Number nextVal = (Number) session.createNativeQuery("SELECT LAST_INSERT_ID()").uniqueResult();

            return nextVal.longValue();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Unable to fetch sequence for master entity: " + tableName, e);
        }
    }

    // 🔹 Transactional codes (daily sequence entities)
    private boolean isTransactionalEntity(String code) {
        return switch (code) {
            case "W", "B", "N", "Z", "X", "Q", "D", "E" -> true;
            default -> false;
        };
    }

    // 🔹 Code mapping for all entities (updated)
    private String getEntityCode(Object object) {
        String className = object.getClass().getSimpleName().toLowerCase();

        return switch (className) {
            case "purchase" -> "W";
            case "packing" -> "B";
            case "orders" -> "N";
            case "sale" -> "Z";
            case "salereturn" -> "X";
            case "collection" -> "Q";
            case "damage" -> "D";
            case "expense" -> "E";
            case "item" -> "A";
            case "supplier" -> "S";
            case "retailer" -> "R";
            case "module" -> "M";
            case "stock" -> "S";
            default -> "UK";
        };
    }
}
