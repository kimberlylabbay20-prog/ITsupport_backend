# ITSupport

Backend API for an IT support ticketing system, built with FastAPI, PostgreSQL, and MongoDB.

---

## Purpose

ITSupport lets organisations track IT support requests from submission to resolution. Users submit tickets describing their issues; staff work on assigned tickets and add internal work notes; administrators manage users, categories, and monitor overall system activity through a dashboard and reports.

---

## Main Users / Roles

| Role | Description |
|------|-------------|
| **Regular User** | Registers, logs in, creates support tickets, and views only their own tickets. |
| **Staff** | Receives assigned tickets, updates status, and adds work notes visible to the team. |
| **Admin** | Full access: manages users, categories, assigns tickets, views dashboard and reports, and sees all tickets in the system. |

Admin accounts are created directly in the database and cannot be registered through the public `/auth/register` endpoint.

---

## Main Ticket Workflow

1. **User** creates a ticket (status: `OPEN`).
2. **Admin** assigns the ticket to a staff member.
3. **Staff** changes status to `IN_PROGRESS` and adds work notes.
4. **Staff** marks the ticket as `RESOLVED` when the issue is fixed.
5. **Admin** may also resolve tickets directly or update priority.

Available statuses: `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

Available priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework and automatic OpenAPI docs at `/docs` |
| **PostgreSQL** | Primary relational database (users, tickets, categories) |
| **MongoDB** | Activity logs and ticket work notes |
| **SQLAlchemy** | ORM for PostgreSQL access |
| **PyMongo** | MongoDB access |
| **JWT** | Stateless token-based authentication via python-jose |
| **Pydantic** | Request/response validation and serialisation |
| **bcrypt** | Password hashing |

---

## Why PostgreSQL?

PostgreSQL is used for the structured, relational data: users, categories, and tickets. These entities have clear relationships (a ticket belongs to a user, references a category, and is optionally assigned to staff). PostgreSQL provides ACID transactions, referential integrity via foreign keys, and strong data consistency — all important when a support ticket must reliably link to a valid user and category.

---

## Why MongoDB?

MongoDB is used for the flexible, append-only data: activity logs and ticket work notes. Activity records vary in shape depending on the action type (ticket creation, assignment, status change, priority change, etc.) and do not require joins or transactions with other tables. MongoDB's schema-flexible document model is a natural fit for this kind of audit trail, and it keeps high-volume log writes out of the relational database.

---

## MVC Architecture

The project follows a layered architecture inspired by MVC:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Models** | `models/` | SQLAlchemy ORM model definitions |
| **Schemas** | `schemas/` | Pydantic request/response schemas |
| **Controllers** | `controllers/` | HTTP route handlers (the "views/controllers") |
| **Services** | `services/` | Business logic layer |
| **Database** | `database/` | Engine, session, and MongoDB connection setup |

The request flow is: `Controller → Service → Database`.

---

## Project Folder Structure

```
ITSupport/
├── controllers/
│   ├── admin_controller.py      # Admin ticket management, dashboard, reports
│   ├── auth_controller.py       # Register, login, /me
│   ├── category_controller.py   # Category CRUD
│   ├── staff_controller.py      # Staff ticket queue
│   ├── ticket_controller.py     # User ticket operations
│   └── user_controller.py       # Admin user management
├── models/
│   ├── category.py              # Category ORM model
│   ├── ticket.py                # Ticket ORM model
│   └── user.py                  # User ORM model
├── schemas/
│   ├── auth_schema.py           # Register/login request/response
│   ├── category_schema.py       # Category request/response
│   ├── dashboard_schema.py      # Dashboard statistics
│   ├── report_schema.py         # Admin report
│   ├── ticket_schema.py         # Ticket request/response
│   └── user_schema.py           # User request/response
├── services/
│   ├── auth_service.py          # Password hashing, JWT, FastAPI dependencies
│   ├── category_service.py      # Category business logic
│   ├── dashboard_service.py     # Dashboard aggregate queries
│   ├── mongo_service.py         # MongoDB activity log and note helpers
│   ├── report_service.py        # Report aggregate queries
│   ├── ticket_service.py        # Ticket status/assignment/notes logic
│   └── user_service.py          # User update/delete logic
├── database/
│   ├── base.py                  # SQLAlchemy declarative base + utcnow()
│   ├── mongodb.py               # MongoDB client and db reference
│   └── postgres.py              # PostgreSQL engine and get_db dependency
├── config.py                    # Environment variable loader (no defaults)
├── main.py                      # FastAPI app, exception handlers, routers
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
└── .gitignore                   # Ignores .env, __pycache__, .venv, IDE files
```

---

## Environment Variable Setup

Copy `.env.example` to `.env` and fill in your real values:

```bash
cp .env.example .env
```

**Required variables (all must be set, no defaults exist):**

```
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_HOST=...
POSTGRES_PORT=...
POSTGRES_DB=...

