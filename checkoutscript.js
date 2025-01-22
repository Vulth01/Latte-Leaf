document.addEventListener('DOMContentLoaded', function() {
    const appSettings = {
        databaseURL: "https://latteleaf-84a8b-default-rtdb.europe-west1.firebasedatabase.app/"
    };

    const app = firebase.initializeApp(appSettings);
    const database = firebase.database();

    const cartItemsList = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const confirmCheckoutBtn = document.getElementById('confirm-checkout');
    const backButton = document.getElementById('back-btn');
    const dateTime = document.getElementById('order-date');
    const confirmCheckbox = document.getElementById('confirm-checkbox');
    const today = new Date().toISOString().split('T')[0];
    dateTime.value = today;

    const urlParams = new URLSearchParams(window.location.search);
    const orderKey = urlParams.get('orderKey');

    function getOrderDetails(orderKey) {
        return database.ref(`orders/${orderKey}`).get().then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No data available");
                return null;
            }
        }).catch((error) => {
            console.error(error);
            return null;
        });
    }

    function displayCart(order) {
        cartItemsList.innerHTML = '';
        let total = 0;

        order.items.forEach(item => {
            const milkOption = item.milkOption ? item.milkOption : '';
            const itemElement = document.createElement('li');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">R ${item.price.toFixed(2)}</span>
                <span class="cart-item-quantity">${item.quantity}</span>
                <span class="cart-item-total">R ${(item.price * item.quantity).toFixed(2)}</span>
                ${milkOption && milkOption !== 'regular' ? `<span class="cart-item-milk highlight">Milk: ${milkOption}</span>` : `<span class="cart-item-milk">Milk: ${milkOption}</span>`}
            `;
            cartItemsList.appendChild(itemElement);
            total += item.price * item.quantity;
        });

        cartTotal.textContent = `R ${total.toFixed(2)}`;
    }

    function storeOrder() {
        getOrderDetails(orderKey).then(order => {
            if (!order) {
                alert("No order details found. Please try again.");
                return;
            }

            const total = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const orderDate = dateTime.value;

            const updatedOrder = {
                ...order,
                total: total,
                date: orderDate,
                status: 'processing'
            };

            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(updatedOrder);
            localStorage.setItem('orders', JSON.stringify(orders));

            window.location.href = `order-details.html?orderId=${orderKey}`;
        });
    }

    getOrderDetails(orderKey).then(displayCart);

    function updateConfirmButtonState() {
        confirmCheckoutBtn.disabled = !(dateTime.value !== "" && confirmCheckbox.checked);
    }

    dateTime.addEventListener('input', updateConfirmButtonState);
    confirmCheckbox.addEventListener('change', updateConfirmButtonState);

    confirmCheckoutBtn.addEventListener('click', function() {
        storeOrder();
    });

    backButton.addEventListener('click', function() {
        history.back();
    });
});