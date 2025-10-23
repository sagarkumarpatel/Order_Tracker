package com.example.ordertrackingsystem.repository;

import com.example.ordertrackingsystem.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Basic CRUD repository for {@link Product} entities.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {
}
