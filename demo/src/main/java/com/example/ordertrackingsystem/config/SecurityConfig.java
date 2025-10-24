package com.example.ordertrackingsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
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
     * Configures HTTP Basic security along with role-based authorization for each HTTP method.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/error").permitAll()
            .requestMatchers("/login", "/login.html", "/login.css", "/login.js").permitAll()
            .requestMatchers("/register", "/register.html", "/register.css", "/register.js").permitAll()
            .requestMatchers("/favicon.ico", "/assets/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PATCH, "/api/orders/*/cancel").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.PATCH, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/orders/**").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("ADMIN", "USER")
            .requestMatchers(HttpMethod.GET, "/track/**").hasAnyRole("ADMIN", "USER")
            .anyRequest().authenticated()
        )
        .formLogin(form -> form
            .loginPage("/login.html")
            .loginProcessingUrl("/login")
            .defaultSuccessUrl("/index.html", true)
            .failureUrl("/login.html?error=true")
            .permitAll()
        )
        .logout(logout -> logout
            .logoutUrl("/logout")
            .logoutSuccessUrl("/login.html?logout=true")
            .permitAll()
        )
        .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
