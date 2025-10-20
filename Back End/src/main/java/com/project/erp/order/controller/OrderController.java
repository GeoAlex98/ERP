package com.project.erp.order.controller;

import com.project.erp.item.entity.Item;
import com.project.erp.item.entity.ItemImage;
import com.project.erp.order.entity.Orders;
import com.project.erp.order.service.OrderService;
import com.project.erp.purchase.entity.Purchase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/all")
    public List<Orders> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping
    public ResponseEntity<List<Orders>> getAllItems(@RequestParam(required = false) String keyword) {
        List<Orders> order = (keyword != null && !keyword.trim().isEmpty())
                ? orderService.searchOrders(keyword)
                : orderService.getAllOrders();

        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderNo}")
    public ResponseEntity<Orders> getOrder(@PathVariable String orderNo) {
        Optional<Orders> Order = orderService.getByOrderNo(orderNo);
        return Order.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Orders createOrder(@RequestBody Orders order) {
        return orderService.createOrder(order);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Orders> updateOrder(@PathVariable Long id, @RequestBody Orders order) {
        return orderService.updateOrder(id, order)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        boolean deleted = orderService.deleteOrder(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}
