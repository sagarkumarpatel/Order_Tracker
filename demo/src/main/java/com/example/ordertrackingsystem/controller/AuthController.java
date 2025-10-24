package com.example.ordertrackingsystem.controller;

import com.example.ordertrackingsystem.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Manages navigation for authentication pages and user registration.
 */
@Controller
public class AuthController {

    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping("/")
    public String root() {
        return "redirect:/index.html";
    }

    @PostMapping("/register")
    public String register(@RequestParam("email") String email,
                           @RequestParam("password") String password,
                           RedirectAttributes redirectAttributes) {
        try {
            userAccountService.registerUser(email, password);
            return "redirect:/login.html?registered=true";
        } catch (ResponseStatusException ex) {
            String reason = ex.getReason() != null ? ex.getReason() : "Registration failed.";
            redirectAttributes.addAttribute("error", true);
            redirectAttributes.addAttribute("message", encode(reason));
            return "redirect:/register.html";
        } catch (Exception ex) {
            redirectAttributes.addAttribute("error", true);
            redirectAttributes.addAttribute("message", encode("Registration failed."));
            return "redirect:/register.html";
        }
    }

    @GetMapping("/logout-success")
    public String logoutSuccess(HttpServletRequest request, HttpServletResponse response) {
        return "redirect:/login.html?logout=true";
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
