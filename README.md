# Staybnb — Full-stack Airbnb-inspired capstone...

A responsive Airbnb-style stay-booking application for learning/capstone use. This single project ZIP combines the Express/Mongoose backend and the React/Vite frontend. It includes JWT authentication, optional Google OAuth, property search and management, bookings with date locks, wishlists, verified reviews, local/Cloudinary image uploads, Stripe Checkout integration with a clearly marked development-only simulated payment mode, a dashboard, Indian demo listings, and a Postman collection.

> **Important scope note:** This is a capstone starter, not a production-audited marketplace. Real payments require Stripe test/live credentials and a correctly configured webhook for reliable asynchronous confirmation. Never use development demo payments in production. The default local database is temporary and loses data on server shutdown.

## Stack

- Frontend: React 18, Vite, Tailwind CSS 3, React Router, Context API, Redux Toolkit, React Hook Form + Yup, React DatePicker, Leaflet + React Leaflet, Axios, react-hot-toast.
- Backend: Node.js, Express 5, Mongoose, MongoDB, JWT, bcryptjs, Passport Google OAuth (optional), Multer, Cloudinary SDK, Stripe, express-validator, cookie-parser, helmet, CORS, rate limiting.


## The six parts included in this ZIP

1. **Part 1 — Backend/authentication:** Express server, MongoDB connection, data models, JWT/password auth, optional Google OAuth, validation and error middleware.
2. **Part 2 — Core APIs:** Property CRUD/search, host permissions, date availability/booking holds, wishlist, reviews and cancellation.
3. **Part 3 — Frontend foundation:** Vite/React, Tailwind, React Router, authentication Context, Redux Toolkit, login and registration forms.
4. **Part 4 — Home/search UI:** Airbnb-style navigation and search, categories, filters, responsive cards, favorites and Leaflet map.
5. **Part 5 — Stay details/checkout:** Photo gallery, date and guest selection, price breakdown, booking flow, Multer/Cloudinary uploads, Stripe Checkout and dev-only simulated payment.
6. **Part 6 — Dashboard/data/deployment:** Host/guest dashboard tabs, profile editing, 12 Indian sample listings, Postman collection, environment templates and deployment starter configuration.

## Deployment guide (after local testing)

### Backend on Render

A starter `render.yaml` is included. Create a Render Blueprint/web service from this repository and set `MONGODB_URI` to a persistent MongoDB Atlas URI. Set `CLIENT_URL` and `FRONTEND_URL` to your deployed frontend origin, and configure Cloudinary/Stripe credentials if using those integrations. Never deploy with `USE_MEMORY_DB=true`; in-memory data is volatile. Use Stripe test keys only while testing.

### Frontend on Vercel

Import the repository into Vercel. Keep the repository root as the project root so npm workspaces can resolve both packages. Use install command `npm install`, build command `npm run build --workspace=client`, and output directory `client/dist`. Set the frontend environment variable `VITE_API_URL` to your deployed API URL plus `/api`, for example `https://your-api.example.com/api`. The `client/vercel.json` file includes an SPA rewrite for React Router. Add the deployed frontend origin to backend `CLIENT_URL` and `FRONTEND_URL` values, then redeploy the API.

For a real Stripe deployment, configure a webhook endpoint at `https://your-api.example.com/api/payment/webhook` for `checkout.session.completed` and set its signing secret as `STRIPE_WEBHOOK_SECRET`. Confirm your webhook URL and all environment variables before enabling live charges.

## Requirements

- Node.js 22.12+ (Node 24 LTS is recommended) and npm 10+.
- Internet for installation and first run of `mongodb-memory-server` if its MongoDB binary is not already cached.
- Modern desktop/mobile browser.

## Quick start (Windows / VS Code)

1. Extract the ZIP to a path without restrictive permissions, such as `C:\Users\<you>\Projects\airbnb-clone-complete`.
2. In VS Code, open the **outer** `airbnb-clone-complete` folder—the one containing the root `package.json`, `client`, and `server` folders.
3. Open a terminal in that outer folder and run:

   ```powershell
   npm.cmd install
   npm.cmd run check
   npm.cmd run dev
   ```

   `npm.cmd install` installs both workspaces (client and server). `npm.cmd run dev` starts the API and frontend together. On macOS/Linux, use `npm install`, `npm run check`, and `npm run dev`.

