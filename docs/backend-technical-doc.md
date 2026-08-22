# Sakan Backend Technical Documentation for Flutter Team

This document reflects the current backend source as reviewed in the project. It is intended as the source-of-truth contract for Flutter/mobile integration and is based on the implementation in the NestJS server, not on assumptions or removed code.

---

## 1. Overview

The Sakan backend is a NestJS + TypeScript API serving a real-estate marketplace. Its main domains are:

- Authentication and user accounts
- Property listing creation, search, ownership, publication, and image management
- Favorites and notifications
- Reviews and reports
- Payments and approval workflow
- Admin dashboard and platform settings
- MongoDB persistence via Mongoose

The API is mounted under the global prefix `/api` in `main.ts`.

---

## 2. Stack and Runtime Setup

### Core technologies

- NestJS
- TypeScript
- MongoDB + Mongoose
- JWT authentication via Passport
- Cloudinary for image upload and deletion
- NestJS schedule utilities
- NestJS throttling
- Swagger (document generation configured in bootstrap)

### Global backend configuration

From the app bootstrap and root module:

- Global prefix: `/api`
- Validation enabled globally via `ValidationPipe`
- CORS enabled
- Helmet and compression enabled
- Throttler enabled globally for 100 requests per 60 seconds
- Mongo connection is configured via `MONGODB_URI`
- JWT secret/config comes from app config

### Important environment variables

