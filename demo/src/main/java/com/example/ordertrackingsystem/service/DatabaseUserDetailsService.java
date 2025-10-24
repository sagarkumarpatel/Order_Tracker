package com.example.ordertrackingsystem.service;

import com.example.ordertrackingsystem.model.UserAccount;
import com.example.ordertrackingsystem.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads user credentials from the database for Spring Security authentication.
 */
@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    public DatabaseUserDetailsService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalized = username == null ? null : username.trim().toLowerCase(java.util.Locale.US);
        UserAccount account = userAccountRepository.findByUsername(normalized)
                .orElseThrow(() -> new UsernameNotFoundException("User '%s' was not found.".formatted(username)));

        return User.withUsername(account.getUsername())
                .password(account.getPassword())
                .roles(account.getRole())
                .disabled(!account.isEnabled())
                .build();
    }
}
