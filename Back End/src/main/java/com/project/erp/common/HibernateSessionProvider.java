package com.project.erp.common;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.stereotype.Component;

@Component
public class HibernateSessionProvider {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Returns the current Hibernate Session managed by Spring.
     */
    public Session getSession() {
        return entityManager.unwrap(Session.class);
    }

    /**
     * Returns the current SharedSessionContractImplementor safely (Hibernate 6+ compatible).
     */
    public SharedSessionContractImplementor getSharedSession() {
        Object unwrapped = entityManager.getDelegate();

        if (unwrapped instanceof SharedSessionContractImplementor impl) {
            return impl;
        }

        if (unwrapped instanceof Session session &&
                session.getClass().getName().contains("SessionImpl")) {
            return (SharedSessionContractImplementor) session;
        }

        // Fallback: try unwrap directly (works when no proxies involved)
        return entityManager.unwrap(SharedSessionContractImplementor.class);
    }
}