4. Visit <http://localhost:5173> for the website and <http://localhost:5000/api/health> for the API health check.
5. Keep the terminal open while using the app. Stop both processes with `Ctrl+C`.

### If npm reports that the MongoDB install script is not approved

Usually the project can attempt to download its MongoDB binary on first start. If startup then specifically fails because the binary did not install/download, review/approve only this dependency script from the project root and install again:

```powershell
npm.cmd approve-scripts mongodb-memory-server
npm.cmd install
npm.cmd run dev
```

Do not approve all dependency scripts indiscriminately. If your school/work network blocks MongoDB's binary download, use a persistent MongoDB Atlas URI instead.

## Demo data and logins

On first local development startup, the API seeds 12 demo listings if the database is empty. The sample listings include Chail, Kasauli, Shoghi, Goa, Manali, Lonavala, Jaipur, Bengaluru, Varkala, and Mulshi.

| Role | Email | Password |
|---|---|---|
| Demo guest | `guest@staybnb.local` | `GuestPass123!` |
| Demo host | `host@staybnb.local` | `HostPass123!` |
| Additional host | `raj@staybnb.local` | `HostPass123!` |
| Additional host | `shivangi@staybnb.local` | `HostPass123!` |

These credentials are for local demo use only. Do not deploy them or use them in production. You can also create your own account through Sign Up. New user accounts start as `guest`; a user can choose **Become a host** from the listing/profile flow.

## Environment configuration

The defaults intentionally run locally without requiring MongoDB Atlas, Cloudinary, Google OAuth, or Stripe credentials. For custom configuration:

1. Copy `server/.env.example` to `server/.env`.
2. Optionally copy `client/.env.example` to `client/.env`.
3. Restart the project after changing environment variables.

### Local temporary database (default)

`USE_MEMORY_DB=true` uses `mongodb-memory-server`. It is suitable for a demo and resets when the API stops. Seed data is loaded automatically in development unless `SEED_DEMO_DATA=false`.

### Persistent MongoDB Atlas/local database

In `server/.env`, set `USE_MEMORY_DB=false` and set `MONGODB_URI` to the Atlas or local MongoDB connection string. In Atlas, create a database user, add your current IP in Network Access, and use the driver connection string. URL-encode special characters in the database user's password. To insert the sample listings in that persistent database, run `npm.cmd run seed --workspace=server` from the repository root after setting `USE_MEMORY_DB=false` and `MONGODB_URI`.

### Secrets and optional integrations

- Development JWT/session secrets are generated if omitted. For deployment, set `NODE_ENV=production`, use persistent MongoDB, and provide unique random `JWT_SECRET` and `SESSION_SECRET` values (at least 32 characters).
- Google OAuth: create OAuth client credentials in Google Cloud Console, configure the redirect URL `http://localhost:5000/api/auth/google/callback`, and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`.
- Cloudinary: configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Without Cloudinary, development uploads go into `server/public/uploads`.
- Stripe: use Stripe **test-mode** credentials in `STRIPE_SECRET_KEY`; set `STRIPE_WEBHOOK_SECRET` for webhooks. Stripe Checkout success return is verified using the server. If Stripe is not configured in development, the app uses a visibly labelled simulated payment endpoint that does not charge money. Simulated payment is disabled in production.
- Frontend: `VITE_API_URL` defaults to `http://localhost:5000/api`.

Never commit `.env` files, Stripe secrets, Cloudinary secrets, database passwords, or JWT/session secrets.

## Main features

### Authentication

- Sign up/login with validated email and password; passwords are hashed using bcrypt.
- JWT bearer tokens with HttpOnly cookie support; current profile and logout endpoints.
- Optional Google OAuth via Passport.
- Protected frontend routes for booking, dashboard, and hosting.

### Property and search

- Home page styled after a vacation-rental marketplace: large rounded search bar, scrollable category rail, filters, cards, heart/wishlist control, image indicators, INR prices, and a Leaflet map toggle.
- Search by destination/location text, check-in/check-out availability, category, type, guests, and price range.
- Hosts can create, edit, and delete their listings. Listings include title, description, images, category, location coordinates, price, amenities, guest capacity, rooms, and bathrooms.
- Multiple image upload support via Multer. Local development stores files locally; Cloudinary is used when its credentials are configured.

