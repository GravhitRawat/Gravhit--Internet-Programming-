# SpendWise — Expense Tracker (v2)

## Problem Summary

Managing personal finances is hard without visibility into where money goes. SpendWise is a single-page expense tracker that lets users register, log in, and manage their spending with full CRUD operations. Admins can manage user accounts and monitor all user activity. The app supports category filtering, live search, and visual dashboards — all from one streamlined interface.

## Tech Stack

| Layer        | Technology                                   |
|-------------|----------------------------------------------|
| Frontend    | React 18 (via CDN), HTML5, CSS3              |
| Styling     | Custom CSS with CSS variables                |
| Backend     | Node.js, Express.js                          |
| Database    | SQLite (via better-sqlite3)                  |
| Auth        | JWT (jsonwebtoken) + bcryptjs password hashing |
| Fonts       | Nunito, Source Code Pro (Google Fonts)        |

> SQLite is a fully SQL-compliant relational database. It stores data in a single file (`spendwise.db`) — no separate database server required.

## Features

- **User authentication** — Register and login with hashed passwords and JWT tokens
- **Role-based access** — Regular users manage their own expenses; admins access the admin panel
- **Full CRUD on 3 entities** — Users, Expenses, and User Activities
- **Live search** — Filter expenses in real-time by title, description, or category
- **Category filtering** — Server-side filtering by expense category
- **Dashboard** — Category breakdown with bar chart and monthly spending trend
- **Admin panel** — View/edit/delete all users and browse the full activity log
- **Activity logging** — Every login, registration, and CRUD action is recorded automatically
- **Modal forms** — Add/edit expenses and users without leaving the page
- **Toast notifications** — Subtle feedback for all actions
- **Responsive design** — Works on desktop and mobile
- **Single-page app** — One `index.html` file, React dynamically updates the page

## Three Entities with CRUD

| Entity          | Create       | Read                  | Update        | Delete        |
|-----------------|-------------|----------------------|---------------|---------------|
| **Users**       | Register    | Admin: list all users | Admin: edit   | Admin: remove |
| **Expenses**    | Add expense | List + search + filter | Edit expense  | Remove expense |
| **Activities**  | Auto-logged | Admin: view log       | —             | —             |

## Folder Structure

```
expense-tracker-v2/
├── server.js              # Express server entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (PORT, JWT_SECRET)
├── .gitignore
├── middleware/
│   └── auth.js            # JWT verification + admin-only middleware
├── routes/
│   ├── auth.js            # POST /register, POST /login, GET /me
│   ├── expenses.js        # GET, POST, PUT, DELETE /api/expenses
│   └── admin.js           # GET/PUT/DELETE users, GET activities (admin only)
├── database/
│   ├── schema.sql         # SQL table definitions (users, expenses, user_activities)
│   └── init.js            # Creates tables and seeds sample data
├── public/
│   └── index.html         # Single-page React frontend (SPA)
└── README.md
```

## Setup & Running

1. **Prerequisites**: Node.js (v16+) installed.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialise the database** (creates tables + sample data):
   ```bash
   npm run init-db
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open** `http://localhost:3000` in your browser.

6. **Demo accounts**:
   - Admin: `admin@test.com` / `admin123`
   - User: `jane@test.com` / `jane123`
   - User: `tom@test.com` / `tom123`

## API Endpoints

### Auth
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| POST   | `/api/auth/register`| Create a new account     |
| POST   | `/api/auth/login`   | Login and receive JWT    |
| GET    | `/api/auth/me`      | Get current user info    |

### Expenses (requires auth)
| Method | Endpoint              | Description                       |
|--------|-----------------------|-----------------------------------|
| GET    | `/api/expenses`       | List expenses (filter, search)    |
| GET    | `/api/expenses/summary`| Category + monthly aggregations  |
| POST   | `/api/expenses`       | Create a new expense              |
| PUT    | `/api/expenses/:id`   | Update an expense                 |
| DELETE | `/api/expenses/:id`   | Delete an expense                 |

### Admin (requires auth + admin role)
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/admin/users`    | List all users           |
| PUT    | `/api/admin/users/:id`| Update a user            |
| DELETE | `/api/admin/users/:id`| Delete a user + data     |
| GET    | `/api/admin/activities`| View activity log       |

## Challenges Overcome

Implementing JWT-based authentication across a CDN-loaded React frontend required managing tokens in `sessionStorage` and attaching them to every API request via an Authorization header — without the convenience of a build tool or state management library. The SQLite schema needed careful use of foreign keys with `ON DELETE CASCADE` to ensure deleting a user also removes their expenses and activity records. Building the admin panel within the same SPA meant designing role-based conditional rendering: the admin nav tab and routes only appear when the logged-in user has the admin role, with server-side middleware as the real security layer. Activity logging was implemented as automatic inserts inside each route handler rather than as middleware, giving more control over what details are captured for each action type.
