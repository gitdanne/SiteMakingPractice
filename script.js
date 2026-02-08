document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation (Future expansion)

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for sticky header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Smart Header Logic
    let lastScrollTop = 0;
    const header = document.querySelector('.site-header');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down & past header
            header.classList.add('header-hidden');
        } else {
            // Scrolling up
            header.classList.remove('header-hidden');
        }
        lastScrollTop = scrollTop;
    });

    // Cart Functionality
    const cartBtn = document.querySelector('.cart-btn');
    const cartCount = document.querySelector('.cart-count');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    let cart = [];

    // Load cart from local storage if available
    const savedCart = localStorage.getItem('ecoManureCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.target;
            const product = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price)
            };

            addToCart(product);
            animateButton(btn);
        });
    });

    function addToCart(product) {
        cart.push(product);
        localStorage.setItem('ecoManureCart', JSON.stringify(cart));
        updateCartCount();

        // Optional: Show a toast notification
        console.log(`Added ${product.name} to cart`);
    }

    function updateCartCount() {
        cartCount.textContent = cart.length;

        // Animate the cart icon
        cartBtn.classList.add('bump');
        setTimeout(() => {
            cartBtn.classList.remove('bump');
        }, 300);
    }

    function animateButton(button) {
        const originalText = button.textContent;
        button.textContent = 'Added!';
        button.classList.add('added');
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('added');
            button.disabled = false;
        }, 1500);
    }

    // Cart Modal Logic
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping');

    cartBtn.addEventListener('click', () => {
        renderCartItems();
        cartModal.classList.add('show');
        cartModal.style.display = "block";
    });

    function closeCartFunc() {
        cartModal.classList.remove('show');
        setTimeout(() => {
            cartModal.style.display = "none";
        }, 300);
    }

    if (closeCart) closeCart.addEventListener('click', closeCartFunc);
    if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', closeCartFunc);

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartFunc();
        }
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
            cartTotalPrice.textContent = '$0.00';
            return;
        }

        const counts = {};
        cart.forEach(item => {
            if (!counts[item.id]) {
                counts[item.id] = { ...item, qty: 0 };
            }
            counts[item.id].qty += 1;
        });

        Object.values(counts).forEach(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;

            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-actions" style="display: flex; align-items: center; gap: 10px;">
                     <div class="qty-controls" style="display: flex; align-items: center; border: 1px solid #eee; border-radius: 4px;">
                        <button class="btn-qty" onclick="changeCartQty('${item.id}', -1)" style="padding: 2px 8px; background: none; border: none; cursor: pointer;">-</button>
                        <input type="number" value="${item.qty}" min="1" onchange="updateCartQty('${item.id}', this.value)" style="width: 40px; text-align: center; border: none; -moz-appearance: textfield; padding: 2px;">
                        <button class="btn-qty" onclick="changeCartQty('${item.id}', 1)" style="padding: 2px 8px; background: none; border: none; cursor: pointer;">+</button>
                     </div>
                     <span style="font-weight: 700; width: 60px; text-align: right;">$${itemTotal.toFixed(2)}</span>
                     <span class="cart-item-remove" onclick="removeFromCart('${item.id}')" style="color: #e57373; cursor: pointer; margin-left: 5px;">&times;</span>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    // Expose these to global scope for onclick handlers
    window.removeFromCart = function (id) {
        // Remove ALL instances of this ID
        cart = cart.filter(item => item.id !== id);
        saveCart();
    };

    window.updateCartQty = function (id, newQty) {
        newQty = parseInt(newQty);
        if (isNaN(newQty) || newQty < 1) {
            renderCartItems(); // Revert to valid state
            return;
        }

        // Get single item reference
        const itemTemplate = cart.find(i => i.id === id);
        if (!itemTemplate) return;

        // Remove old entries
        cart = cart.filter(i => i.id !== id);

        // Add new entries matches quantity
        for (let i = 0; i < newQty; i++) {
            cart.push({ ...itemTemplate });
        }

        saveCart();
    };

    window.changeCartQty = function (id, change) {
        if (change === 1) {
            // Find one instance to clone
            const item = cart.find(i => i.id === id);
            if (item) {
                cart.push({ ...item });
            }
        } else if (change === -1) {
            // Find index of one instance
            const index = cart.findIndex(i => i.id === id);
            if (index > -1) {
                cart.splice(index, 1);
            }
        }
        saveCart();
    };

    function saveCart() {
        localStorage.setItem('ecoManureCart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }

    // Modal Logic
    const modal = document.getElementById('product-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');
    const modalAddToCart = document.getElementById('modal-add-to-cart');

    // Product Data (Mock Database)
    const productData = {
        '1': {
            desc: "Aged cow manure is the gold standard for organic gardening. It provides a balanced blend of nitrogen, phosphorus, and potassium, making it perfect for vegetables, herbs, and annuals.",
            npk: "0.5-0.5-0.5",
            size: "40 lbs"
        },
        '2': {
            desc: "Bat guano is a fast-acting, high-phosphorus fertilizer. It promotes vigorous root growth and spectacular blooming in flowers and fruits.",
            npk: "0-10-0",
            size: "2 lbs"
        },
        '3': {
            desc: "Our pelletized chicken manure is a potent source of nitrogen and calcium. It's excellent for leafy greens and heavy feeders like corn and tomatoes.",
            npk: "4-2.5-2.3",
            size: "25 lbs"
        },
        '4': {
            desc: "Composted horse manure adds valuable organic matter to the soil, improving structure and drainage while providing a gentle nutrient boost.",
            npk: "0.7-0.3-0.6",
            size: "30 lbs"
        },
        '5': {
            desc: "Sheep manure is a 'hot' manure that is composted to perfection. It is rich in potash, making it an excellent choice for root crops like carrots, beets, and potatoes.",
            npk: "0.7-0.3-0.9",
            size: "25 lbs"
        },
        '6': {
            desc: "Worm castings are nature's perfect plant food. They are teeming with beneficial microbes and water-soluble nutrients that are immediately available to plants. Odorless and impossible to burn plants with.",
            npk: "1-0-0",
            size: "15 lbs"
        },
        '7': {
            desc: "Rabbit manure is a rare 'cold' manure, meaning it can be applied directly to the garden without composting. It's packed with nutrients and trace minerals.",
            npk: "2.4-1.4-0.6",
            size: "10 lbs"
        },
        '8': {
            desc: "Alpaca manure, or 'beans', is a fantastic soil amendment. It improves soil aeration and water retention while providing a steady supply of nitrogen. Very low odor.",
            npk: "1.5-0.2-1.1",
            size: "20 lbs"
        }
    };

    // Open Modal
    document.querySelectorAll('.product-image').forEach(imgContainer => {
        imgContainer.addEventListener('click', (e) => {
            const card = imgContainer.closest('.product-card');
            const btn = card.querySelector('.add-to-cart');
            const id = btn.dataset.id;
            const data = productData[id];

            modalImg.src = card.querySelector('img').src;
            modalTitle.textContent = btn.dataset.name;
            modalPrice.textContent = `$${btn.dataset.price}`;
            modalDesc.textContent = data.desc;
            document.getElementById('modal-npk').textContent = `NPK: ${data.npk}`;
            document.getElementById('modal-size').textContent = `Size: ${data.size}`;

            // Reset Quantity
            const qtyInput = document.getElementById('modal-quantity');
            if (qtyInput) qtyInput.value = 1;

            // Setup Modal Add to Cart
            modalAddToCart.onclick = () => {
                const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

                const product = {
                    id: id,
                    name: btn.dataset.name,
                    price: parseFloat(btn.dataset.price)
                };

                // Add multiple times
                for (let i = 0; i < qty; i++) {
                    addToCart(product);
                }

                const originalText = modalAddToCart.textContent;
                modalAddToCart.textContent = 'Added!';
                modalAddToCart.disabled = true;
                setTimeout(() => {
                    modalAddToCart.textContent = originalText;
                    modalAddToCart.disabled = false;
                    closeModalFunc();
                }, 1000);
            };

            modal.style.display = "block";
            // Trigger reflow
            void modal.offsetWidth;
            modal.classList.add('show');
        });

        // Add pointer cursor to images
        imgContainer.style.cursor = "pointer";
    });

    // Close Modal
    function closeModalFunc() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    }

    closeModal.addEventListener('click', closeModalFunc);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalFunc();
        }
    });

    // Auth State Integration
    function updateHeaderAuth() {
        const user = db.getCurrentUser();
        const nav = document.querySelector('.main-nav ul');

        // Remove existing auth links if any
        const existingAuth = nav.querySelectorAll('.auth-link');
        existingAuth.forEach(el => el.remove());

        if (user) {
            // Logged In
            const balLi = document.createElement('li');
            balLi.className = 'auth-link';
            balLi.innerHTML = `<a href="profile.html" style="color:var(--primary-color); font-weight:700;"><i class="fa-solid fa-wallet"></i> $${user.balance.toFixed(2)}</a>`;

            const profileLi = document.createElement('li');
            profileLi.className = 'auth-link';
            profileLi.innerHTML = `<a href="profile.html">Profile</a>`;

            nav.appendChild(balLi);
            nav.appendChild(profileLi);
        } else {
            // Logged Out
            const loginLi = document.createElement('li');
            loginLi.className = 'auth-link';
            loginLi.innerHTML = `<a href="login.html">Login</a>`;

            nav.appendChild(loginLi);
        }
    }

    // Initial check
    updateHeaderAuth();
});