### Bookings and payments

- Check date availability and block overlapping pending/confirmed bookings using one unique lock document per reserved night.
- Holds expire after 15 minutes when payment is not completed.
- Booking dashboard, host booking activity, and cancellation of unpaid holds.
- Stripe Checkout (test mode) if configured; a local demo-payment flow is used otherwise, only when not in production.

### Wishlist, reviews, map, dashboard

- Logged-in users can add/remove wishlist items.
- Leaflet/OpenStreetMap map view and property location mini-map.
- One review per user/property; the API requires a completed confirmed paid stay before allowing a review.
- Dashboard tabs for listings, bookings, wishlist, profile, and host activity.

## API endpoints

Base URL: `http://localhost:5000/api`. Protected endpoints accept `Authorization: Bearer <token>` or the HttpOnly `token` cookie.

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/become-host`
- `PATCH /auth/profile` — update display name/avatar
- `POST /auth/logout`
- Optional OAuth: `GET /auth/google`, `GET /auth/google/callback`

### Properties and reviews

- `GET /properties` — query params: `search`/`location`, `minPrice`, `maxPrice`, `guests`, `category`, `propertyType`, `checkIn`, `checkOut`, `page`, `limit`
- `GET /properties/:id`
- `GET /properties/host/mine` — host/admin
- `POST /properties` — host/admin
- `PUT /properties/:id` — owner/admin
- `DELETE /properties/:id` — owner/admin; blocked when active reservations exist
- `POST /properties/:id/reviews` — authenticated eligible guest

### Bookings

- `GET /bookings/check-availability?propertyId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=2`
- `POST /bookings` — creates a temporary pending date hold
- `GET /bookings/my`
- `GET /bookings/host` — host/admin
- `DELETE /bookings/:id` — cancels an unpaid reservation

### Wishlist, upload, payments

- `GET /wishlist`
- `POST /wishlist/:propertyId` — toggles add/remove
- `POST /uploads/images` — multipart form field `images`, up to 10 images; host/admin
- `POST /payment/create-checkout-session` — body `{ "bookingId": "..." }`
- `GET /payment/confirm-session?session_id=...` — confirms the current user's paid Stripe session
- `POST /payment/demo-confirm` — body `{ "bookingId": "..." }`, local development only
- `POST /payment/webhook` — Stripe webhook; configure the webhook signing secret

A Postman collection is in `postman/Airbnb-Clone-Part-2.postman_collection.json`. Import it into Postman to run the backend flow. For UI-based testing, sign in with the demo logins above and browse/host stays on the React app.

## Build/check commands

From the project root:

```powershell
npm.cmd run check
npm.cmd run build
```

`check` validates backend syntax and checks the frontend source tree. `build` runs the Vite production build and is the stronger check of frontend imports/JSX.

## Project structure

```text
airbnb-clone-complete/
├── package.json                 # npm workspaces; starts frontend + backend together
├── README.md
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── api/                  # Axios interceptor
│       ├── context/              # Auth Context
│       ├── store/                # Redux Toolkit listing and booking slices
│       ├── components/           # Nav, search, card, map, guard, spinner
│       ├── pages/                # Home, auth, property, listing, dashboard, payment
│       └── utils/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── seeds/
│       ├── utils/
│       └── validators/
└── postman/
```

## Troubleshooting

- **`cd server` says the path does not exist:** Make sure you opened the outer extracted `airbnb-clone-complete` folder, not a nested duplicate. Run `dir`; it should show `client`, `server`, and the root `package.json`.
- **`npm.ps1 cannot be loaded`:** On Windows use `npm.cmd` as shown above.
- **MongoDB binary download/start fails:** Check internet access, retry startup, and if npm specifically reports a blocked install script, approve `mongodb-memory-server` only. On managed networks, use persistent Atlas instead.
- **Frontend cannot reach API:** Ensure both servers are running, frontend is on port 5173, backend on port 5000, and `VITE_API_URL` points to `http://localhost:5000/api`.
- **Port already in use:** Stop the old server terminal with `Ctrl+C` before starting again.
- **Images fail to upload:** Ensure you are logged in as a host. Local uploads need write access to `server/public/uploads`; production needs Cloudinary credentials.
- **Real Stripe checkout not available:** Configure test-mode keys. With no key in development, demo checkout is intentional and does not charge a card.