The code expects values such as:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PORT`

---

## 3. Application Structure

### Root module

`AppModule` wires the project together and includes:

- MongoDB connection
- Global throttler guard
- Users, Auth, Properties, Cloudinary, Favorites, Admin, Platform Settings, Reviews, Reports
- Scheduler support

### Feature modules

- `auth` — register, login, JWT verification
- `users` — user lookup and admin/user management
- `properties` — listing lifecycle and query/search logic
- `cloudinary` — image upload/delete service
- `favorites` — saving favorite properties
- `notifications` — user notifications
- `reviews` — property reviews and average rating
- `reports` — report and moderation flow
- `payments` — listing payment submission and review
- `platform-settings` — global pricing, payment methods, or defaults
- `admin` — dashboard and moderation tools

---

## 4. Authentication and Authorization

### Registration

`POST /api/auth/register`

Body:

- `name` string
- `email` string
- `password` string, minimum 8 characters
- `phone` string
- `role` optional: `User` or `Admin`

Behavior:

- Rejects duplicate phone numbers
- Rejects duplicate emails
- Hashes password using bcrypt
- Creates user and returns a JWT token plus basic user object

### Login

`POST /api/auth/login`

Body:

- `email`
- `password`

Behavior:

- Looks up user by email
- Compares bcrypt hash
- Returns JWT and user profile summary

### JWT payload

The auth token includes:

- `sub` → user id
- `email`
- `role`

### Protected routes

The project uses `JwtAuthGuard` for authenticated access. `RolesGuard` enforces admin-only endpoints using a `@Roles()` metadata decorator.

#### Standard roles

- `User`
- `Admin`

### Current user contract

JWT user information is expected to be available as:

- `req.user.sub` for ID in some modules
- `req.user.userId` in property/favorites controllers
- `user.role` and `user.email` in JWT payload

> Flutter should send the token in the `Authorization: Bearer <token>` header.

---

## 5. User Model

The user schema contains:

- `name`: required string
- `email`: required, unique, lowercase
- `role`: enum `User | Admin`, default `User`
- `password`: required hashed password
- `phone`: required, unique
- `avatar`: default empty string
- `isVerified`: default `false`
- timestamps enabled

### User-related backend operations

- `findByEmail`
- `findByPhone`
- `findById`
- `create`
- `countUsers`
- `countAdmins`
- `latestUsers`
- `findAll`
- `deleteUser`

---

## 6. Property Domain Model

### Main property fields

The `Property` schema includes:

- `title`
- `description`
- `price`
- `governorate`
- `city`
- `address`
- `bedrooms`
- `bathrooms`
- `area`
- `floor` optional
- `propertyType` (enum values such as `Apartment`, `Studio`, `Villa`, `Duplex`, `Penthouse`, etc.)
- `furnished` boolean
- `images` array of URL strings
- `imagePublicIds` array of Cloudinary public IDs
- `status` with lifecycle states below
- `views`
- `favoritesCount`
- `isFeatured` legacy field still present in schema
- `listingType`: `Normal | Featured`
- `publishedAt`
- `expiryReminderSentAt`
- `expiresAt`
- `showExactLocation`
- `location` GeoJSON Point
- `owner` references `User`
- timestamps

### Property status flow

Valid status values in the schema:

- `PendingPayment`
- `Pending`
- `Published`
- `Rented`
- `Rejected`
- `Expired`
- `Deleting`

### Listing type flow

The active listing classification is `listingType` and not the older `isFeatured` flag. In the final source state:

- `listingType: 'Featured'`
- `listingType: 'Normal'`

The admin toggle flips the value directly:

- Featured → Normal
- Normal → Featured

### Geospatial index

The property schema includes a 2dsphere index on `location` for nearby property searches.

---

## 7. Property API

### Create property

`POST /api/properties`

Requires auth.

Multipart form-data:

- `images` optional files
- JSON body fields as defined by `CreatePropertyDto`

Required body fields:

- `title`
- `description`
- `price`
- `governorate`
- `city`
- `address`
- `bedrooms`
- `bathrooms`
- `area`
- `propertyType`
- `furnished`

Optional:

- `floor`
- `location`
- `showExactLocation`
- `listingType` (`Normal` or `Featured`)
- `images` in the form is handled by file upload

Behavior:

- Uploads each file to Cloudinary
- Saves secure URLs + public IDs
- Calculates expiry date using `PlatformSettings.listingDurationDays`
- Sets status based on platform listing price:
  - if listing price is 0, status becomes `Pending`
  - otherwise `PendingPayment`
- Saves owner reference and geo point if supplied

### List published properties

`GET /api/properties`

Public endpoint.

Supported query params:

- `page`
- `limit`
- `city`
- `governorate`
- `minPrice`
- `maxPrice`
- `bedrooms`
- `propertyType`
- `search`
- `sort`: `latest`, `priceAsc`, `priceDesc`
- `status`

Behavior:

- Filters by `status: Published`
- Sorts by `listingType` priority first, then published time or price
- Returns pagination metadata and results

### My properties

`GET /api/properties/my`

Requires auth.

Returns properties owned by the logged-in user with optional status filter and pagination.

### My stats

`GET /api/properties/my/stats`

Requires auth.

Returns counts by property status for the current user.

### Nearby properties

`GET /api/properties/nearby?lat=...&lng=...&radius=...`

Public endpoint.

Behavior:

- Uses MongoDB `$near` geospatial query
- Filters to `status: Published`
- Distance is in kilometers, converted to meters internally

### Get property by id

`GET /api/properties/:id`

Public endpoint.

Behavior:

- Increments `views`
- Returns property + owner name and phone
- Adds WhatsApp link when the owner phone exists

### Update property

`PATCH /api/properties/:id`

Requires auth and ownership.

Behavior:

- The owner can update their own property
- Non-owners receive forbidden response

### Update property images

`PATCH /api/properties/:id/images`

Requires auth, owner-only.

Accepts:

- `removedImages` as JSON array of Cloudinary public IDs
- new `images` files

Behavior:

- Deletes removed Cloudinary images
- Uploads new files
- Validates max image count against platform settings
- Saves updated image URLs + public IDs

### Delete property

`DELETE /api/properties/:id`

Requires auth and ownership.

Behavior:

- Verifies owner permission
- Deletes all associated Cloudinary images using stored public IDs
- Removes the property document

### Property deletion and Cloudinary cleanup

This is an important behavior for Flutter/UX integration:

- When a property is deleted by its owner, the service deletes every `imagePublicIds` item from Cloudinary before removing the Mongo document.
- When a user is deleted, admin flow executes `deleteAllUserProperties(id)`, which deletes all Cloudinary images for that user’s properties before deleting the properties themselves.
- Admin report deletion also supports deleting the reported property directly.

So the deletion flow is not just MongoDB cleanup; it actively removes media assets from Cloudinary and keeps storage consistent.

---

## 8. Platform Settings

The platform settings document is a single global config object with defaults:

- `normalListingPrice`: default `500`
- `featuredListingPrice`: default `1000`
- `listingDurationDays`: default `30`
- `maxImagesPerProperty`: default `10`
- `paymentMethods` subdocument with `instaPay`, `vodafoneCash`, `visa`
- `supportPhone`
- `supportEmail`

### Public settings route

`GET /api/settings`

### Admin settings update

`PATCH /api/admin/settings`

Requires admin role.

### Current usage in business logic

The platform settings are used in multiple places:

- property creation expiry date
- property listing price decision (`PendingPayment` logic)
- payment amount calculation for featured vs normal listing
- property image upload limit validation
- listing duration extension on payment approval

This means price and duration are centralized in a single settings document rather than hardcoded per feature.

---

## 9. Payment Flow

### Payment model

The payment record holds:

- `user`
- `property`
- `amount`
- `paymentMethod`
- `receiptImage`
- `receiptPublicId`
- `status`
- `isRenewal`
- `renewProperty`
- review metadata (`reviewedBy`, `reviewNote`, timestamps)

### Submit payment

`POST /api/payments`

Requires auth.

Multipart form-data:

- `receipt` file
- JSON fields:
  - `propertyId`
  - `paymentMethod`
  - `isRenewal` optional boolean

Behavior:

- Checks the property exists and belongs to user
- Requires property status to be `PendingPayment`
- Prevents duplicate pending payment for the same property
- Reads the global platform pricing
- Uploads receipt image to Cloudinary
- Computes amount:
  - if `property.listingType === 'Featured'` use `featuredListingPrice`
  - otherwise use `normalListingPrice`
- Creates a payment with status `Pending`

### My payments

`GET /api/payments/my`

Requires auth.

Returns logged-in user’s payment records, with property summary populated.

### Admin payments

`GET /api/payments/admin`

Requires admin role.

Optional query: `status`

### Approve a payment

`PATCH /api/payments/:id/approve`

Requires admin role.

Behavior:

- Updates the payment to `Approved`
- Marks reviewedBy and review note
- For a renewal payment, extends `expiresAt` by `listingDurationDays`
- Sets property to `Published`
- Clears `expiryReminderSentAt`
- For a non-renewal payment, property is left in a waiting state for admin review / publication workflow
- Sends a notification to the property owner

### Reject a payment

`PATCH /api/payments/:id/reject`

Requires admin role.

Behavior:

- Marks the payment rejected
- Notifies user

### Payment methods public info

`GET /api/payments/methods`

Returns the configured payment method info from platform settings.

---

## 10. Favorites

### Add favorite

`POST /api/favorites/:propertyId`

Requires auth.

Behavior:

- Prevents duplicate favorites
- Increments `favoritesCount` on the property

### Remove favorite

`DELETE /api/favorites/:propertyId`

Requires auth.

Behavior:

- Deletes favorite relation
- Decrements `favoritesCount`

### Count favorites

`GET /api/favorites/count`

Requires auth.

### Check favorite state

`GET /api/favorites/is-favorite/:propertyId`

Requires auth.

Returns `{ isFavorite: true|false }`

### My favorites

`GET /api/favorites`

Requires auth.

Returns property documents for the user’s favorites list, with owner info populated.

---

## 11. Notifications

### Get notifications

`GET /api/notifications`

Requires auth.

### Unread count

`GET /api/notifications/unread-count`

Requires auth.

### Mark one as read

`PATCH /api/notifications/:id/read`

Requires auth.

### Mark all as read

`PATCH /api/notifications/read-all`

Requires auth.

### Delete notification

`DELETE /api/notifications/:id`

Requires auth.

### Notification types in use

Examples from the backend:

- `PropertyPublished`
- `PropertyRejected`
- `PaymentApproved`
- Other custom notifications are created from service logic

---

## 12. Reviews

### Create review

`POST /api/reviews`

Requires auth.

Body:

- `propertyId` Mongo ObjectId
- `rating` integer from 1 to 5
- `comment` optional string

Behavior:

- Rejects if the reviewer is the owner of the property
- Rejects duplicate reviews for the same property by the same reviewer
- Creates a review linked to property and reviewed user

### Get reviews for user

`GET /api/reviews/user/:id`

Returns reviews where this user is the reviewed user.

### Get average rating

`GET /api/reviews/user/:id/rating`

Returns `{ average, count }`.

### Update own review

`PATCH /api/reviews/:id`

Requires auth and reviewer ownership.

### Delete own review

`DELETE /api/reviews/:id`

Requires auth and reviewer ownership.

### Admin delete review

`DELETE /api/reviews/admin/:id`

Requires admin.

---

## 13. Reports

### Create report

`POST /api/reports`

Requires auth.

Body:

- `propertyId`
- `reason` from: `Scam`, `FakePhotos`, `WrongPrice`, `Spam`, `AlreadyRented`, `Other`
- `description` optional

Behavior:

- Prevents reporting your own property
- Prevents duplicate report for same reporter + property

### My reports

`GET /api/reports/my`

Requires auth.

### Admin list reports

`GET /api/reports`

Requires admin.

Optional `status` filter.

### Review report

`PATCH /api/reports/:id`

Requires admin.

Body includes status and reviewNote.

### Delete own report

`DELETE /api/reports/:id`

Requires auth and reporter ownership.

### Admin delete report

`DELETE /api/reports/admin/:id`

Requires admin.

### Delete reported property

`DELETE /api/reports/:id/property`

Requires admin.

Behavior:

- Finds the report
- Deletes the target property document
- Marks the report as reviewed

---

## 14. Admin Dashboard and Moderation

### Pending property list

`GET /api/admin/properties/pending`

Requires admin.

Returns properties in `Pending` status.

### Update property status

`PATCH /api/admin/properties/:id/status`

Requires admin.

Body: `status`

Behavior:

- Sets property status directly
- If status is `Published`, logs `publishedAt`
- Sends a property-published or property-rejected notification to owner

### Toggle featured state

`PATCH /api/admin/properties/:id/feature`

Requires admin.

Behavior:

- Flips `listingType` between `Normal` and `Featured`
- Saves updated property

### Dashboard summary

`GET /api/admin/dashboard`

Requires admin.

Returns:

- total users
- total admins
- latest users
- property stats
- top cities
- top viewed properties
- latest properties

### User list

`GET /api/admin/users?page=1&limit=10&search=...`

Requires admin.

### Delete user

`DELETE /api/admin/users/:id`

Requires admin.

Behavior:

- Rejects deleting the last admin
- Deletes all favorites linked to the user
- Deletes all properties and Cloudinary images for that user
- Deletes the user record itself

### Dashboard export PDF

`GET /api/admin/dashboard/export`

Requires admin.

Generates a PDF report with dashboard summary, users, top cities, top viewed properties, and latest properties.

---

## 15. Search, Sorting, and Query Rules

### Property listing queries

Public property listing supports:

- `city`
- `governorate`
- `propertyType`
- `bedrooms`
- `minPrice`
- `maxPrice`
- `search`
- `sort`

### Sort mapping

- `latest` → default, sorted by `listingType` descending, `publishedAt` descending
- `priceAsc` → `listingType` descending then price ascending
- `priceDesc` → `listingType` descending then price descending

### Important ranking behavior

Featured properties are prioritized before standard properties in list sorting because the backend explicitly sorts by `listingType: -1` before other criteria.

---

## 16. Cloudinary Integration

Cloudinary is used for property and payment receipt media.

### Storage behavior

- Property files are uploaded under the configured Cloudinary project
- Each uploaded file stores both:
  - `secure_url`
  - `public_id`

### Property media storage

Stored on the property model as:

- `images`: URL array
- `imagePublicIds`: public ID array

### Delete flow

Cloudinary deletions are performed whenever:

- a property is deleted
- a property image is removed
- a property image set is updated
- a user is deleted and their properties are cleaned up
- a payment receipt is no longer relevant in some workflow paths

This backend treats Cloudinary as authoritative media storage and deletes remote files before or alongside Mongo cleanup.

---

## 17. Important Business Logic Notes for Flutter

### 1. Property publication requires payment when price is non-zero

When a property is created:

- if the chosen listing setting price is zero, it goes directly to `Pending`
- otherwise it starts as `PendingPayment`

This means mobile clients must be prepared to handle a payment step before publication for most normal/featured cases.

### 2. Listing type is the real pricing/sorting discriminator

The active field is `listingType`, not `isFeatured`.

Flutter should read and display:

- `listingType: 'Normal' | 'Featured'`

and not rely on older `isFeatured` semantics.

### 3. User access is JWT-based

All protected routes require a valid bearer token. The token payload contains user identity and role. Flutter must persist and send it on subsequent requests.

### 4. Admin routes are protected by both guards

`JwtAuthGuard` + `RolesGuard` protect admin APIs.

### 5. Geo data expects a Point object

For nearby-search or map-based feature work, property coordinates are stored as:

```json
{
  "type": "Point",
  "coordinates": [lng, lat]
}
```

### 6. Image removal is by Cloudinary public ID

When deleting or replacing property images, the client must send the correct public IDs from the existing property data for accurate backend cleanup.

### 7. Notification and payment flows are tightly linked

Payment approval triggers notifications and can update a property’s expiration and publication status.

---

## 18. Recommended Flutter Integration Checklist

- Store JWT in secure storage and attach to all protected requests
- Use `/api/auth/register` and `/api/auth/login` for auth
- Treat property creation as multipart upload with file list + JSON payload
- Handle `PendingPayment`, `Pending`, `Published`, `Rejected`, `Expired`, `Rented`
- Read `listingType` and sort featured listings before normal ones
- Use the `location.coordinates` GeoJSON format when creating map-related features
- Handle Cloudinary-backed image URLs and public IDs carefully
- Expect favorites, reviews, reports, and notifications to be separate domain modules
- Admin functions require role-based access and are protected by JWT plus admin role metadata

---

## 19. Endpoint Summary

| Module | Route | Auth | Purpose |
|---|---|---:|---|
| Auth | `POST /api/auth/register` | Public | Register user |
| Auth | `POST /api/auth/login` | Public | Login user |
| Auth | `GET /api/auth/me` | JWT | Returns current profile |
| Properties | `POST /api/properties` | JWT | Create property |
| Properties | `GET /api/properties` | Public | List published properties |
| Properties | `GET /api/properties/my` | JWT | My properties |
| Properties | `GET /api/properties/my/stats` | JWT | Ownership stats |
| Properties | `GET /api/properties/nearby` | Public | Nearby properties |
| Properties | `GET /api/properties/:id` | Public | Get property |
| Properties | `PATCH /api/properties/:id` | JWT | Update property |
| Properties | `PATCH /api/properties/:id/images` | JWT | Update images |
| Properties | `DELETE /api/properties/:id` | JWT | Delete property |
| Favorites | `POST /api/favorites/:propertyId` | JWT | Add favorite |
| Favorites | `DELETE /api/favorites/:propertyId` | JWT | Remove favorite |
| Favorites | `GET /api/favorites/count` | JWT | Favorite count |
| Favorites | `GET /api/favorites/is-favorite/:propertyId` | JWT | Favorite state |
| Favorites | `GET /api/favorites` | JWT | My favorites |
| Notifications | `GET /api/notifications` | JWT | Notifications |
| Notifications | `GET /api/notifications/unread-count` | JWT | Unread count |
| Notifications | `PATCH /api/notifications/:id/read` | JWT | Mark read |
| Notifications | `PATCH /api/notifications/read-all` | JWT | Mark all read |
| Notifications | `DELETE /api/notifications/:id` | JWT | Delete notification |
| Reviews | `POST /api/reviews` | JWT | Create review |
| Reviews | `GET /api/reviews/user/:id` | Public | User reviews |
| Reviews | `GET /api/reviews/user/:id/rating` | Public | Average rating |
| Reviews | `PATCH /api/reviews/:id` | JWT | Update review |
| Reviews | `DELETE /api/reviews/:id` | JWT | Delete own review |
| Reviews | `DELETE /api/reviews/admin/:id` | Admin | Admin delete |
| Reports | `POST /api/reports` | JWT | Create report |
| Reports | `GET /api/reports/my` | JWT | My reports |
| Reports | `GET /api/reports` | Admin | Admin reports |
| Reports | `PATCH /api/reports/:id` | Admin | Review report |
| Reports | `DELETE /api/reports/:id` | JWT | Delete own report |
| Reports | `DELETE /api/reports/admin/:id` | Admin | Delete report |
| Reports | `DELETE /api/reports/:id/property` | Admin | Delete property via report |
| Payments | `POST /api/payments` | JWT | Submit payment |
| Payments | `GET /api/payments/my` | JWT | My payments |
| Payments | `GET /api/payments/admin` | Admin | Admin payments |
| Payments | `PATCH /api/payments/:id/approve` | Admin | Approve payment |
| Payments | `PATCH /api/payments/:id/reject` | Admin | Reject payment |
| Payments | `GET /api/payments/methods` | Public/Auth | Payment methods |
| Settings | `GET /api/settings` | Public | Platform settings |
| Settings | `PATCH /api/admin/settings` | Admin | Update settings |
| Admin | `GET /api/admin/dashboard` | Admin | Dashboard |
| Admin | `GET /api/admin/users` | Admin | User management |
| Admin | `DELETE /api/admin/users/:id` | Admin | Delete user |
| Admin | `GET /api/admin/dashboard/export` | Admin | Export PDF |

---

## 20. Final Notes

This backend is a production-style real-estate marketplace backend with clear ownership, moderation, and lifecycle states. The most important implementation details for Flutter are:

- use JWT auth everywhere protected routes are used
- depend on `listingType` for featured logic
- handle `PendingPayment` before listing publication
- expect Cloudinary-backed media paths and public IDs
- respect the platform settings document for pricing and listing durations
- use admin endpoints only with admin tokens

If you want, the next step can be translating this backend contract into a Flutter-ready API reference with example request/response payloads per screen or feature.
