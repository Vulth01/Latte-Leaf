document.addEventListener('DOMContentLoaded', function () {
    const appSettings = {
        databaseURL: "https://latteleaf-84a8b-default-rtdb.europe-west1.firebasedatabase.app/"
    };

    const app = firebase.initializeApp(appSettings);
    const database = firebase.database();

    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const orderStatusText = document.getElementById('order-status-text');
    const orderIdElement = document.getElementById('order-id');
    const customerNameElement = document.getElementById('customer-name');
    const orderDateElement = document.getElementById('order-date');
    const orderItemsList = document.getElementById('order-items');
    const orderTotalElement = document.getElementById('order-total');

    function getOrderDetails(orderId) {
        return database.ref(`orders/${orderId}`).get().then((snapshot) => {
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

    function updateOrderStatus() {
        getOrderDetails(orderId).then(order => {
            if (order) {
                orderIdElement.textContent = orderId;
                customerNameElement.textContent = order.customerName;
                orderDateElement.textContent = order.date;
                orderItemsList.innerHTML = '';
                order.items.forEach(item => {
                    const itemElement = document.createElement('li');
                    itemElement.textContent = `${item.name} - x${item.quantity} - R ${item.price.toFixed(2)}${item.milkOption ? ` - ${item.milkOption}` : ''}`;
                    orderItemsList.appendChild(itemElement);
                });
                orderTotalElement.textContent = order.totalCost.toFixed(2);

                if (order.status === 'Complete') {
                    orderStatusText.textContent = 'Completed - Ready to collect!';
                    orderStatusText.classList.remove('processing', 'cancelled');
                    orderStatusText.classList.add('completed');
                } else if (order.status === 'Cancelled') {
                    orderStatusText.textContent = 'Cancelled';
                    orderStatusText.classList.remove('processing', 'completed');
                    orderStatusText.classList.add('cancelled');
                } else {
                    orderStatusText.textContent = 'Processing...';
                    orderStatusText.classList.remove('completed', 'cancelled');
                    orderStatusText.classList.add('processing');
                }
            } else {
                orderStatusText.textContent = 'Order not found';
            }
        });
    }

    setInterval(updateOrderStatus, 5000);
    updateOrderStatus();
});