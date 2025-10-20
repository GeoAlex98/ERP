package com.project.erp.common;

import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

@MappedSuperclass
public abstract class BaseEntity{

    @PrePersist
    @PreUpdate
    public void cleanEmptyStrings() {
        var fields = this.getClass().getDeclaredFields();
        for (var field : fields) {
            if (field.getType().equals(String.class)) {
                field.setAccessible(true);
                try {
                    String value = (String) field.get(this);
                    if (value != null && value.trim().isEmpty()) {
                        field.set(this, null);
                    }
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                }
            }
        }
    }
}
