import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
    databaseURL: "https://latteleaf-84a8b-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const ordersInDB = ref(database, "orders");

const itemSelect = document.getElementById('item-select');
const addToCartButton = document.getElementById('add-to-cart');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
var checkoutBtn = document.getElementById('checkout-btn');

let cartItems = [];

if (localStorage.getItem('cart')) {
    cartItems = JSON.parse(localStorage.getItem('cart'));
    displayCart();
}


document.getElementById('view-orders-btn').addEventListener('click', () => {
    window.location.href = 'view-orders.html';
});

function getItemName(optionText) {
    const parts = optionText.split(' - ');
    return parts.length > 1 ? parts[1] : optionText;
}

function requiresMilkOption(name) {
    const milkOptionItems = [
        "ESPRESSO SINGLE",
        "ESPRESSO DOUBLE",
        "CAPPUCCINO SINGLE",
        "CAPPUCCINO DOUBLE",
        "FLAT WHITE DOUBLE",
        "LATTE SINGLE",
        "AMERICANO SINGLE",
        "AMERICANO DOUBLE",
        "CHAI LATTE",
        "DIRTY CHAI LATTE",
        "MOCHA",
        "HOT CHOCOLATE",
        "5 ROSES TEA",
        "ROOIBOS TEA",
        "ICED LATTE",
        "ICED MOCHA LATTE",
        "FREEZO",
        "MOCHA FREEZO",
        "CHOCOLATE FREEZO"
    ];
    return milkOptionItems.includes(name);
}

function addToCart(name, price, quantity, milkOption) {
    const existingItem = cartItems.find(item => item.name === name && item.milkOption === milkOption);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({
            name: name,
            price: price,
            quantity: quantity,
            milkOption: requiresMilkOption(name) ? milkOption : null
        });
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    displayCart();
}

function displayCart() {
    cartItemsList.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
        cartItemsList.innerHTML = '<li>Your cart is empty!</li>';
        cartTotal.textContent = 'R 0.00';
        return;
    }

    cartItems.forEach(item => {
        const itemElement = document.createElement('li');
        itemElement.classList.add('cart-item');
        itemElement.dataset.name = item.name;

        itemElement.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-quantity">x ${item.quantity}</span>
            <span class="cart-item-total">R ${(item.price * item.quantity).toFixed(2)}</span>
        `;

        if (requiresMilkOption(item.name)) {
            const dropdown = document.createElement('select');
            dropdown.innerHTML = `
                <option value="regular">Regular</option>
                <option value="none">None</option>
                <option value="almond">Almond</option>
                <option value="oat">Oat</option>
            `;
            dropdown.value = item.milkOption || "regular";
            dropdown.addEventListener('change', (event) => {
                updateMilkOption(item.name, event.target.value);
            });
            itemElement.appendChild(dropdown);
        }

        const buttons = document.createElement('div');
        buttons.innerHTML = `
            <button class="cart-item-subtract">-1</button>
            <button class="cart-item-remove">x</button>
            <button class="cart-item-add">+1</button>
        `;
        itemElement.appendChild(buttons);

        cartItemsList.appendChild(itemElement);

        total += item.price * item.quantity;
    });

    cartTotal.textContent = `R ${total.toFixed(2)}`;

    attachCartItemEventListeners();
}

function updateMilkOption(name, milkOption) {
    const item = cartItems.find(item => item.name === name);
    if (item) {
        item.milkOption = milkOption;
    }
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

function attachCartItemEventListeners() {
    const removeButtons = document.querySelectorAll('.cart-item-remove');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.parentElement.dataset.name;
            const milkOption = button.parentElement.parentElement.querySelector('select')?.value || null;
            removeFromCart(itemName, milkOption);
        });
    });

    const subtractButtons = document.querySelectorAll('.cart-item-subtract');
    subtractButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.parentElement.dataset.name;
            const milkOption = button.parentElement.parentElement.querySelector('select')?.value || null;
            subtractItem(itemName, milkOption);
        });
    });

    const addButtons = document.querySelectorAll('.cart-item-add');
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemName = button.parentElement.parentElement.dataset.name;
            const milkOption = button.parentElement.parentElement.querySelector('select')?.value || null;
            addItem(itemName, milkOption);
        });
    });
}

function subtractItem(name, milkOption) {
    const item = cartItems.find(item => item.name === name && item.milkOption === milkOption);

    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(name, milkOption);
        }
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    displayCart();
}

function addItem(name, milkOption) {
    const item = cartItems.find(item => item.name === name && item.milkOption === milkOption);
    if (item) {
        item.quantity += 1;
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    displayCart();
}

function removeFromCart(name, milkOption) {
    cartItems = cartItems.filter(item => item.name !== name || item.milkOption !== milkOption);
    localStorage.setItem('cart', JSON.stringify(cartItems));
    displayCart();
}

addToCartButton.addEventListener('click', addToCartFromSelect);

function addToCartFromSelect() {
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];

    if (!selectedOption.value) {
        alert('Please select a product.');
        return;
    }

    const optionText = selectedOption.textContent.trim();
    const name = getItemName(optionText);
    const price = parseFloat(selectedOption.value);
    const quantity = parseInt(document.getElementById('select-quantity').value);
    const milkOption = requiresMilkOption(name) ? "regular" : null;

    addToCart(name, price, quantity, milkOption);
}

checkoutBtn.addEventListener('click', () => {
    if (cartItems.length < 1) {
        alert('Your cart is empty! Please add some items before proceeding.');
        return;
    }

    let customerName = prompt("Please enter your name:");

    if (!customerName) {
        alert('Customer name is required.');
        return;
    }

    customerName = customerName.toLowerCase(); // Convert to lowercase

    const totalCost = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    const order = {
        items: cartItems,
        totalCost: totalCost,
        timestamp: new Date().toISOString(),
        status: 'In Progress',
        customerName: customerName
    };

    push(ordersInDB, order)
        .then((orderRef) => {
            localStorage.removeItem('cart');
            window.location.href = `checkout.html?orderKey=${orderRef.key}`;
        })
        .catch((error) => {
            console.error('Error saving order data to Firebase:', error);
        });
});