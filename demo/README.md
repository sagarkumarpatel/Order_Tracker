# Order Tracking System

A Spring Boot 3 application that lets customers browse products, place orders, track delivery status, and manage them through a modern HTML/JavaScript frontend secured by Spring Security.

## Highlights

- **Product catalog & cart** – Featured products with imagery, add-to-cart, checkout, and instant order listing on `index.html`.
- **Dynamic admin console** – `admin.html` allows administrators to create, edit, delete, and mark products as featured.
- **Order management API** – Full CRUD REST endpoints with ownership rules so customers only see their own orders while admins can manage all.
- **Database-backed authentication** – Credentials are stored in MySQL, form login is provided at `/login.html`, and new users self-register via `/register.html`.
- **Seed data** – Sample products and orders are seeded on startup along with a single admin account for first-time access.

## Project Structure

- `src/main/java/com/example/ordertrackingsystem` – Application entry point plus `config`, `controller`, `model`, `repository`, and `service` packages.
- `src/main/resources/static` – Frontend assets (`index.html`, `admin.html`, login/registration pages, CSS, JS).
- `src/main/resources/application.properties` – MySQL connection and security configuration.
- `src/test/resources/application.properties` – H2 configuration for automated tests.

## Prerequisites

- JDK 17+
- Maven wrapper (bundled)
- MySQL 8.x with a database named `order_tracking_db`
  - Default connection details: username `root`, password `hello1xx` (adjust in `application.properties`).

## Getting Started

1. Ensure MySQL is running and the configured schema exists.
2. From the `demo` directory run:
   ```powershell
   ./mvnw spring-boot:run
   ```
3. Navigate to `http://localhost:8080/login.html` and sign in.

### Accounts & Roles

- Seeded admin: `admin` / `admin123`
- Register new customers at `http://localhost:8080/register.html`; emails are stored in lowercase and given the `ROLE_USER` role.
- After signing in, you are redirected to `index.html`. All other pages (including the storefront) require authentication.
- REST clients can continue to use HTTP Basic with the same credentials (`Authorization: Basic ...`).

### Frontend Entry Points

- `login.html` – Custom login experience with success/error messaging.
- `register.html` – Self-service signup creating database-backed accounts.
- `index.html` – Main shopping and tracking portal.
- `admin.html` – Product management interface (available after login; actions require the admin role).

## Running Tests

Execute the automated test suite (uses H2, so MySQL is not required):
```powershell
./mvnw -B test
```

## REST API Cheat Sheet

| Method | Path                      | Description                             | Role |
|--------|---------------------------|-----------------------------------------|------|
| POST   | `/api/orders`             | Create a new order                      | ADMIN/USER |
| GET    | `/api/orders`             | List orders (own orders for users)      | ADMIN/USER |
| GET    | `/api/orders/{id}`        | Retrieve order by id                    | ADMIN/USER (own only) |
| PUT    | `/api/orders/{id}`        | Update order                            | ADMIN |
| PATCH  | `/api/orders/{id}/status` | Update only the status                  | ADMIN |
| PATCH  | `/api/orders/{id}/cancel` | Cancel order (pending/processing only)  | ADMIN/USER |
| DELETE | `/api/orders/{id}`        | Delete order                            | ADMIN |
| GET    | `/api/products`           | Fetch all products                      | ADMIN/USER |
| POST   | `/api/products`           | Create product                          | ADMIN |

All API routes require authentication via form login session or HTTP Basic.

## Notes

- Database seeding creates demo orders that reference sample usernames; newly registered users can create and track their own orders immediately.
- Adjust login redirects, password rules, or product seeding by modifying the classes under `config` and `service`.
- For production, update the datasource credentials and disable Spring DevTools if not needed.
