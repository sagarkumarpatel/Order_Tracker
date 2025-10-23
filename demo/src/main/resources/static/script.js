let catalog = [];

const productGrid = document.getElementById('product-grid');
const productMessageEl = document.getElementById('productMessage');
const cartItemsEl = document.getElementById('cart-items');
const cartSummaryEl = document.getElementById('cart-summary');
const cartTotalEl = document.getElementById('cart-total');
const cartEmptyEl = document.getElementById('cart-empty');
const cartFeedback = document.getElementById('cart-feedback');

const checkoutForm = document.getElementById('checkout-form');
const checkoutFeedback = document.getElementById('checkout-feedback');
const checkoutButton = document.querySelector('.checkout-button');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const createdOrdersWrapper = document.getElementById('created-orders-wrapper');
const createdOrdersList = document.getElementById('created-orders');

const trackForm = document.getElementById('track-form');
const orderInput = document.getElementById('orderId');
const feedback = document.getElementById('feedback');
const resultCard = document.getElementById('result-card');
const resultOrderId = document.getElementById('result-orderId');
const resultCustomer = document.getElementById('result-customer');
const resultStatus = document.getElementById('result-status');
const resultDelivery = document.getElementById('result-delivery');

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

let cart = [];
const recentOrders = [];
let cartMessageTimeout;
let catalogChannel = null;

renderProducts();
loadProducts();
updateCartUI();
renderCreatedOrders();
subscribeToCatalogUpdates();

productGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-product-id]');
    if (!button) {
        return;
    }
    addToCart(button.dataset.productId);
});

cartItemsEl.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (!action) {
        return;
    }

    const productId = event.target.dataset.productId;
    const item = cart.find((entry) => entry.id === productId);
    if (!item) {
        return;
    }

    if (action === 'increment') {
        item.quantity += 1;
    } else if (action === 'decrement') {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart = cart.filter((entry) => entry.id !== productId);
            displayCartMessage(`${item.name} removed from your cart.`);
        }
    } else if (action === 'remove') {
        cart = cart.filter((entry) => entry.id !== productId);
        displayCartMessage(`${item.name} removed from your cart.`);
    }

    updateCartUI();
});

checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayCheckoutMessage('', false);

    if (cart.length === 0) {
        displayCheckoutMessage('Add items to your cart before checking out.', true);
        return;
    }

    const formData = new FormData(checkoutForm);
    const customerName = (formData.get('customerName') || '').trim();
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';

    if (!customerName) {
        displayCheckoutMessage('Please enter the customer name.', true);
        return;
    }

    if (!username || !password) {
        displayCheckoutMessage('Enter your backend username and password.', true);
        return;
    }

    setCheckoutState(true);

    try {
        const created = [];
        for (const item of cart) {
            const order = await createOrderForItem(item, { customerName, username, password });
            created.push(order);
        }

        created.forEach((order) => {
            addRecentOrder(order);
        });
        renderCreatedOrders();

        displayCheckoutMessage(`Created ${created.length} order(s)! Track them below.`, false);
        cart = [];
        updateCartUI();
        checkoutForm.reset();
        usernameInput.value = username;
        passwordInput.value = password;

        if (created.length > 0 && created[0].id != null) {
            const firstId = String(created[0].id);
            orderInput.value = firstId;
            trackOrderById(firstId);
        }
    } catch (error) {
        displayCheckoutMessage(error.message, true);
    } finally {
        setCheckoutState(false);
    }
});

createdOrdersList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-track-order]');
    if (!button) {
        return;
    }
    const orderId = button.dataset.trackOrder;
    orderInput.value = orderId;
    trackOrderById(orderId);
});

trackForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const orderId = orderInput.value.trim();

    if (!orderId || !/^\d+$/.test(orderId)) {
        setTrackingMessage('Please enter a numeric order ID (e.g., 42).', true);
        hideResult();
        return;
    }

    trackOrderById(orderId);
});

