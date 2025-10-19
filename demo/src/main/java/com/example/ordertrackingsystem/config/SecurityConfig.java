package com.example.ordertrackingsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Basic authentication setup with role-based rules for the API endpoints.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Provides a delegating encoder so plaintext passwords are automatically hashed.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /**
     * Registers in-memory users representing the ADMIN and USER roles.
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        UserDetails admin = User.withUsername("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles("ADMIN")
                .build();

        UserDetails user = User.withUsername("user")
                .password(passwordEncoder.encode("user123"))
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(admin, user);
    }

    /**
     * Configures HTTP Basic security along with role-based authorization for each HTTP method.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.POST, "/api/orders/**").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PATCH, "/api/orders/*/cancel").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.PATCH, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAnyRole("ADMIN", "USER")
            .anyRequest().authenticated()
        )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
