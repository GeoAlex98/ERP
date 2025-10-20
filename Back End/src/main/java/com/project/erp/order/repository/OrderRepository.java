package com.project.erp.order.repository;

import com.project.erp.order.entity.Orders;
import com.project.erp.purchase.entity.Purchase;
import org.hibernate.Hibernate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Orders, Long> {

    Optional<Orders> findByOrderNo(String orderNo);
}