async function loadProducts() {
    setProductMessage('Loading products…');
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`Unable to load products (${response.status}).`);
        }

        const payload = await response.json();
        catalog = Array.isArray(payload)
            ? payload.map((item) => ({
                id: item.id != null ? String(item.id) : crypto.randomUUID(),
                name: item.name || 'Untitled Product',
                description: item.description || 'No description provided.',
                price: Number(item.price ?? 0)
            }))
            : [];

        renderProducts();
        if (catalog.length === 0) {
            setProductMessage('No products available yet. Check back soon.');
        } else {
            setProductMessage('Choose an item to add it to your cart.');
        }
    } catch (error) {
        catalog = [];
        renderProducts();
        setProductMessage(error.message, true);
    }
}

function renderProducts() {
    const fragment = document.createDocumentFragment();

    productGrid.innerHTML = '';

    catalog.forEach((product) => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
            </div>
            <div class="product-meta">
                <span class="price-tag">${formatCurrency(product.price)}</span>
                <button type="button" data-product-id="${product.id}">Add to Cart</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    productGrid.appendChild(fragment);
}

function addToCart(productId) {
    const product = catalog.find((item) => item.id === productId);
    if (!product) {
        return;
    }

    const existing = cart.find((item) => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }

    updateCartUI();
    displayCartMessage(`Added ${product.name} to your cart.`);
}

function updateCartUI() {
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
        cartEmptyEl.classList.remove('hidden');
        cartSummaryEl.classList.add('hidden');
        cartTotalEl.textContent = formatCurrency(0);
        return;
    }

    cartEmptyEl.classList.add('hidden');
    cartSummaryEl.classList.remove('hidden');

    cart.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatCurrency(item.price)} each</p>
            </div>
            <div class="cart-controls">
                <button type="button" data-action="decrement" data-product-id="${item.id}" aria-label="Decrease quantity">-</button>
                <span class="quantity">${item.quantity}</span>
                <button type="button" data-action="increment" data-product-id="${item.id}" aria-label="Increase quantity">+</button>
                <span class="item-total">${formatCurrency(item.price * item.quantity)}</span>
                <button type="button" class="remove" data-action="remove" data-product-id="${item.id}" aria-label="Remove from cart">&times;</button>
            </div>
        `;
        cartItemsEl.appendChild(li);
    });

    cartTotalEl.textContent = formatCurrency(calculateCartTotal());
}

function calculateCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function displayCartMessage(message) {
    if (!cartFeedback) {
        return;
    }

    clearTimeout(cartMessageTimeout);

    if (!message) {
        cartFeedback.classList.add('hidden');
        cartFeedback.textContent = '';
        return;
    }

    cartFeedback.textContent = message;
    cartFeedback.classList.remove('hidden');
    cartMessageTimeout = setTimeout(() => {
        cartFeedback.classList.add('hidden');
    }, 3000);
}

function setProductMessage(message, isError = false) {
    if (!productMessageEl) {
        return;
    }

    productMessageEl.textContent = message;
    productMessageEl.classList.toggle('is-error', !!isError);
}

function setCheckoutState(isLoading) {
    checkoutButton.disabled = isLoading;
    checkoutButton.textContent = isLoading ? 'Placing order…' : 'Place Order';
}

function displayCheckoutMessage(message, isError) {
    checkoutFeedback.textContent = message;
    checkoutFeedback.classList.toggle('is-error', !!message && !!isError);
    checkoutFeedback.classList.toggle('is-success', !!message && !isError);
}

async function createOrderForItem(item, details) {
    const payload = {
        customerName: details.customerName,
        productName: item.name,
        quantity: item.quantity,
        price: Number((item.price * item.quantity).toFixed(2)),
        status: 'Pending',
        orderDate: buildOrderDate()
    };

    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${details.username}:${details.password}`)
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Authentication failed. Check the username and password and try again.');
        }
        if (response.status === 403) {
            throw new Error('You do not have permission to place orders with these credentials.');
        }
        throw new Error(`Unable to create an order for ${item.name}. (${response.status})`);
    }

    return response.json();
}

