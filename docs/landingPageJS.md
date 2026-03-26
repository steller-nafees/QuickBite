# 🍔 QuickBite Frontend Script Documentation

## 📌 Overview

This JavaScript file powers the interactive behavior of the **QuickBite landing page**. It handles UI rendering, responsive navigation, the active order pill, user interactions, animations, and cart management using browser local storage.

---

## 🧩 Data Structures

### 1. Vendors (`vendors` array)

Contains a list of food vendors displayed on the homepage.

**Fields:**

* `id`: Unique identifier
* `name`: Vendor name
* `cuisine`: Type of food
* `rating`: User rating
* `totalOrders`: Number of orders
* `eta`: Estimated pickup time
* `badge`: Highlight tag
* `image`: Vendor image URL

---

### 2. Menu Items (`menuItems` array)

Represents trending food items shown in the UI.

**Fields:**

* `id`: Unique identifier
* `name`: Item name
* `vendor`: Vendor name
* `price`: Price of item
* `rating`: Item rating
* `delivery`: Preparation time
* `category`: Item category
* `badge`: Ranking badge
* `description`: Short description
* `image`: Item image URL

---

## 🚀 Initialization Flow

When the DOM loads:

```js
document.addEventListener("DOMContentLoaded", function () {
    initializeNavigation();
    initializeSearch();
    renderVendors();
    renderTrendingItems();
    initializeAnimations();
    updateCartCount();
});
```

### What happens:

* Navigation menu is activated
* Search functionality is enabled
* Order pill scroll state and click behavior are activated
* Vendors and food items are rendered
* Animations are initialized
* Cart count is updated from storage

---

## 🧭 Navigation System

### `initializeNavigation()`

Handles:

* Mobile menu toggle
* Tablet hamburger menu toggle
* Closing menu on outside click
* Smooth scrolling for anchor links

**Current behavior:**

* The same hamburger navigation is used for mobile and tablet breakpoints
* Opening the menu adds the `active` class to `#navMenu`
* CSS handles the dropdown slide/fade animation

---

## 🔍 Search Functionality

### `initializeSearch()`

* Listens to search form submission
* Prevents default reload
* Displays a notification
* Logs search term in console

---

## 📦 Order Pill System

The landing page now includes an order status pill that can be expanded by the user and repositioned when the page is scrolled.

### DOM References

The script reads these elements:

* `#orderShell`: outer wrapper used for positioning
* `#orderPill`: clickable pill container
* `#timeLeft`: countdown text inside the pill

### `syncOrderPillState()`

Controls the scroll-based positioning of the order pill.

**Current behavior:**

* Checks `window.scrollY`
* When the scroll passes the configured threshold, toggles the `is-docked` class on `#orderShell`
* Only changes pill position
* Does **not** auto-expand or auto-collapse the pill

This keeps the pill interaction logic the same before and after scroll.

### Pill click behavior

Inside the initialization block:

* Clicking the pill toggles the `expanded` class on `#orderPill`
* Updates the `aria-expanded` attribute for accessibility

### Countdown behavior

The order pill includes a simple front-end countdown:

* Starts from `10` minutes
* Updates every `60000` ms
* Shows:
  * `X mins left` while time remains
  * `Ready now` when it reaches zero

This countdown is currently demo/UI-only and is not connected to backend order data.

---

## 🏪 Vendor Rendering

### `renderVendors()`

* Sorts vendors by `totalOrders`
* Selects top 4 vendors
* Dynamically generates HTML cards
* Adds click listeners for interaction

**User Interaction:**

* Clicking a vendor → shows notification + logs vendor data

---

## 🍟 Trending Items Rendering

### `renderTrendingItems()`

* Dynamically renders food items
* Displays:

  * Name, price, description
  * Rating and vendor
* Adds "Add to Cart" functionality

**User Interaction:**

* Click item → preview notification
* Click "Add" → adds item to cart

---

## 🛒 Cart System

### `addToCart(item)`

* Retrieves cart from `localStorage`
* If item exists → increases quantity
* Else → adds new item
* Saves updated cart
* Updates cart count

---

### `updateCartCount()`

* Calculates total items in cart
* Updates `.cart-icon` UI using `data-count`

---

## 🔔 Notification System

### `showNotification(message)`

* Creates a temporary notification element
* Animates it into view
* Automatically removes after 2.5 seconds

---

## 🎬 Animations

### `initializeAnimations()`

* Uses `IntersectionObserver`
* Triggers animation when elements enter viewport

---

## 📜 Global Event Listeners

### Scroll Effect

* Adds shadow to navbar when scrolling
* Updates order pill position on scroll through `syncOrderPillState()`

### Category Click

* Shows notification when category is clicked

### Footer Links

* Displays "not connected" message

### CTA Buttons

* Primary → onboarding flow
* Secondary → scroll to vendors section

---

## 💰 Currency Formatter

### `formatCurrency(amount)`

Formats numbers into **BDT currency** using `Intl.NumberFormat`

---

## 🧠 Storage Used

### `localStorage`

Key: `quickbite-cart`

Stores:

```json
[
  {
    "id": 1,
    "name": "Classic Burger",
    "price": 5.49,
    "quantity": 2
  }
]
```

The current order pill countdown/status is not persisted in storage.

---

## ⚠️ Notes & Best Practices

* Uses **vanilla JavaScript** (no frameworks)
* UI is dynamically generated using template literals
* Uses a mix of direct event listeners and document-level listeners
* Local storage ensures cart persistence
* Responsive navigation behavior is shared across mobile and tablet layouts
* Order pill scroll docking is controlled by CSS classes instead of inline styles

---

## ✅ Summary

This script:

* Renders vendors and trending food items
* Handles responsive navigation and search
* Controls the order pill toggle, countdown, and scroll docking
* Manages cart functionality
* Provides smooth UI interactions and animations

It acts as the **core frontend logic** for the QuickBite landing page.

---

## 💡 Future Improvements

* Connect search to backend API
* Add real cart page
* Implement authentication system
* Replace static data with database
* Add filtering and sorting

---
