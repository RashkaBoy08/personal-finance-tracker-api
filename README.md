# Personal Finance Tracker API

A JavaScript, Express, and MongoDB API for managing personal income and expenses. It includes JWT authentication, bcrypt password hashing, monthly summaries, profile-picture uploads to Cloudinary, admin statistics, request validation, rate limiting, and Swagger UI.

## Requirements

- Node.js 20.19+ (required by the current Mongoose version)
- MongoDB 6+ or a MongoDB Atlas cluster
- Cloudinary credentials for profile-picture uploads

## Local setup

1. Start MongoDB locally or create a MongoDB Atlas cluster, then copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your MongoDB connection string and set a `JWT_SECRET` containing at least 32 characters.
3. Optionally set all three Cloudinary variables to enable image uploads.
4. Install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

The API connects to MongoDB and seeds predefined categories on startup. It is available at `http://localhost:3000`; Swagger UI is at `/docs` and the health check is at `/health`.

## API

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/profile` | Authenticated |
| GET | `/categories` | Authenticated |
| POST | `/transactions` | Authenticated |
| GET | `/transactions` | Authenticated |
| GET | `/transactions/monthly-summary?year=2025&month=5` | Authenticated |
| PUT | `/transactions/:id` | Authenticated, own transactions only |
| DELETE | `/transactions/:id` | Authenticated, own transactions only |
| POST | `/upload/profile-picture` | Authenticated |
| GET | `/admin/overview` | Admin |

Send JWTs as `Authorization: Bearer <token>`. Income amounts must be positive and expense amounts negative, for example `-50` for an expense. The monthly summary defaults to the current UTC month; provide both `year` and `month` to query a different month.

Transactions are paginated (`page`, default 1; `limit`, default 20 and maximum 100) and can be filtered by `type`, `category`, `from`, and `to`. Categories are predefined; transaction category labels are also accepted as text, so custom labels can be used without creating a category first.

To create the initial admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server. The account is created only when that email does not already exist. Registration never accepts a role, and public users cannot promote themselves.

## Scripts

- `npm run dev` — run the JavaScript server with Node watch mode
- `npm start` — start the API

## Render deployment

Create a Render Web Service using the Node runtime, build command `npm install`, and start command `npm start`. Create a MongoDB Atlas cluster and set `MONGODB_URI` to its connection string, with the appropriate database name and credentials. Configure `JWT_SECRET`, `CORS_ORIGINS`, and the Cloudinary credentials in the Render dashboard. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if an initial administrator is needed. Set `PUBLIC_API_URL` to the deployed service's HTTPS URL to show it as the Swagger server. The service binds to Render's `PORT` environment variable, and Swagger is served from `/docs`.

The OpenAPI document uses a relative server URL by default; set `PUBLIC_API_URL` to display the deployed URL in Swagger.
