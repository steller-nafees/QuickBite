# 🍔 QuickBite Frontend Script Documentation

## 📌 Overview

This JavaScript file powers the interactive behavior of the **QuickBite landing page**. It handles UI rendering, user interactions, animations, and cart management using browser local storage.

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
* Vendors and food items are rendered
* Animations are initialized
* Cart count is updated from storage

---

## 🧭 Navigation System

### `initializeNavigation()`

Handles:

* Mobile menu toggle
* Closing menu on outside click
* Smooth scrolling for anchor links

---

## 🔍 Search Functionality

### `initializeSearch()`

* Listens to search form submission
* Prevents default reload
* Displays a notification
* Logs search term in console

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

---

## ⚠️ Notes & Best Practices

* Uses **vanilla JavaScript** (no frameworks)
* UI is dynamically generated using template literals
* Event delegation is used for better performance
* Local storage ensures cart persistence

---

## ✅ Summary

This script:

* Renders vendors and trending food items
* Handles navigation and search
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