package com.example.ordertrackingsystem.controller;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.service.OrderService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST entry point that exposes CRUD endpoints for orders.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    /**
     * Creates a new order using the provided request body.
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(Authentication authentication, @RequestBody Order order) {
        String principal = authentication.getName();
        boolean admin = isAdmin(authentication);

        String owner = principal;
        if (admin && order.getCreatedBy() != null && !order.getCreatedBy().isBlank()) {
            owner = order.getCreatedBy();
        }

        Order createdOrder = orderService.createOrder(order, owner);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    /**
     * Returns all orders currently stored.
     */
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders(Authentication authentication) {
        boolean admin = isAdmin(authentication);
        List<Order> orders = orderService.getOrdersAccessibleBy(authentication.getName(), admin);
        return ResponseEntity.ok(orders);
    }

    /**
     * Looks up a single order by its identifier.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id, Authentication authentication) {
        try {
            Order order = orderService.getOrderForUser(id, authentication.getName(), isAdmin(authentication));
            return ResponseEntity.ok(order);
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Replaces all mutable fields on an order with new values.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @RequestBody Order updatedOrder) {
        Order order = orderService.updateOrder(id, updatedOrder);
        return ResponseEntity.ok(order);
    }

    /**
     * Removes an order from the system.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Partially updates an order by changing only the status.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(order);
    }

    /**
     * Allows customers to cancel their order before it has been shipped.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id, Authentication authentication) {
        try {
            Order order = orderService.cancelOrder(id, authentication.getName(), isAdmin(authentication));
            return ResponseEntity.ok(order);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
