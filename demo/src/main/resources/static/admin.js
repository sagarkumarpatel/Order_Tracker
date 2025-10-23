const statusEl = document.getElementById('status');
const loadOrdersButton = document.getElementById('loadOrders');
const refreshOrdersButton = document.getElementById('refreshOrders');
const createOrderForm = document.getElementById('createOrderForm');
const editOrderSection = document.getElementById('editOrderSection');
const editOrderForm = document.getElementById('editOrderForm');
const editOrderInfo = document.getElementById('editOrderInfo');
const cancelEditButton = document.getElementById('cancelEdit');
const ordersTableBody = document.querySelector('#ordersTable tbody');
const ownerUsernameInput = document.getElementById('ownerUsername');
const productForm = document.getElementById('productForm');
const productStatusEl = document.getElementById('productStatus');
const productTableBody = document.querySelector('#productTable tbody');
const refreshProductsButton = document.getElementById('refreshProducts');

const STATUS_OPTIONS = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const NON_CANCELLABLE_STATUSES = new Set(['shipped', 'delivered', 'cancelled']);

let editingOrderId = null;
const ordersCache = new Map();
let productsCache = [];

loadOrdersButton.addEventListener('click', loadOrders);
refreshOrdersButton.addEventListener('click', loadOrders);
createOrderForm.addEventListener('submit', handleCreateOrder);
editOrderForm.addEventListener('submit', handleSaveChanges);
cancelEditButton.addEventListener('click', () => {
    editingOrderId = null;
    editOrderSection.classList.add('hidden');
});
productForm.addEventListener('submit', handleCreateProduct);
refreshProductsButton.addEventListener('click', loadProducts);

loadProducts();

function getCredentials() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    return { username, password };
}

function getAuthHeader() {
    const { username, password } = getCredentials();
    if (!username || !password) {
        throw new Error('Enter both username and password.');
    }
    return 'Basic ' + btoa(`${username}:${password}`);
}

async function loadOrders() {
    statusEl.textContent = 'Loading orders…';
    statusEl.classList.remove('is-error');
    ordersTableBody.innerHTML = '';

    try {
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': getAuthHeader() }
        });

        if (response.status === 401) {
            throw new Error('Authentication failed. Check the username and password.');
        }

        if (!response.ok) {
            throw new Error(`Failed to load orders (${response.status}).`);
        }

        const orders = await response.json();
        renderOrders(orders);
        statusEl.textContent = `Loaded ${orders.length} order(s).`;
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

function renderOrders(orders) {
    ordersTableBody.innerHTML = '';
    ordersCache.clear();

    orders.forEach((order) => {
        const row = document.createElement('tr');
        const normalizedStatus = (order.status || '').toLowerCase();
        const isCancellable = !NON_CANCELLABLE_STATUSES.has(normalizedStatus);
        ordersCache.set(String(order.id), order);

        const statusControl = `
            <select data-order-id="${order.id}">
                ${STATUS_OPTIONS.map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
        `;

        const cancelButton = normalizedStatus !== 'cancelled'
            ? `<button type="button" data-action="cancel" data-order-id="${order.id}">Cancel</button>`
            : '';

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customerName || ''}</td>
            <td>${order.createdBy || ''}</td>
            <td>${order.productName || ''}</td>
            <td>${order.quantity ?? ''}</td>
            <td>${order.price ?? ''}</td>
            <td>${statusControl}</td>
            <td>${order.orderDate || ''}</td>
            <td>
                <div class="table-actions">
                    <button type="button" data-action="update" data-order-id="${order.id}">Update Status</button>
                    <button type="button" data-action="edit" data-order-id="${order.id}">Edit</button>
                    ${cancelButton}
                    <button type="button" data-action="delete" data-order-id="${order.id}">Delete</button>
                </div>
            </td>
        `;

        ordersTableBody.appendChild(row);
    });

    ordersTableBody.querySelectorAll('button[data-action]').forEach((button) => {
        button.addEventListener('click', handleRowAction);
    });
}

async function loadProducts() {
    setProductStatus('Loading products…');

    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`Failed to load products (${response.status}).`);
        }

        const data = await response.json();
        productsCache = Array.isArray(data) ? data : [];
        renderProducts();
        setProductStatus(`Loaded ${productsCache.length} product(s).`);
    } catch (error) {
        setProductStatus(error.message, true);
        productsCache = [];
        renderProducts();
    }
}

function renderProducts() {
    productTableBody.innerHTML = '';

    productsCache.forEach((product) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id ?? ''}</td>
            <td>${product.name ?? ''}</td>
            <td>${product.description ?? ''}</td>
            <td>${formatCurrency(Number(product.price ?? 0))}</td>
            <td>${formatDate(product.createdAt)}</td>
        `;
        productTableBody.appendChild(row);
    });
}