MONGO_URI=mongodb://localhost:27017
MONGO_DB=itsupport

JWT_SECRET=<long random string>
```

`JWT_SECRET` must be a long, random string (e.g. 64+ characters). Never commit `.env` to version control.

---

## How to Install Dependencies

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

---

## How to Run the FastAPI Server

```bash
uvicorn main:app --reload
```

The server starts at `http://127.0.0.1:8000`.

---

## How to Open /docs

After starting the server, open:

```
http://127.0.0.1:8000/docs
```

This loads the Swagger UI where all routes can be tested interactively. Protected routes require a Bearer token — click **Authorize**, paste a valid JWT, and then test the endpoints.

---

## Route Summary

### Authentication (public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, receive JWT |
| GET | `/auth/me` | View current user |

### Tickets (authenticated)
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/tickets` | any | Create a ticket |
| GET | `/tickets` | role-scoped | List tickets (user=own, staff=assigned, admin=all) |
| GET | `/tickets/my` | any | List own created tickets |
| GET | `/tickets/status/{status}` | role-scoped | Filter by status |
| GET | `/tickets/{id}` | role-scoped | View a ticket |
| PUT | `/tickets/{id}` | role-scoped | Update a ticket |
| DELETE | `/tickets/{id}` | role-scoped | Delete a ticket |

### Categories
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/categories` | any | List all categories |
| GET | `/categories/{id}` | any | View a category |
| POST | `/categories` | admin | Create a category |
| PUT | `/categories/{id}` | admin | Update a category |
| DELETE | `/categories/{id}` | admin | Delete a category |

### Users (admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| GET | `/users/{id}` | View a user |
| PUT | `/users/{id}` | Update a user (role, password, etc.) |
| DELETE | `/users/{id}` | Delete a user |

### Admin (admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Aggregate ticket statistics |
| GET | `/admin/reports` | Grouped system-wide reports |
| GET | `/admin/tickets` | List all tickets |
| GET | `/admin/tickets/{id}` | View any ticket |
| PUT | `/admin/tickets/{id}/status` | Update ticket status |
| PUT | `/admin/tickets/{id}/priority` | Update ticket priority |
| PUT | `/admin/tickets/{id}/assign` | Assign ticket to staff |
| PUT | `/admin/tickets/{id}/resolve` | Resolve a ticket |
| POST | `/admin/tickets/{id}/notes` | Add an admin note |

### Staff (staff and admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/staff/tickets` | View assigned tickets |
| GET | `/staff/tickets/{id}` | View an assigned ticket |
| PATCH | `/staff/tickets/{id}/status` | Update status |
| PATCH | `/staff/tickets/{id}/priority` | Update priority |
| POST | `/staff/tickets/{id}/notes` | Add a work note |

**Total: 33 API routes**

---

## Security Notes

- **Passwords** are hashed with bcrypt before storage. Password hashes are never returned in any API response.
- **JWT tokens** use HS256 with a secret stored in the `JWT_SECRET` environment variable. Tokens expire after 30 minutes.
- **Role-based access control** is enforced on every protected route via FastAPI dependencies (`require_admin`, `require_staff`, `get_current_user`).
- **Users cannot self-promote** — the registration endpoint always creates a `user` role. Role changes require admin privileges.
- **Users cannot view or modify other users' tickets** — ticket access is scoped by role.
- **Admin self-demotion is blocked** — an admin cannot remove their own admin role.
- **Last admin protection** — the final admin account cannot be deleted.
- **Database errors** are caught by global exception handlers and returned as generic messages. Internal details are never exposed to the client.
- **`.env` is gitignored** — only `.env.example` with placeholder values is committed.

---

## GitHub Setup Instructions

```bash
# Navigate into the project
cd ITSupport

# Initialise git (if not already a repo)
git init

# Verify .env is ignored
git check-ignore .env          # should print: .env

# Add all files
git add .

# Confirm nothing sensitive is staged
git status

# Create the initial commit
git commit -m "Initial commit - ITSupport FastAPI backend"

# Add your GitHub remote
git remote add origin https://github.com/<your-username>/<your-repo>.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Before pushing, verify:**
- `.env` is in `.gitignore` and not tracked
- `.env.example` contains only placeholder values
- No real passwords, JWT secrets, or database URIs appear anywhere in the codebase
