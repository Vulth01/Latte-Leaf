document.addEventListener('DOMContentLoaded', function () {
    const appSettings = {
        databaseURL: "https://latteleaf-84a8b-default-rtdb.europe-west1.firebasedatabase.app/"
    };

    const app = firebase.initializeApp(appSettings);
    const database = firebase.database();

    const searchBtn = document.getElementById('search-btn');
    const customerNameInput = document.getElementById('customer-name');
    const ordersList = document.getElementById('orders-list');
    const orderResultsSection = document.getElementById('order-results');
    const backButton = document.getElementById('back-btn');

    let customerName = '';

    searchBtn.addEventListener('click', function () {
        customerName = customerNameInput.value.trim();
        if (customerName) {
            searchOrders(customerName);
        } else {
            alert('Please enter your name.');
        }
    });

    customerNameInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchBtn.click();
        }
    });

    backButton.addEventListener('click', function() {
        history.back();
    });

    function searchOrders(name) {
        const lowerCaseName = name.toLowerCase();
        database.ref('orders').orderByChild('customerName').equalTo(lowerCaseName).get().then((snapshot) => {
            if (snapshot.exists()) {
                displayOrders(snapshot.val());
            } else {
                ordersList.innerHTML = '<li>No orders found for this name.</li>';
                orderResultsSection.style.display = 'block';
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    function displayOrders(orders) {
        ordersList.innerHTML = '';
        Object.keys(orders).forEach(orderKey => {
            const order = orders[orderKey];
            const orderElement = document.createElement('li');
            orderElement.classList.add('order-item');
    
            let orderItemsHTML = '';
            order.items.forEach(item => {
                orderItemsHTML += `
                    <p><strong>${item.name}</strong> - x${item.quantity} - R ${item.price.toFixed(2)}${item.milkOption ? ` - ${item.milkOption}` : ''}</p>
                `;
            });
    
            const orderDate = new Date(order.timestamp);
            const formattedDate = orderDate.toLocaleDateString();
            const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
            let statusColor = '';
            let backgroundColor = '';
            if (order.status === 'Complete') {
                statusColor = 'green';
                backgroundColor = 'rgba(176, 255, 176, 0.9)';
            } else if (order.status === 'Cancelled') {
                statusColor = 'red';
                backgroundColor = 'rgba(255, 200, 200, 0.9)';
            }
    
            orderElement.style.backgroundColor = backgroundColor;
    
            orderElement.innerHTML = `
                <h3>Order #${orderKey}</h3>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <div>${orderItemsHTML}</div>
                <p><strong>Date:</strong> ${formattedDate} ${formattedTime}</p>
                <p><strong>Total:</strong> R ${order.totalCost.toFixed(2)}</p>
                <p><strong>Status:</strong> <span style="color: ${statusColor};">${order.status}</span></p>
            `;
    
            const now = new Date();
            const timeDifference = (now - orderDate) / 1000 / 60; // Time difference in minutes
    
            if (timeDifference < 2 && order.status !== 'Cancelled' && order.status !== 'Complete') {
                const cancelButton = document.createElement('button');
                cancelButton.classList.add('cancel-order-btn');
                cancelButton.setAttribute('data-order-id', orderKey);
                cancelButton.textContent = 'Cancel Order';
                orderElement.appendChild(cancelButton);
            }
    
            ordersList.appendChild(orderElement);
        });
    
        attachCancelOrderEventListeners();
        orderResultsSection.style.display = 'block';
    }

    function attachCancelOrderEventListeners() {
        const cancelOrderButtons = document.querySelectorAll('.cancel-order-btn');
        cancelOrderButtons.forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-order-id');
                cancelOrder(orderId, button);
            });
        });
    }

    function cancelOrder(orderId, button) {
        database.ref(`orders/${orderId}`).get().then((snapshot) => {
            if (snapshot.exists()) {
                const order = snapshot.val();
                const orderDate = new Date(order.timestamp);
                const now = new Date();
                const timeDifference = (now - orderDate) / 1000 / 60; // Time difference in minutes

                if (timeDifference < 2) {
                    database.ref(`orders/${orderId}`).update({ status: 'Cancelled' }).then(() => {
                        button.style.display = 'none'; // Hide the button after cancellation
                        searchOrders(customerName);
                    }).catch((error) => {
                        console.error(error);
                    });
                } else {
                    alert('You can only cancel the order within 2 minutes of placing it.');
                }
            } else {
                alert('Order not found.');
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    setInterval(() => {
        if (customerName) {
            searchOrders(customerName);
        }
    }, 5000);
});