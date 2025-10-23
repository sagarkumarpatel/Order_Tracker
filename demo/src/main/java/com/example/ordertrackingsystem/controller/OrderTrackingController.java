package com.example.ordertrackingsystem.controller;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.service.OrderService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides a lightweight public endpoint that surfaces read-only order tracking details.
 */
@RestController
@RequestMapping("/track")
public class OrderTrackingController {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private final OrderService orderService;

    public OrderTrackingController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderTrackingResponse> trackOrder(@PathVariable String orderId) {
        Long numericId;
        try {
            numericId = Long.valueOf(orderId);
        } catch (NumberFormatException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            Order order = orderService.getOrderById(numericId);
            return ResponseEntity.ok(mapToResponse(order));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    private OrderTrackingResponse mapToResponse(Order order) {
        LocalDateTime orderDate = order.getOrderDate();
        LocalDateTime estimatedDelivery = orderDate != null ? orderDate.plusDays(5) : null;
        return new OrderTrackingResponse(
                order.getId() != null ? order.getId().toString() : null,
                order.getCustomerName(),
                order.getStatus(),
                estimatedDelivery != null ? ISO_FORMATTER.format(estimatedDelivery) : null
        );
    }

    /**
     * Compact DTO describing the information shown on the tracking page.
     */
    public record OrderTrackingResponse(String orderId, String customerName, String status, String estimatedDelivery) {
    }
}
