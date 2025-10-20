package com.project.erp.order.service;

import com.project.erp.order.entity.Orders;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface OrderService {

    Orders createOrder(Orders order);
    Optional<Orders> getByOrderNo(String orderNo);
    Map<String, Object> getOrderDatesAndRetailers();
    List<Orders> getAllOrders();
    List<Orders> searchOrders(String keyword);
    Optional<Orders> updateOrder(Long id, Orders order);
    boolean deleteOrder(Long id);



}
