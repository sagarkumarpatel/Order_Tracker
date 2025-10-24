package com.example.ordertrackingsystem.service;

import com.example.ordertrackingsystem.model.Product;
import com.example.ordertrackingsystem.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * Encapsulates business rules for managing products in the catalog.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product createProduct(Product product) {
        validateProduct(product);
        product.setId(null);
        product.setName(product.getName().trim());
        product.setFeatured(product.isFeatured());
        if (StringUtils.hasText(product.getDescription())) {
            product.setDescription(product.getDescription().trim());
        }
        product.setImageUrl(StringUtils.hasText(product.getImageUrl()) ? product.getImageUrl().trim() : null);
        if (product.getCreatedAt() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        return productRepository.save(product);
    }

    private void validateProduct(Product product) {
        if (!StringUtils.hasText(product.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name is required.");
        }
        if (!StringUtils.hasText(product.getDescription())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product description is required.");
        }
        BigDecimal price = product.getPrice();
        if (price == null || price.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price must be zero or positive.");
        }
    }
}
