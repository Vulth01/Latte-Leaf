document.addEventListener('DOMContentLoaded', function() {
    const appSettings = {
        databaseURL: "https://latteleaf-84a8b-default-rtdb.europe-west1.firebasedatabase.app/"
    };

    const app = firebase.initializeApp(appSettings);
    const database = firebase.database();

    const ordersList = document.getElementById('orders-list');
    const totalOrders = document.getElementById('total-orders');

    function getOrders() {
        return database.ref('orders').get().then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No data available");
                return {};
            }
        }).catch((error) => {
            console.error(error);
            return {};
        });
    }

    function displayOrders(orders) {
        ordersList.innerHTML = '';
        const orderKeys = Object.keys(orders);
        const inProgressOrders = orderKeys.filter(orderKey => orders[orderKey].status === 'In Progress');
        totalOrders.textContent = inProgressOrders.length;

        inProgressOrders.forEach(orderKey => {
            const order = orders[orderKey];
            const orderElement = document.createElement('li');
            orderElement.classList.add('order-item');

            let orderItemsHTML = '';
            order.items.forEach(item => {
                orderItemsHTML += `
                    <p><strong>${item.name}</strong> - x${item.quantity} - R ${item.price.toFixed(2)}${item.milkOption ? ` - ${item.milkOption}` : ''}</p>
                `;
            });

            orderElement.innerHTML = `
                <h3>Order #${orderKey}</h3>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <div>${orderItemsHTML}</div>
                <p><strong>Date:</strong> ${order.timestamp}</p>
                <p><strong>Total:</strong> R ${order.totalCost.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <div class="order-buttons">
                    <button class="complete" data-order-id="${orderKey}">Complete</button>
                    <button class="cancel" data-order-id="${orderKey}">Cancel</button>
                </div>
            `;

            ordersList.appendChild(orderElement);
        });

        attachEventListeners();
    }

    function completeOrder(orderId) {
        database.ref(`orders/${orderId}`).update({ status: 'Complete' }).then(() => {
            getOrders().then(displayOrders);
        }).catch((error) => {
            console.error(error);
        });
    }

    function cancelOrder(orderId) {
        database.ref(`orders/${orderId}`).update({ status: 'Cancelled' }).then(() => {
            getOrders().then(displayOrders);
        }).catch((error) => {
            console.error(error);
        });
    }

    function attachEventListeners() {
        const completeButtons = document.querySelectorAll('.complete');
        const cancelButtons = document.querySelectorAll('.cancel');

        completeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-order-id');
                completeOrder(orderId);
            });
        });

        cancelButtons.forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-order-id');
                cancelOrder(orderId);
            });
        });
    }

    getOrders().then(displayOrders);

    setInterval(function() {
        getOrders().then(displayOrders);
    }, 5000);
});