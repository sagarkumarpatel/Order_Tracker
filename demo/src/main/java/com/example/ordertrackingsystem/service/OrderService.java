package com.example.ordertrackingsystem.service;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.repository.OrderRepository;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Business layer that orchestrates operations on {@link Order} entities.
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Persists a new order using the repository.
     */
    public Order createOrder(Order order, String ownerUsername) {
        order.setId(null);
        order.setCreatedBy(ownerUsername);
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("Pending");
        }
        return orderRepository.save(order);
    }

    /**
     * Returns orders visible to the current actor.
     */
    public List<Order> getOrdersAccessibleBy(String username, boolean isAdmin) {
        return isAdmin ? orderRepository.findAll() : orderRepository.findByCreatedBy(username);
    }

    /**
     * Retrieves a single order for the current actor, enforcing ownership.
     */
    public Order getOrderForUser(Long id, String username, boolean isAdmin) {
        Order order = getOrderById(id);
        if (!isAdmin && !username.equals(order.getCreatedBy())) {
            throw new AccessDeniedException("Forbidden");
        }
        return order;
    }

    /**
     * Retrieves a single order by id or throws when the id does not exist.
     */
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + id));
    }

    /**
     * Applies updates to all order fields using the provided payload.
     */
    public Order updateOrder(Long id, Order updatedOrder) {
        Order existingOrder = getOrderById(id);
        existingOrder.setCustomerName(updatedOrder.getCustomerName());
        existingOrder.setProductName(updatedOrder.getProductName());
        existingOrder.setQuantity(updatedOrder.getQuantity());
        existingOrder.setPrice(updatedOrder.getPrice());
        existingOrder.setStatus(updatedOrder.getStatus());
        existingOrder.setOrderDate(updatedOrder.getOrderDate());
        return orderRepository.save(existingOrder);
    }

    /**
     * Deletes an order if it exists, otherwise signals a bad identifier.
     */
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new IllegalArgumentException("Order not found with id: " + id);
        }
        orderRepository.deleteById(id);
    }

    /**
     * Updates only the status field for the order identified by {@code id}.
     */
    public Order updateOrderStatus(Long id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    /**
     * Cancels an order as long as it has not yet been shipped or delivered.
     */
    public Order cancelOrder(Long id, String username, boolean isAdmin) {
        Order order = getOrderById(id);

        if (!isAdmin && !username.equals(order.getCreatedBy())) {
            throw new AccessDeniedException("Forbidden");
        }

        String currentStatus = order.getStatus();

        if (currentStatus != null && currentStatus.equalsIgnoreCase("Cancelled")) {
            throw new IllegalStateException("Order is already cancelled.");
        }

        if (!isAdmin && currentStatus != null && !currentStatus.equalsIgnoreCase("Pending")) {
            throw new IllegalStateException("Only pending orders can be cancelled.");
        }

        order.setStatus("Cancelled");
        return orderRepository.save(order);
    }
}
