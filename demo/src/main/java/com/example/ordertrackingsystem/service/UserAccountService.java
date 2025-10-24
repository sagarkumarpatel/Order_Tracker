package com.example.ordertrackingsystem.service;

import com.example.ordertrackingsystem.model.UserAccount;
import com.example.ordertrackingsystem.repository.UserAccountRepository;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles creation of new user accounts with proper validation and hashing.
 */
@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a new account with the USER role.
     */
    @Transactional
    public UserAccount registerUser(String email, String rawPassword) {
        String normalizedEmail = normalizeEmail(email);
        if (!StringUtils.hasText(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        if (!StringUtils.hasText(rawPassword) || rawPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters long.");
        }

        userAccountRepository.findByUsername(normalizedEmail).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists.");
        });

        UserAccount account = new UserAccount();
        account.setUsername(normalizedEmail);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole("USER");
        account.setEnabled(true);

        return userAccountRepository.save(account);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.US);
    }
}
