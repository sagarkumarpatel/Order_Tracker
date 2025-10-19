package com.example.ordertrackingsystem.service;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    /**
     * Returns every order stored in the system.
     */
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
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
}
