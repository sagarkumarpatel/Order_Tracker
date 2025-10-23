package com.example.ordertrackingsystem.config;

import com.example.ordertrackingsystem.model.Order;
import com.example.ordertrackingsystem.model.Product;
import com.example.ordertrackingsystem.repository.OrderRepository;
import com.example.ordertrackingsystem.repository.ProductRepository;
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
    private final ProductRepository productRepository;

    public DataInitializer(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        seedOrders();
        seedProducts();
    }

    private void seedOrders() {
        if (orderRepository.count() > 0) {
            return;
        }

        List<Order> demoOrders = List.of(
                new Order(null, "Jane Doe", "Wireless Mouse", 2, 24.99, "Pending", LocalDateTime.now().minusDays(1), "user"),
                new Order(null, "John Smith", "Mechanical Keyboard", 1, 89.99, "Shipped", LocalDateTime.now().minusHours(6), "admin"),
                new Order(null, "Alice Johnson", "USB-C Hub", 3, 39.5, "Delivered", LocalDateTime.now().minusDays(2), "user")
        );

        orderRepository.saveAll(demoOrders);
    }

    private void seedProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        List<Product> demoProducts = List.of(
                new Product(null, "Wireless Earbuds", "Noise-cancelling earbuds with 24-hour battery life.",
                        java.math.BigDecimal.valueOf(59.99), LocalDateTime.now().minusDays(2)),
                new Product(null, "Smart Fitness Watch", "Track workouts, health metrics, and notifications on the go.",
                        java.math.BigDecimal.valueOf(129.00), LocalDateTime.now().minusDays(1)),
                new Product(null, "Portable Bluetooth Speaker", "Water-resistant speaker with deep bass and 12-hour playback.",
                        java.math.BigDecimal.valueOf(89.50), LocalDateTime.now().minusHours(8)),
                new Product(null, "USB-C Laptop Hub", "Expand to HDMI, Ethernet, USB-A, and SD card slots instantly.",
                        java.math.BigDecimal.valueOf(39.75), LocalDateTime.now().minusHours(3))
        );

        productRepository.saveAll(demoProducts);
    }
}
