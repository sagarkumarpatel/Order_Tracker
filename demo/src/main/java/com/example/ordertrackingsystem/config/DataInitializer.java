package com.example.ordertrackingsystem.config;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.repository.OrderRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds the database with sample orders so the UI has data right after startup.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final OrderRepository orderRepository;

    public DataInitializer(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public void run(String... args) {
        if (orderRepository.count() > 0) {
            return;
        }

        List<Order> demoOrders = List.of(
                new Order(null, "Jane Doe", "Wireless Mouse", 2, 24.99, "Pending", LocalDateTime.now().minusDays(1)),
                new Order(null, "John Smith", "Mechanical Keyboard", 1, 89.99, "Shipped", LocalDateTime.now().minusHours(6)),
                new Order(null, "Alice Johnson", "USB-C Hub", 3, 39.5, "Delivered", LocalDateTime.now().minusDays(2))
        );

        orderRepository.saveAll(demoOrders);
    }
}
