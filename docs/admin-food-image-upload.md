# Admin Food Image Upload

This note explains, in very simple English, how the food image upload works from the admin dashboard.

## What problem this feature solves

Before this change, the admin dashboard only sent the image file name like `burger.jpg`.

That was not enough, because:

- the backend did not receive the real image file
- the backend did not save the image
- the food item always showed a default image later

Now the full image is sent, saved in the backend, and used by that food item.

## Full flow

The flow is:

1. Admin selects an image in the food modal
2. Frontend reads the image as a Data URL
3. Frontend sends that Data URL to the backend
4. Backend converts it into a real image file
5. Backend saves the file in `server/uploads/foods`
6. Backend saves the file path in the `food.image_url` column
7. When foods are loaded later, that saved image path is returned
8. The UI uses that image for the food item

## Frontend part

File: [admin-dashboard.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/admin-dashboard.js:486)

When the user clicks save in the modal, we now read the actual file and send it as `image_data`.

```js
const imageFile = $("fiImage").files && $("fiImage").files[0] ? $("fiImage").files[0] : null;
const image_data = imageFile ? await readFileAsDataUrl(imageFile) : "";

const result = await window.QuickBiteApi.createFood({
  vendor_id,
  name,
  category,
  price,
  is_available,
  description,
  image_data
});
```

This helper converts the selected file into a Data URL:

```js
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read the selected image"));
    reader.readAsDataURL(file);
  });
}
```

### Why use Data URL?

Because a Data URL is just text, so it can be sent inside JSON.

Example:

```txt
data:image/png;base64,iVBORw0KGgoAAA...
```

It contains:

- the image type
- the image data in base64 text form

## Backend part

File: [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:1)

The backend receives `image_data`, checks it, converts it to a file, and saves it.

```js
async function saveFoodImageFromDataUrl(foodId, imageDataUrl) {
  const raw = String(imageDataUrl || "").trim();
  if (!raw) return "";

  const match = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid food image format");
  }

  const buffer = Buffer.from(match[2], "base64");
  await fs.mkdir(uploadsRoot, { recursive: true });

  const fileName = `${String(foodId).replace(/[^\w-]/g, "_")}-${Date.now()}.jpg`;
  await fs.writeFile(path.join(uploadsRoot, fileName), buffer);
  return `/uploads/foods/${fileName}`;
}
```

### What this function does

- checks the incoming image text
- makes sure it is a valid image format
- converts base64 text into binary file data
- creates the upload folder if needed
- writes the image file into the server
- returns the saved file path

## Saving path in database

When a food item is created, the backend stores the image path in the `image_url` column.

```js
const storedImagePath = imageData ? await saveFoodImageFromDataUrl(foodId, imageData) : null;

await pool.query(
  "INSERT INTO food (food_id, item_name, description, image_url, price, is_available, managed_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
  [
    foodId,
    itemName,
    description || null,
    storedImagePath,
    price,
    isAvailable ? 1 : 0,
    vendorId,
  ]
);
```

When a food item is updated, the image path is also updated if a new image is sent.

```js
let storedImagePath = food.image_url || null;
const imageData = String(req.body?.image_data || "").trim();

if (imageData) {
  storedImagePath = await saveFoodImageFromDataUrl(req.params.id, imageData);
}
```

## Auto-creating the database column

This feature checks if the `image_url` column exists. If not, it creates it automatically.

```js
async function ensureFoodImageColumn() {
  const [columns] = await pool.query("SHOW COLUMNS FROM food LIKE 'image_url'");
  if (!columns.length) {
    await pool.query("ALTER TABLE food ADD COLUMN image_url VARCHAR(1024) NULL AFTER description");
  }
}
```

### Why this is helpful

It means you do not always need to manually update the database first.  
The server can add the column the first time this feature runs.

## Serving saved images

File: [server.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/server.js:16)

The server exposes the uploads folder like this:

```js
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
```

That means if the backend saves:

```txt
/uploads/foods/QBF-1001-1714200000000.jpg
```

the browser can open that image URL directly.

## Returning the image to frontend

When foods are loaded, the backend returns the saved image URL instead of an empty string.

```js
image: resolveFoodImage(req, row.image_url || "", "")
```

This helps:

- admin dashboard
- landing page food cards
- vendor page food list
- anywhere else using the same food data

## Simple summary

In one line:

The frontend sends the real image as text, the backend saves it as a file, stores the file path in the database, and sends that path back when the food item is loaded.

## Important files

- [client/src/js/pages/admin-dashboard.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/admin-dashboard.js:486)
- [server/src/routers/appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:1)
- [server/src/server.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/server.js:16)

## Small limitation

Right now, when a new image is uploaded for the same food item, the old image file is not deleted from disk.

The feature still works correctly, but old unused files may stay inside `server/uploads/foods`.
