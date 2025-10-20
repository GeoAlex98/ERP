package com.project.erp.order.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import com.project.erp.item.entity.Item;
import com.project.erp.item.repository.ItemRepository;
import com.project.erp.retailer.entity.Retailer;
import com.project.erp.retailer.repository.RetailerRepository;
import com.project.erp.order.entity.Orders;
import com.project.erp.order.entity.OrderDetail;
import com.project.erp.order.repository.OrderRepository;
import com.project.erp.order.service.OrderService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final RetailerRepository retailerRepository;
    private final FinancialYearService financialYearService;
    private final ItemRepository itemRepository;
    private final HibernateSessionProvider sessionProvider;

    // ✅ Create new order
    @Override
    public Orders createOrder(Orders order) {

        // 1️⃣ Set order date if missing
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }

        // 2️⃣ Link retailer
        Retailer retailer = retailerRepository.findById(order.getRetailer().getId())
                .orElseThrow(() -> new RuntimeException("Retailer not found"));
        order.setRetailer(retailer);

        // 3️⃣ Generate orderNo if missing
        if (order.getOrderNo() == null || order.getOrderNo().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable orderNo = new HeaderIdGenerator().generate(session, order);
            order.setOrderNo(orderNo.toString());
            System.out.println("Generated orderNo === " + orderNo);
        }

        // 4️⃣ Generate reference numbers for details
        if (order.getOrderDetail() != null && !order.getOrderDetail().isEmpty()) {
            int counter = 1;
            for (OrderDetail detail : order.getOrderDetail()) {
                if (detail.getReferenceNo() == null || detail.getReferenceNo().isEmpty()) {
                    String referenceNo = order.getOrderNo() + "-" + String.format("%02d", counter++);
                    detail.setReferenceNo(referenceNo);
                }
                detail.setOrder(order);
            }
        }

        // 5️⃣ Link Financial Year
        FinancialYear fy = financialYearService.getCurrentActiveFinYear();
        order.setFinYear(fy);

        // 6️⃣ Save
        return orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Orders> getByOrderNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo).map(order -> {
            if (order.getOrderDetail() != null) {
                order.getOrderDetail().forEach(oi -> {
                    Item item = itemRepository.findById(oi.getItem().getId())
                            .orElse(null);
                    if (item != null) {
                        oi.setSizesForItem(item.getSizes());
                        oi.setColorsForItem(item.getColors());
                    }
                });
            }
            return order;
        });
    }

    // ✅ Get all orders
    @Override
    @Transactional(readOnly = true)
    public List<Orders> getAllOrders() {
        List<Orders> all = orderRepository.findAll();
        all.sort(Comparator.comparing(Orders::getOrderDate)
                .thenComparing(Orders::getOrderNo)
                .reversed());
        return all;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Orders> searchOrders(String keyword) {
        System.out.println("keyword==="+keyword);
        String lowerKeyword = keyword.toLowerCase();
        return orderRepository.findAll().stream()
                .filter(p -> {
                    boolean matchOrderNo = p.getOrderNo() != null &&
                            p.getOrderNo().toLowerCase().contains(lowerKeyword);

                    boolean matchRetailer = p.getRetailer() != null &&
                            p.getRetailer().getRetailerName() != null &&
                            p.getRetailer().getRetailerName().toLowerCase().contains(lowerKeyword);

                    return matchOrderNo || matchRetailer;
                })
                .toList();
    }

    // ✅ Update order
    @Override
    public Optional<Orders> updateOrder(Long id, Orders updatedOrder) {
        return orderRepository.findById(id).map(existing -> {

            // --- Update header ---
            existing.setOrderDate(updatedOrder.getOrderDate());
            existing.setRetailer(updatedOrder.getRetailer());
            existing.setTotalAmount(updatedOrder.getTotalAmount());

            // Find current max reference sequence
            int maxSeq = existing.getOrderDetail().stream()
                    .map(OrderDetail::getReferenceNo)
                    .map(ref -> ref.substring(ref.lastIndexOf('-') + 1))
                    .mapToInt(Integer::parseInt)
                    .max()
                    .orElse(0);

            // --- Handle order details ---
            List<OrderDetail> newDetails = updatedOrder.getOrderDetail() != null
                    ? updatedOrder.getOrderDetail()
                    : new ArrayList<>();

            // 1️⃣ Remove details not in updated list
            existing.getOrderDetail().removeIf(old ->
                    newDetails.stream().noneMatch(nd -> nd.getId() != null && nd.getId().equals(old.getId()))
            );

            // 2️⃣ Update or add new
            for (OrderDetail newDetail : newDetails) {
                Optional<OrderDetail> existingDetailOpt = existing.getOrderDetail().stream()
                        .filter(d -> d.getId() != null && d.getId().equals(newDetail.getId()))
                        .findFirst();

                if (existingDetailOpt.isPresent()) {
                    // update existing
                    OrderDetail existingDetail = existingDetailOpt.get();
                    existingDetail.setItem(newDetail.getItem());
                    existingDetail.setQuantity(newDetail.getQuantity());
                    existingDetail.setPrice(newDetail.getPrice());
                    existingDetail.setTotalAmt(newDetail.getTotalAmt());
                    existingDetail.setSize(newDetail.getSize());
                    existingDetail.setColor(newDetail.getColor());
                } else {
                    // add new
                    String referenceNo = existing.getOrderNo() + "-" + String.format("%02d", ++maxSeq);
                    newDetail.setReferenceNo(referenceNo);
                    newDetail.setOrder(existing);
                    existing.getOrderDetail().add(newDetail);

                    System.out.println("✅ New order detail added (Order ID: " + existing.getId() + ")");
                }
            }

            // --- Save ---
            return orderRepository.save(existing);
        });
    }

    // ✅ Delete order
    @Override
    public boolean deleteOrder(Long id) {
        if(orderRepository.existsById(id)) {
            orderRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ✅ Get order dates and retailers (for filters)
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderDatesAndRetailers() {
        List<Orders> allOrders = orderRepository.findAll();

        List<String> dates = allOrders.stream()
                .map(o -> o.getOrderDate() != null ? o.getOrderDate().toString() : null)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        List<Retailer> retailers = allOrders.stream()
                .map(Orders::getRetailer)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(Retailer::getRetailerName))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("dates", dates);
        result.put("retailers", retailers);
        return result;
    }
}
