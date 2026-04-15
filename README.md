# QuickBite

## Description
QuickBite is a campus-focused food pre-order and queue-skipping web application. The project is designed to help students browse meals, discover popular vendors, place orders ahead of time, and reduce waiting during busy canteen hours.

The current repository includes:

- A frontend landing page built with HTML, CSS, and vanilla JavaScript
- A backend starter built with Node.js, Express, and MySQL
- Database schema and setup documentation for local development

QuickBite is aimed at creating a smoother food ordering experience for university environments such as the NSU campus canteen.

See [docs/project-tree.md](docs/project-tree.md) for the project structure.

## Features
- Modern campus food ordering landing page
- Vendor showcase and trending menu sections
- Interactive frontend behavior with search, notifications, and local cart storage
- Express backend starter with environment-based configuration
- MySQL database connection setup for local development

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Development tools: Nodemon, dotenv

## How to run
### 1. Clone the repository
```bash
git clone https://github.com/steller-nafees/QuickBite
```

### 2. Configure environment variables
Create a `.env` file in the project root by copying values from `.env.example`.

Example:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=quickbite
DB_USER=root
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
SIMULATED_PAYMENT_API_KEY=your_payment_key
```

### 3. Set up the database
- Start MySQL using XAMPP or your local MySQL server
- Create a database named `quickbite_db`
- Import or review the schema in `database/schema.sql`

Detailed backend setup is available in:
- [docs/Backend-Setup.md](docs/Backend-Setup.md)
- [docs/env-file-setup.md](docs/env-file-setup.md)

### 4. Install backend dependencies
```bash
cd server
npm install
```

### 5. Run the backend server
For development:

```bash
npm run dev
```

For normal start:

```bash
npm start
```

The backend will run at:

```text
http://localhost:5000
```

### 6. Open the frontend
The frontend currently uses a static entry file:

```text
client/public/index.html
```

You can open that file directly in a browser, or serve the `client/public` folder with a simple local server if you prefer.

## Project Status
QuickBite is currently in an early development stage. The frontend already presents a polished landing experience, while the backend and database structure provide a starting point for building real authentication, ordering, payment, and vendor workflows.

## Contributing
Feel free to fork this repo and submit a pull request.