async function handleCreateProduct(event) {
    event.preventDefault();

    const nameInput = document.getElementById('catalogProductName');
    const descriptionInput = document.getElementById('catalogProductDescription');
    const priceInput = document.getElementById('catalogProductPrice');

    console.log('Submitting product form', {
        nameRaw: nameInput.value,
        descriptionRaw: descriptionInput.value,
        priceRaw: priceInput.value
    });

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const priceValue = Number(priceInput.value);

    if (!name || !description || Number.isNaN(priceValue) || priceValue < 0) {
        setProductStatus('Enter a name, description, and a non-negative price.', true);
        return;
    }

    try {
        setProductStatus('Creating product…');

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({
                name,
                description,
                price: priceValue
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Check the username and password.');
            }
            if (response.status === 403) {
                throw new Error('Only administrators can add new products.');
            }
            const problem = await safeJson(response);
            if (problem?.message) {
                throw new Error(problem.message);
            }
            throw new Error(`Failed to create product (${response.status}).`);
        }

        productForm.reset();
        setProductStatus('Product created successfully.');
        broadcastCatalogUpdate();
        await loadProducts();
    } catch (error) {
        setProductStatus(error.message, true);
    }
}

async function handleRowAction(event) {
    const action = event.target.dataset.action;
    const orderId = event.target.dataset.orderId;

    if (!action || !orderId) {
        return;
    }

    switch (action) {
        case 'update':
            await updateOrderStatus(orderId);
            break;
        case 'edit':
            startEditing(orderId);
            break;
        case 'delete':
            await deleteOrder(orderId);
            break;
        case 'cancel':
            await cancelOrder(orderId);
            break;
        default:
            break;
    }
}