function addRecentOrder(order) {
    recentOrders.unshift({
        id: order.id != null ? String(order.id) : '',
        productName: order.productName,
        status: order.status,
        createdAt: order.orderDate
    });

    if (recentOrders.length > 5) {
        recentOrders.length = 5;
    }
}

function renderCreatedOrders() {
    if (recentOrders.length === 0) {
        createdOrdersWrapper.classList.add('hidden');
        createdOrdersList.innerHTML = '';
        return;
    }

    createdOrdersWrapper.classList.remove('hidden');
    createdOrdersList.innerHTML = '';

    recentOrders.forEach((order) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>Order #${order.id || '—'}</strong>
                <span>${order.productName || 'Order created'}</span>
                <span>Status: ${order.status || 'Pending'}</span>
            </div>
            <button type="button" data-track-order="${order.id}">Track order</button>
        `;
        createdOrdersList.appendChild(li);
    });
}

async function trackOrderById(orderId) {
    setTrackingLoading(true);
    setTrackingMessage('Fetching latest status…');
    hideResult();

    try {
        const response = await fetch(`/track/${encodeURIComponent(orderId)}`);

        if (response.status === 404) {
            throw new Error('We could not find an order with that ID.');
        }

        if (response.status === 400) {
            throw new Error('Order IDs must be numeric.');
        }

        if (!response.ok) {
            throw new Error('Unable to fetch order status right now. Please try again later.');
        }

        const data = await response.json();
        updateResult(data, orderId);
        setTrackingMessage('We found your order! Here is the latest information.', false);
    } catch (error) {
        setTrackingMessage(error.message, true);
    } finally {
        setTrackingLoading(false);
    }
}

function updateResult(data, fallbackId) {
    resultOrderId.textContent = data.orderId ?? fallbackId ?? '—';
    resultCustomer.textContent = data.customerName ?? '—';
    const statusText = data.status ?? '—';
    resultStatus.textContent = statusText;
    resultDelivery.textContent = formatDelivery(data.estimatedDelivery, statusText);
    resultCard.classList.remove('hidden');
}

function hideResult() {
    resultCard.classList.add('hidden');
}

function setTrackingMessage(message, isError = false) {
    feedback.textContent = message;
    feedback.classList.toggle('is-error', !!message && !!isError);
    feedback.classList.toggle('is-success', !!message && !isError);
}

function setTrackingLoading(isLoading) {
    orderInput.disabled = isLoading;
    const submitButton = trackForm.querySelector('button[type="submit"]');
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Checking…' : 'Check Status';
}

function buildOrderDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatCurrency(value) {
    return currencyFormatter.format(value);
}

function formatDelivery(isoString, status) {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'delivered') {
        return 'Delivery successful.';
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
        return 'Delivery was cancelled.';
    }

    if (!isoString) {
        return '—';
    }

    const [datePart, timePart = ''] = isoString.split('T');
    if (!datePart) {
        return isoString;
    }

    const [year, month, day] = datePart.split('-');
    const [hour = '00', minute = '00'] = timePart.split(':');
    return `${month}/${day}/${year} ${hour}:${minute}`;
}

function subscribeToCatalogUpdates() {
    try {
        catalogChannel = new BroadcastChannel('productCatalog');
        catalogChannel.addEventListener('message', (event) => {
            if (event?.data?.type === 'refresh') {
                loadProducts();
            }
        });
    } catch (error) {
        // BroadcastChannel might not be supported (e.g., older browsers). Fallback to storage events.
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'productCatalogUpdated') {
            loadProducts();
        }
    });

    window.addEventListener('focus', () => {
        loadProducts();
    });
}
