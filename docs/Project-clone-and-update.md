## Git: Cloning and Pushing the Project Safely

### Clone the Project

1. Open terminal in the folder where you want to clone the project.
2. Run:

   ```bash
   git clone https://github.com/steller-nafees/QuickBite
   cd QuickBite
   ```
3. Verify that `client/`, `server/`, `database/`, and `.env.example` (if provided) exist.

### Set Up Local Environment

1. Copy `.env.example` to `.env` in both `server/` and `client/` (if frontend uses env variables) and update credentials:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env  # if applicable
   ```
2. Install dependencies:

   ```bash
   cd server
   npm install

   cd ../client
   npm install   # if frontend uses npm
   ```

### Push Changes Safely

1. Always **pull latest changes** before pushing:

   ```bash
   git pull origin main
   ```
2. Stage your changes carefully, making sure `.env` and sensitive files are not included:

   ```bash
   git add .
   git reset server/.env client/.env  # Exclude .env if accidentally added
   ```
3. Commit with a clear, descriptive message:

   ```bash
   git commit -m "Add feature XYZ or fix bug ABC"
   ```
4. Push to the remote repository:

   ```bash
   git push origin main
   ```

### Best Practices

* **Never commit `.env` files** or other sensitive data to Git. Add them to `.gitignore`.
* Keep `package.json` and `package-lock.json` tracked for consistent dependencies.
* Always pull before pushing to prevent merge conflicts.
* Use **feature branches** if multiple developers are working on the project.
* Include a `.gitignore` that ignores `node_modules/`, `.env`, and temporary files.

Following this workflow ensures cloning, running, and pushing changes will work safely without breaking the project for others.
