package com.example.ordertrackingsystem.repository;

import com.example.ordertrackingsystem.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data repository that exposes CRUD operations for {@link Order} entities.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}
