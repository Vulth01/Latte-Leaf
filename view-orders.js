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

    backButton.addEventListener('click', function() {
        history.back();
    });

    function searchOrders(name) {
        const lowerCaseName = name.toLowerCase(); // Convert to lowercase
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
    
            // Format the date and time
            const orderDate = new Date(order.timestamp);
            const formattedDate = orderDate.toLocaleDateString();
            const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
            // Determine the status color and background color
            let statusColor = '';
            let backgroundColor = '';
            if (order.status === 'Complete') {
                statusColor = 'green';
                backgroundColor = 'rgba(176, 255, 176, 0.9)'; // Light green background
            } else if (order.status === 'Cancelled') {
                statusColor = 'red';
                backgroundColor = 'rgba(255, 200, 200, 0.9)'; // Light red background
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
    
            ordersList.appendChild(orderElement);
        });
    
        orderResultsSection.style.display = 'block';
    }
    
    setInterval(() => {
        if (customerName) {
            searchOrders(customerName);
        }
    }, 5000);
});