async function handleCreateOrder(event) {
    event.preventDefault();

    const payload = {
        customerName: document.getElementById('customerName').value.trim(),
        productName: document.getElementById('productName').value.trim(),
        quantity: Number(document.getElementById('quantity').value),
        price: Number(document.getElementById('price').value),
        status: document.getElementById('statusInput').value,
        orderDate: document.getElementById('orderDate').value
    };

    const ownerUsername = ownerUsernameInput.value.trim();
    if (ownerUsername) {
        payload.createdBy = ownerUsername;
    }

    if (!payload.customerName || !payload.productName || !payload.orderDate || Number.isNaN(payload.quantity) || Number.isNaN(payload.price)) {
        statusEl.textContent = 'Please fill out every field with valid values.';
        statusEl.classList.add('is-error');
        return;
    }

    try {
        statusEl.textContent = 'Creating order…';
        statusEl.classList.remove('is-error');

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to create order (${response.status}).`);
        }

        createOrderForm.reset();
        ownerUsernameInput.value = '';
        statusEl.textContent = 'Order created successfully.';
        await loadOrders();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

function startEditing(orderId) {
    const order = ordersCache.get(String(orderId));
    if (!order) {
        statusEl.textContent = 'Unable to find that order in the current list.';
        statusEl.classList.add('is-error');
        return;
    }

    editingOrderId = orderId;
    editOrderInfo.textContent = `Editing order #${orderId}`;
    document.getElementById('editCustomerName').value = order.customerName || '';
    document.getElementById('editProductName').value = order.productName || '';
    document.getElementById('editQuantity').value = order.quantity ?? 1;
    document.getElementById('editPrice').value = order.price ?? 0;
    document.getElementById('editStatus').value = order.status || 'Pending';
    document.getElementById('editOrderDate').value = order.orderDate ? order.orderDate.slice(0, 16) : '';
    editOrderSection.classList.remove('hidden');
    window.scrollTo({ top: editOrderSection.offsetTop - 80, behavior: 'smooth' });
}

async function handleSaveChanges(event) {
    event.preventDefault();

    if (!editingOrderId) {
        statusEl.textContent = 'Select an order to edit first.';
        statusEl.classList.add('is-error');
        return;
    }

    const payload = {
        customerName: document.getElementById('editCustomerName').value.trim(),
        productName: document.getElementById('editProductName').value.trim(),
        quantity: Number(document.getElementById('editQuantity').value),
        price: Number(document.getElementById('editPrice').value),
        status: document.getElementById('editStatus').value,
        orderDate: document.getElementById('editOrderDate').value
    };

    if (!payload.customerName || !payload.productName || !payload.orderDate || Number.isNaN(payload.quantity) || Number.isNaN(payload.price)) {
        statusEl.textContent = 'Please provide valid values for every edit field.';
        statusEl.classList.add('is-error');
        return;
    }

    try {
        statusEl.textContent = `Saving changes for order ${editingOrderId}…`;
        statusEl.classList.remove('is-error');

        const response = await fetch(`/api/orders/${editingOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to update order (${response.status}).`);
        }

        editingOrderId = null;
        editOrderSection.classList.add('hidden');
        statusEl.textContent = 'Order updated successfully.';
        await loadOrders();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

async function updateOrderStatus(orderId) {
    const select = document.querySelector(`select[data-order-id="${orderId}"]`);
    if (!select) {
        return;
    }

    const newStatus = select.value;

    try {
        statusEl.textContent = `Updating order ${orderId}…`;
        statusEl.classList.remove('is-error');

        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error(`Failed to update order ${orderId} (${response.status}).`);
        }

        statusEl.textContent = `Order ${orderId} updated to ${newStatus}.`;
        await loadOrders();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

async function cancelOrder(orderId) {
    try {
        statusEl.textContent = `Cancelling order ${orderId}…`;
        statusEl.classList.remove('is-error');

        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': getAuthHeader() }
        });

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error(`Order ${orderId} can no longer be cancelled.`);
            }
            if (response.status === 403) {
                throw new Error('You do not have permission to cancel this order.');
            }
            if (response.status === 404) {
                throw new Error(`Order ${orderId} was not found.`);
            }
            throw new Error(`Failed to cancel order ${orderId} (${response.status}).`);
        }

        statusEl.textContent = `Order ${orderId} cancelled.`;
        await loadOrders();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

async function deleteOrder(orderId) {
    if (!window.confirm(`Delete order #${orderId}?`)) {
        return;
    }

    try {
        statusEl.textContent = `Deleting order ${orderId}…`;
        statusEl.classList.remove('is-error');

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': getAuthHeader() }
        });

        if (response.status !== 204) {
            throw new Error(`Failed to delete order ${orderId} (${response.status}).`);
        }

        if (editingOrderId === orderId) {
            editingOrderId = null;
            editOrderSection.classList.add('hidden');
        }

        statusEl.textContent = `Order ${orderId} deleted.`;
        await loadOrders();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add('is-error');
    }
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDate(isoString) {
    if (!isoString) {
        return '—';
    }

    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) {
        return isoString;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

function broadcastCatalogUpdate() {
    try {
        const channel = new BroadcastChannel('productCatalog');
        channel.postMessage({ type: 'refresh' });
        channel.close();
    } catch (error) {
        try {
            localStorage.setItem('productCatalogUpdated', String(Date.now()));
        } catch (storageError) {
            // Ignore storage issues; storefront will rely on manual refresh.
        }
    }
}
