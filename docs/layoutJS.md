# QuickBite Shared Layout Script Documentation

## Overview

This file documents [layout.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/shared/layout.js), the shared frontend script used to make the QuickBite header, footer, and order pill global across multiple pages.

The goal of this script is to avoid repeating the same layout markup in every HTML file. Instead of copying the home page navigation and footer into each page manually, pages now provide mount points and `layout.js` injects the shared UI automatically.

---

## Purpose

`layout.js` is responsible for:

* Rendering the shared navbar
* Rendering the shared order pill
* Rendering the shared footer
* Updating the global cart count badge
* Handling shared navigation behavior on non-home pages
* Handling shared order pill behavior on non-home pages

---

## Required HTML Mount Points

Any page that wants to use the shared layout should include these placeholders:

```html
<div id="globalHeader"></div>
<div id="globalOrderPill"></div>
<div id="globalFooter"></div>
```

The page should also load the script before its page-specific JavaScript:

```html
<script src="../src/js/shared/layout.js"></script>
```

---

## Page Detection

The script checks `document.body.dataset.page` to understand which page is currently active.

Examples:

```html
<body data-page="home">
```

```html
<body data-page="vendor">
```

This is used to decide:

* Whether links should stay as local `#section` anchors
* Whether links should point back to `index.html#section`
* Whether shared navigation and order pill behavior should be initialized outside the home page

---

## Functions

### `getHomeLink(path)`

Builds the correct navigation link depending on the current page.

**Behavior:**

* On the home page, returns the plain hash link such as `#discover`
* On other pages, returns `index.html#discover`

This keeps home-page smooth scrolling working while still allowing inner pages to jump back to the home page sections.

---

### `getGlobalHeaderMarkup()`

Returns the shared navbar HTML as a template string.

**Includes:**

* Brand/logo area
* Location label
* Shared nav links
* Mobile nav toggle button

The section links use `getHomeLink()` so the same markup works on multiple pages.

---

### `getGlobalOrderPillMarkup()`

Returns the shared order pill HTML.

**Includes:**

* Status text
* Token number
* Remaining time
* Expand/collapse chevron
* Order details section

This is currently a UI/demo element and is not connected to backend order data.

---

### `getGlobalFooterMarkup()`

Returns the shared footer HTML.

**Includes:**

* Footer brand section
* Platform links
* Support links
* Built For links
* Footer bottom copyright text

Like the header, home-section links are generated through `getHomeLink()`.

---

### `updateGlobalCartCount()`

Reads cart data from `localStorage` and updates every `.cart-icon` element with the latest count.

**Storage key used:**

* `quickbite-cart`

**Behavior:**

* Reads cart items from browser storage
* Sums all item quantities
* Writes the total into the `data-count` attribute of every `.cart-icon`

This allows all pages to show the same cart count if they include cart badge elements.

---

### `renderGlobalLayout()`

Finds the global mount points in the current page and injects shared HTML into them.

**Mount targets:**

* `#globalHeader`
* `#globalOrderPill`
* `#globalFooter`

After rendering, it also calls `updateGlobalCartCount()`.

---

### `initializeSharedNavigation()`

Adds common navbar interaction for pages outside the home page.

**Handles:**

* Mobile menu toggle
* Closing the menu when clicking outside
* Navbar shadow on scroll

This is only run on non-home pages because the home page already has its own navigation logic inside `Landing.js`.

---

### `initializeSharedOrderPill()`

Adds interaction to the shared order pill on non-home pages.

**Handles:**

* Docking the order pill when the page is scrolled
* Expanding/collapsing the pill on click
* Countdown from `10 mins`
* Switching status to `Ready for pickup` when the timer reaches zero

This behavior mirrors the demo behavior used on the landing page.

---

## Initialization Flow

At the bottom of the file:

```js
renderGlobalLayout();

if (document.body.dataset.page !== "home") {
    initializeSharedNavigation();
    initializeSharedOrderPill();
}
```

### What this means:

* Shared layout is always rendered first
* On the home page, only the markup is injected
* On non-home pages, shared navbar and order pill interactions are also activated

This avoids duplicate event logic with `Landing.js`.

---

## Global API

At the end of the script, a small global object is exposed:

```js
window.QuickBiteLayout = {
    renderGlobalLayout: renderGlobalLayout,
    updateCartCount: updateGlobalCartCount
};
```

This allows page-specific scripts to reuse shared layout functions.

### Current use case

`vendor.js` calls:

* `window.QuickBiteLayout.updateCartCount()`

This keeps the shared cart badge updated after adding products from the vendor page.

---

## Example Integration

Example page setup:

```html
<body data-page="vendor">
    <div class="page-shell">
        <div id="globalHeader"></div>
        <div id="globalOrderPill"></div>

        <!-- page-specific content -->

        <div id="globalFooter"></div>
    </div>

    <script src="../src/js/shared/layout.js"></script>
    <script src="../src/js/pages/vendor.js"></script>
</body>
```

---

## Notes

* This file uses vanilla JavaScript
* Shared UI is generated using template literals
* Cart state is read from browser local storage
* Layout rendering is centralized in one file
* Pages no longer need to duplicate the home-page shell markup manually

---

## Summary

`layout.js` is the shared layout engine for QuickBite pages. It keeps the header, footer, and order pill consistent across the app, reduces repeated HTML, and provides a small reusable API for page scripts that need to sync shared UI state.
