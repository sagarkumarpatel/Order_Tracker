# Order Tracking System

A Spring Boot application for tracking customer orders with role-based security and a lightweight frontend for status updates.

## Features

- RESTful CRUD API for managing orders (create, list, retrieve, update, delete, status-only updates, cancel).
- Spring Data JPA persistence with MySQL in production and H2 in tests.
- Spring Security basic authentication with ADMIN and USER roles, including ownership checks so customers only see and cancel their own orders.
- HTML/JavaScript frontend under `src/main/resources/static/index.html` for listing orders, creating new ones, editing, cancelling, and deleting (admin only) via `fetch`.
- Automatic seeding of three sample orders on startup so you can explore the UI immediately.

## Project Structure

- `src/main/java/com/example/ordertrackingsystem` – Application entry point and domain packages (`model`, `repository`, `service`, `controller`, `config`).
- `src/main/resources/application.properties` – MySQL datasource configuration.
- `src/test/resources/application.properties` – H2 datasource configuration for automated tests.
- `.vscode/tasks.json` – VS Code task for running `./mvnw -B verify`.

## Prerequisites

- JDK 17+
- Maven wrapper (included)
- Running MySQL instance with database `order_tracking_db`, user `root`, password `hello1xx` (configurable in `application.properties`).

## Running the Application

1. Start the backend:
   ```powershell
   ./mvnw spring-boot:run
   ```
2. Access the REST API at `http://localhost:8080/api/orders`.
3. Open the frontend at `http://localhost:8080/index.html` and provide credentials when prompted.

### Default Credentials

- ADMIN: `admin` / `admin123`
- USER: `user` / `user123`

**Admin capabilities:** full CRUD across all orders (create on behalf of any user, edit, update status, cancel, delete).

**User/customer capabilities:** create orders for themselves, view only their own orders, cancel a pending order, and track current status.

## Testing

Run the Maven verify goal (compilation + tests):
```powershell
./mvnw -B verify
```
The build uses an in-memory H2 database so it can run without the MySQL instance.

## API Overview

| Method | Path                       | Description                          | Role |
|--------|----------------------------|--------------------------------------|------|
| POST   | `/api/orders`              | Create order                          | ADMIN/USER (admin may set owner) |
| GET    | `/api/orders`              | List accessible orders (all or own)   | ADMIN/USER |
| GET    | `/api/orders/{id}`         | Retrieve order by id                  | ADMIN/USER (own orders only for users) |
| PUT    | `/api/orders/{id}`         | Update order                          | ADMIN |
| PATCH  | `/api/orders/{id}/status`  | Update only order status              | ADMIN |
| PATCH  | `/api/orders/{id}/cancel`  | Cancel order (user before shipping)   | ADMIN/USER |
| DELETE | `/api/orders/{id}`         | Delete order                          | ADMIN |

All endpoints require HTTP Basic authentication.

## Frontend Usage

1. Open `http://localhost:8080/index.html` while the app runs.
2. Enter credentials.
   - Admin sessions show full controls (status dropdowns, edit/delete/cancel buttons, owner override when creating).
   - User sessions show only their orders along with cancel buttons for pending orders.
3. Click **Load Orders** to fetch data.
4. Use the create form, edit panel, cancellation, and (for admins) status/update/delete actions as needed.

## Sample cURL Commands

See `curl` snippets in the assistant response history or adapt the following template:
```bash
curl -u admin:admin123 -X PATCH http://localhost:8080/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Shipped"}'
```

## Notes

- Adjust datasource credentials and Hibernate settings in `application.properties` as needed.
- Update the in-memory test data or add further integration tests to cover new business logic.
