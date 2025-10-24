package com.example.ordertrackingsystem.repository;

import com.example.ordertrackingsystem.model.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access layer for persisted user accounts.
 */
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByUsername(String username);
}
