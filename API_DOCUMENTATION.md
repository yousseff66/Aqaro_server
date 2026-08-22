# Sakan Backend API Documentation

## 1. Project Overview

This project is a NestJS backend for a real-estate / property rental platform named Sakan. It includes user authentication, property listing management, favorites, notifications, payments, reports, reviews, admin dashboard features, and platform settings.

The application is built with:

- NestJS 11
- TypeScript
- MongoDB + Mongoose
- Passport + JWT authentication
- Cloudinary for image storage
- Swagger for API documentation
- PDF generation for reports

### Base URL

The application applies a global prefix:

- Base prefix: `/api`
- Default server URL: `http://localhost:3000`

So full endpoint examples look like:

- `http://localhost:3000/api/auth/login`
- `http://localhost:3000/api/properties`
- `http://localhost:3000/api/admin/dashboard`

### Swagger Documentation

- Swagger UI: `http://localhost:3000/docs`

### Global Settings

From `src/main.ts`:

- Global validation pipe enabled
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- CORS enabled for browser/mobile usage
- Gzip compression enabled
- Helmet middleware enabled in code but currently commented out

---

## 2. Technology Stack

### Backend Framework

- NestJS
- TypeScript
- Node.js

### Database

- MongoDB
- Mongoose ODM

### Auth & Security

- JWT via `@nestjs/jwt`
- Passport JWT strategy
- `JwtAuthGuard`
- `RolesGuard`
- `@Roles()` decorator

### Media Handling

- Cloudinary
- `multer` for file upload
- `FilesInterceptor` / `FileInterceptor`

### Additional Libraries

- `class-validator` for DTO validation
- `class-transformer` for request transformation
- `helmet` for security headers
- `compression` for response compression
- `pdfkit` for PDF export
- `json2csv` for CSV export utilities

### Main Dependency File

See: `package.json`

---

## 3. Project Architecture

### Module Structure

The backend is organized by feature modules:

- `src/app.module.ts` — root module
- `src/auth/` — authentication and authorization
- `src/users/` — user data model and logic
- `src/properties/` — property listings and search logic
- `src/favorites/` — favorite property tracking
- `src/notifications/` — user notifications
- `src/payments/` — property payment flows
- `src/reviews/` — property reviews and rating logic
- `src/reports/` — reporting and moderation
- `src/admin/` — admin dashboard and admin functions
- `src/platform-settings/` — global pricing/settings management
- `src/cloudinary/` — media manager integration

### Core Design Pattern

The code follows a modular NestJS architecture using:

- Controllers for APIs
- Services for business logic
- Mongoose schemas for persistence
- DTOs for validation
- Guards for route protection

### Authentication Flow

1. Client sends login/register request.
2. Backend validates email/password.
3. Backend generates JWT token.
4. Client sends token via `Authorization: Bearer <token>`.
5. JWT strategy validates token on protected routes.

### Authorization Model

Roles used in the app:

- `User`
- `Admin`

Protected routes use:

- `JwtAuthGuard`
- `RolesGuard`
- `@Roles('Admin')` for admin-only endpoints

---

## 4. Environment and Configuration

### Required Environment Variables

The project is configured to use environment variables via `ConfigModule.forRoot({ isGlobal: true })`.

Expected variables include:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- Cloudinary credentials

Example:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sakan
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Server Boot

The app starts in `src/main.ts` and listens on:

```ts
await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
```

---

## 5. Data Models and Schemas

## 5.1 User Schema

File: `src/users/schemas/user.schema.ts`

```ts
name: string
email: string
role: 'User' | 'Admin'
password: string
phone: string
avatar: string
isVerified: boolean
```

### Example user object

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "role": "User",
  "phone": "+966500000000",
  "avatar": "",
  "isVerified": false,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

## 5.2 Property Schema

File: `src/properties/schemas/property.schema.ts`

Main fields:

```ts
title: string
description: string
price: number
governorate: string
city: string
address: string
bedrooms: number
bathrooms: number
area: number
floor?: number
propertyType: string
furnished: boolean
images: string[]
imagePublicIds: string[]
status: 'PendingPayment' | 'Pending' | 'Published' | 'Rented' | 'Rejected' | 'Expired' | 'Deleting'
views: number
favoritesCount: number
isFeatured: boolean
listingType: 'Normal' | 'Featured'
publishedAt?: Date
expiresAt: Date
showExactLocation: boolean
location: { type: 'Point'; coordinates: [number, number] }
owner: ObjectId
```

### Example property object

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d5",
  "title": "Luxury Apartment in Riyadh",
  "description": "Beautiful apartment with modern finish.",
  "price": 350000,
  "governorate": "Riyadh",
  "city": "Riyadh",
  "address": "King Fahd Road",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 180,
  "propertyType": "Apartment",
  "furnished": true,
  "status": "Published",
  "listingType": "Featured",
  "images": ["https://res.cloudinary.com/...jpg"],
  "imagePublicIds": ["property/abc123"],
  "owner": "64f7d5b4d9d9c2a1d1b2c3d4",
  "location": {
    "type": "Point",
    "coordinates": [46.6753, 24.7136]
  }
}
```

## 5.3 Platform Settings Schema

The platform settings hold the core pricing and listing configuration.

Typical fields:

- `normalListingPrice`
- `featuredListingPrice`
- `listingDurationDays`
- `paymentMethods`
- `supportPhone`
- `supportEmail`
- `maxImagesPerProperty`

Example:

```json
{
  "normalListingPrice": 100,
  "featuredListingPrice": 250,
  "listingDurationDays": 30,
  "paymentMethods": ["Bank Transfer", "Credit Card"],
  "supportPhone": "+966500000000",
  "supportEmail": "support@sakan.com",
  "maxImagesPerProperty": 8
}
```

---

## 6. Authentication and Authorization

## 6.1 Registration

Endpoint:

```http
POST /api/auth/register
```

### Request Body

```json
{
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "password": "12345678",
  "phone": "+966500000000",
  "role": "User"
}
```

### Validation

- `name` required string
- `email` valid email
- `password` minimum 8 characters
- `phone` required string
- `role` optional enum `User | Admin`

### Success Response

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "phone": "+966500000000",
    "role": "User",
    "avatar": "",
    "isVerified": false
  }
}
```

### Error Example

```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

## 6.2 Login

Endpoint:

```http
POST /api/auth/login
```

### Request Body

```json
{
  "email": "ahmed@example.com",
  "password": "12345678"
}
```

### Success Response

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "phone": "+966500000000",
    "role": "User"
  }
}
```

### Error Example

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

## 6.3 Get Current User

Endpoint:

```http
GET /api/auth/me
```

### Headers

```http
Authorization: Bearer <token>
```

### Success Response

```json
{
  "userId": "64f7d5b4d9d9c2a1d1b2c3d4",
  "email": "ahmed@example.com",
  "role": "User"
}
```

### Notes

This endpoint returns the user payload extracted from JWT.

---

## 7. API Endpoints

This section contains the detailed API routes grouped by feature.

## 7.1 Root Endpoint

### GET /

```http
GET /api/
```

### Response

```json
{
  "message": "Hello World!"
}
```

---

## 7.2 Auth Endpoints

### POST /api/auth/register

Example request:

```json
{
  "name": "Sara Ahmed",
  "email": "sara@example.com",
  "password": "12345678",
  "phone": "+966500123456",
  "role": "User"
}
```

Example response:

```json
{
  "message": "User registered successfully",
  "token": "eyJ...",
  "user": {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
    "name": "Sara Ahmed",
    "email": "sara@example.com",
    "phone": "+966500123456",
    "role": "User",
    "avatar": "",
    "isVerified": false
  }
}
```

### POST /api/auth/login

Example request:

```json
{
  "email": "sara@example.com",
  "password": "12345678"
}
```

Example response:

```json
{
  "message": "Login successful",
  "token": "eyJ...",
  "user": {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
    "name": "Sara Ahmed",
    "email": "sara@example.com",
    "phone": "+966500123456",
    "role": "User"
  }
}
```

### GET /api/auth/me

Headers:

```http
Authorization: Bearer <token>
```

Example response:

```json
{
  "userId": "64f7d5b4d9d9c2a1d1b2c3d4",
  "email": "sara@example.com",
  "role": "User"
}
```

---

## 7.3 Property Endpoints

### POST /api/properties

Requires JWT.

This endpoint accepts a multipart form-data payload because it uploads images.

#### Request example

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Form fields:

```text
title: "Modern Villa in Riyadh"
description: "Great villa with pool and garden"
price: 750000
governorate: "Riyadh"
city: "Riyadh"
address: "Al Malqa District"
bedrooms: 4
bathrooms: 3
area: 350
floor: 2
propertyType: "Villa"
furnished: true
showExactLocation: false
listingType: "Featured"
images: [file1.jpg, file2.jpg]
location: { "type": "Point", "coordinates": [46.6753, 24.7136] }
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "title": "Modern Villa in Riyadh",
  "description": "Great villa with pool and garden",
  "price": 750000,
  "governorate": "Riyadh",
  "city": "Riyadh",
  "address": "Al Malqa District",
  "bedrooms": 4,
  "bathrooms": 3,
  "area": 350,
  "propertyType": "Villa",
  "furnished": true,
  "showExactLocation": false,
  "listingType": "Featured",
  "status": "PendingPayment",
  "images": [
    "https://res.cloudinary.com/.../image1.jpg"
  ],
  "imagePublicIds": ["property/abc123"],
  "owner": "64f7d5b4d9d9c2a1d1b2c3d4",
  "location": {
    "type": "Point",
    "coordinates": [46.6753, 24.7136]
  }
}
```

### GET /api/properties

List all published properties with filters.

#### Query parameters

```text
page=1
limit=10
city=Riyadh
governorate=Riyadh
minPrice=200000
maxPrice=500000
bedrooms=2
propertyType=Apartment
search=modern
sort=latest | priceAsc | priceDesc
```

#### Example response

```json
{
  "total": 15,
  "page": 1,
  "pages": 2,
  "results": [
    {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "description": "Good apartment in central area",
      "price": 280000,
      "city": "Riyadh",
      "governorate": "Riyadh",
      "propertyType": "Apartment",
      "status": "Published",
      "listingType": "Normal",
      "images": ["https://.../image.jpg"],
      "owner": {
        "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
        "name": "Ahmed"
      }
    }
  ]
}
```

### GET /api/properties/my

Requires JWT.

Returns all properties of the logged-in user.

Example response:

```json
{
  "total": 3,
  "page": 1,
  "pages": 1,
  "results": [
    {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "My Villa",
      "status": "Pending",
      "price": 600000,
      "city": "Riyadh"
    }
  ]
}
```

### GET /api/properties/my/stats

Requires JWT.

Example response:

```json
{
  "total": 3,
  "published": 2,
  "pending": 1,
  "rejected": 0,
  "rented": 0
}
```

### GET /api/properties/nearby

Used for nearby property search based on coordinates.

#### Query example

```text
lat=24.7136&lng=46.6753&radius=5000
```

#### Response example

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
    "title": "Nearby Apartment",
    "city": "Riyadh",
    "price": 320000,
    "location": {
      "type": "Point",
      "coordinates": [46.6753, 24.7136]
    }
  }
]
```

### GET /api/properties/:id

Get one property by ID.

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "title": "Modern Apartment",
  "description": "Beautiful apartment",
  "price": 280000,
  "city": "Riyadh",
  "governorate": "Riyadh",
  "owner": {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
    "name": "Ahmed",
    "phone": "+966500000000",
    "whatsappLink": "https://wa.me/966500000000"
  },
  "views": 12,
  "status": "Published",
  "images": ["https://...jpg"]
}
```

### PATCH /api/properties/:id

Requires JWT and ownership.

Example request:

```json
{
  "price": 300000,
  "description": "Updated description",
  "listingType": "Featured"
}
```

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "title": "Modern Apartment",
  "price": 300000,
  "description": "Updated description",
  "listingType": "Featured"
}
```

### PATCH /api/properties/:id/images

Requires JWT and ownership.

This endpoint accepts multipart form-data and removes/updates images.

Example request:

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Fields:

```text
removedImages: ["property/old-image-id"]
images: [new-file1.jpg, new-file2.jpg]
```

Response example:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "images": [
    "https://res.cloudinary.com/.../new1.jpg",
    "https://res.cloudinary.com/.../new2.jpg"
  ],
  "imagePublicIds": [
    "property/new1",
    "property/new2"
  ]
}
```

### DELETE /api/properties/:id

Requires JWT and ownership.

Success response:

```json
{
  "message": "Property deleted successfully"
}
```

---

## 7.4 Favorites Endpoints

All favorites routes require JWT.

### POST /api/favorites/:propertyId

Add a property to favorites.

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3e1",
  "user": "64f7d5b4d9d9c2a1d1b2c3d4",
  "property": "64f7d5b4d9d9c2a1d1b2c3d8",
  "createdAt": "2026-01-02T12:00:00.000Z"
}
```

### DELETE /api/favorites/:propertyId

Remove property from favorites.

Example response:

```json
{
  "message": "Removed from favorites"
}
```

### GET /api/favorites/count

Response:

```json
{
  "count": 7
}
```

### GET /api/favorites/is-favorite/:propertyId

Response:

```json
{
  "isFavorite": true
}
```

### GET /api/favorites

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
    "title": "Modern Apartment",
    "price": 320000,
    "city": "Riyadh",
    "owner": {
      "name": "Ahmed"
    }
  }
]
```

---

## 7.5 Notifications Endpoints

All routes require JWT.

### GET /api/notifications

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3f1",
    "title": "Payment Approved",
    "message": "Your payment has been approved.",
    "type": "PaymentApproved",
    "isRead": false,
    "property": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "images": ["https://...jpg"]
    }
  }
]
```

### GET /api/notifications/unread-count

Response:

```json
{
  "count": 3
}
```

### PATCH /api/notifications/:id/read

Response:

```json
{
  "message": "Notification marked as read"
}
```

### PATCH /api/notifications/read-all

Response:

```json
{
  "message": "All notifications marked as read"
}
```

### DELETE /api/notifications/:id

Response:

```json
{
  "message": "Notification deleted successfully"
}
```

---

## 7.6 Payments Endpoints

All routes require JWT except payment method list.

### POST /api/payments

Creates a payment receipt and stores the payment record.

#### Request

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Form fields:

```text
propertyId: "64f7d5b4d9d9c2a1d1b2c3d8"
paymentMethod: "Bank Transfer"
isRenewal: false
receipt: [receipt-file.jpg]
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3c1",
  "user": "64f7d5b4d9d9c2a1d1b2c3d4",
  "property": "64f7d5b4d9d9c2a1d1b2c3d8",
  "amount": 250,
  "paymentMethod": "Bank Transfer",
  "receiptImage": "https://res.cloudinary.com/.../receipt.jpg",
  "receiptPublicId": "payment/receipt-123",
  "status": "Pending",
  "isRenewal": false,
  "createdAt": "2026-01-02T14:00:00.000Z"
}
```

### GET /api/payments/my

Returns payment history for authenticated user.

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3c1",
    "amount": 250,
    "status": "Pending",
    "paymentMethod": "Bank Transfer",
    "property": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "price": 320000,
      "city": "Riyadh",
      "status": "PendingPayment"
    }
  }
]
```

### GET /api/payments/admin

Admin-only. Optional query param:

```text
status=Pending
```

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3c1",
    "amount": 250,
    "status": "Pending",
    "user": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "phone": "+966500000000"
    },
    "property": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "city": "Riyadh",
      "price": 320000,
      "status": "PendingPayment"
    }
  }
]
```

### PATCH /api/payments/:id/approve

Admin-only.

#### Request body

```json
{
  "reviewNote": "Payment verified successfully"
}
```

#### Response example

```json
{
  "message": "Payment approved successfully"
}
```

### PATCH /api/payments/:id/reject

Admin-only.

#### Request body

```json
{
  "reviewNote": "Receipt is unclear"
}
```

#### Response example

```json
{
  "message": "Payment rejected successfully"
}
```

### GET /api/payments/methods

Public or authenticated depending on guard usage.

Example response:

```json
[
  "Bank Transfer",
  "Credit Card",
  "Cash",
  "Apple Pay"
]
```

---

## 7.7 Reports Endpoints

### POST /api/reports

Requires JWT.

#### Request body

```json
{
  "propertyId": "64f7d5b4d9d9c2a1d1b2c3d8",
  "reason": "spam",
  "description": "This listing contains false information"
}
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3e2",
  "reporter": "64f7d5b4d9d9c2a1d1b2c3d4",
  "property": "64f7d5b4d9d9c2a1d1b2c3d8",
  "reason": "spam",
  "description": "This listing contains false information",
  "status": "Pending"
}
```

### GET /api/reports/my

Requires JWT.

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3e2",
    "property": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "city": "Riyadh",
      "status": "Published"
    },
    "reason": "spam",
    "status": "Pending"
  }
]
```

### GET /api/reports

Admin-only.

Optional query param:

```text
status=Pending
```

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3e2",
    "reporter": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
      "name": "Ahmed",
      "email": "ahmed@example.com"
    },
    "property": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
      "title": "Modern Apartment",
      "city": "Riyadh",
      "owner": "64f7d5b4d9d9c2a1d1b2c3d4"
    },
    "status": "Pending"
  }
]
```

### PATCH /api/reports/:id

Admin-only.

#### Request body

```json
{
  "status": "Reviewed",
  "reviewNote": "False listing verified and closed"
}
```

#### Response example

```json
{
  "message": "Report reviewed successfully"
}
```

### DELETE /api/reports/:id

Requires JWT and ownership of report.

Response:

```json
{
  "message": "Report deleted successfully"
}
```

### DELETE /api/reports/admin/:id

Admin-only.

Response:

```json
{
  "message": "Report deleted successfully"
}
```

### DELETE /api/reports/:id/property

Admin-only.

Deletes the reported property.

Response:

```json
{
  "message": "Property deleted successfully"
}
```

---

## 7.8 Reviews Endpoints

### POST /api/reviews

Requires JWT.

#### Request body

```json
{
  "propertyId": "64f7d5b4d9d9c2a1d1b2c3d8",
  "rating": 5,
  "comment": "Excellent property and very responsive owner."
}
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3f5",
  "reviewer": "64f7d5b4d9d9c2a1d1b2c3d4",
  "reviewedUser": "64f7d5b4d9d9c2a1d1b2c3d2",
  "property": "64f7d5b4d9d9c2a1d1b2c3d8",
  "rating": 5,
  "comment": "Excellent property and very responsive owner."
}
```

### GET /api/reviews/user/:id

List all reviews for a user.

Example response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3f5",
    "reviewer": {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
      "name": "Ahmed",
      "image": ""
    },
    "rating": 5,
    "comment": "Excellent property"
  }
]
```

### GET /api/reviews/user/:id/rating

Get rating summary for a user.

Example response:

```json
{
  "average": 4.7,
  "count": 12
}
```

### PATCH /api/reviews/:id

Requires JWT and review ownership.

#### Request body

```json
{
  "rating": 4,
  "comment": "Updated review comment"
}
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3f5",
  "rating": 4,
  "comment": "Updated review comment"
}
```

### DELETE /api/reviews/:id

Requires JWT and review ownership.

Response:

```json
{
  "message": "Review deleted successfully"
}
```

### DELETE /api/reviews/admin/:id

Admin-only.

Response:

```json
{
  "message": "Review deleted successfully"
}
```

---

## 7.9 Admin Endpoints

All admin routes are guarded by `JwtAuthGuard` and `RolesGuard`, and require `Admin` role.

### GET /api/admin/test

Response:

```json
{
  "message": "Welcome Admin 👑"
}
```

### GET /api/admin/properties/pending

Response:

```json
[
  {
    "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
    "title": "Pending Villa",
    "status": "Pending",
    "owner": "64f7d5b4d9d9c2a1d1b2c3d4"
  }
]
```

### PATCH /api/admin/properties/:id/status

#### Request body

```json
{
  "status": "Published"
}
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "status": "Published"
}
```

### PATCH /api/admin/properties/:id/feature

Toggles featured status.

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d8",
  "listingType": "Featured",
  "isFeatured": true
}
```

### GET /api/admin/dashboard

Example response:

```json
{
  "users": {
    "total": 120,
    "admins": 5,
    "latest": [
      { "_id": "64f7d5b4d9d9c2a1d1b2c3d4", "name": "Ahmed", "email": "ahmed@example.com" }
    ]
  },
  "properties": {
    "total": 500,
    "published": 320,
    "pending": 50,
    "rejected": 15,
    "rented": 40
  },
  "topCities": [
    { "city": "Riyadh", "count": 100 }
  ],
  "topViewed": [
    { "_id": "64f7d5b4d9d9c2a1d1b2c3d8", "title": "Apartment", "views": 100 }
  ],
  "latestProperties": [
    { "_id": "64f7d5b4d9d9c2a1d1b2c3d8", "title": "New Listing", "status": "Published" }
  ]
}
```

### GET /api/admin/users

Query params:

```text
page=1&limit=10&search=ahmed
```

Example response:

```json
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "results": [
    {
      "_id": "64f7d5b4d9d9c2a1d1b2c3d4",
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "role": "User"
    }
  ]
}
```

### GET /api/admin/settings

Returns platform settings.

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d9",
  "normalListingPrice": 100,
  "featuredListingPrice": 250,
  "listingDurationDays": 30,
  "maxImagesPerProperty": 8,
  "supportPhone": "+966500000000"
}
```

### PATCH /api/admin/settings

#### Request body

```json
{
  "normalListingPrice": 150,
  "featuredListingPrice": 300,
  "listingDurationDays": 45,
  "maxImagesPerProperty": 10
}
```

#### Response example

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d9",
  "normalListingPrice": 150,
  "featuredListingPrice": 300,
  "listingDurationDays": 45,
  "maxImagesPerProperty": 10
}
```

### DELETE /api/admin/users/:id

Deletes a user after cleaning favorites, properties, and related data.

Response:

```json
{
  "message": "User deleted successfully"
}
```

### GET /api/admin/dashboard/export

Downloads a PDF dashboard report.

#### Response

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename=Sakan_Dashboard_Report.pdf`

---

## 7.10 Platform Settings Endpoints

### GET /api/settings

Public endpoint.

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d9",
  "normalListingPrice": 100,
  "featuredListingPrice": 250,
  "listingDurationDays": 30,
  "paymentMethods": ["Bank Transfer", "Credit Card"],
  "supportPhone": "+966500000000",
  "supportEmail": "support@sakan.com",
  "maxImagesPerProperty": 8
}
```

### PATCH /api/admin/settings

Admin-only.

Example request:

```json
{
  "normalListingPrice": 120,
  "featuredListingPrice": 260,
  "listingDurationDays": 45
}
```

Example response:

```json
{
  "_id": "64f7d5b4d9d9c2a1d1b2c3d9",
  "normalListingPrice": 120,
  "featuredListingPrice": 260,
  "listingDurationDays": 45
}
```

---

## 8. Validation, Error Handling, and Response Rules

The app uses a global validation pipe in `src/main.ts`:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

This means:

- unknown JSON fields are removed/blocked
- request input is transformed automatically
- DTO validation errors return standard NestJS error responses

### Common Error Format

```json
{
  "statusCode": 400,
  "message": ["email must be an email address"],
  "error": "Bad Request"
}
```

### Common Status Codes

- `200 OK`: successful request
- `201 Created`: resource created successfully
- `400 Bad Request`: invalid request or duplicate data
- `401 Unauthorized`: invalid or missing token
- `403 Forbidden`: not allowed for user role or ownership
- `404 Not Found`: target resource missing
- `500 Internal Server Error`: unexpected backend issue

### Typical Validation Examples

- Missing email in register
- Password shorter than 8 characters
- Invalid property ID format
- File exceeds 5MB limit
- Invalid image extension

---

## 9. Running, Testing, and Deployment

## 9.1 Install Dependencies

```bash
npm install
```

## 9.2 Start in Development Mode

```bash
npm run start:dev
```

## 9.3 Start Production Build

```bash
npm run build
npm run start:prod
```

## 9.4 Run Tests

```bash
npm run test
```

## 9.5 Run e2e Tests

```bash
npm run test:e2e
```

## 9.6 Deployment Guidance

For production deployment:

1. Set all required environment variables.
2. Use a production-grade MongoDB instance.
3. Configure Cloudinary credentials.
4. Keep `JWT_SECRET` secret and unique.
5. Restrict CORS to trusted domains only.
6. Use HTTPS in production.
7. Run behind a reverse proxy such as Nginx or PM2.
8. Configure backups for MongoDB.

### Recommended Production URL Pattern

```text
https://api.yourdomain.com
```

### Swagger in Production

Swagger may be left enabled only on staging or internal environments, or restricted behind admin access.

---

# Appendix A: Quick Reference Table

| Feature | Base Route |
|---|---|
| Auth | `/api/auth` |
| Properties | `/api/properties` |
| Favorites | `/api/favorites` |
| Notifications | `/api/notifications` |
| Payments | `/api/payments` |
| Reviews | `/api/reviews` |
| Reports | `/api/reports` |
| Admin | `/api/admin` |
| Settings | `/api/settings` |
| Swagger | `/docs` |

# Appendix B: Authorization Header Pattern

```http
Authorization: Bearer <jwt_token>
```

# Appendix C: Multipart Upload Pattern

For image-related endpoints, use `multipart/form-data`, for example:

```http
POST /api/properties
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Fields:

```text
title=Modern Apartment
price=320000
images=@image1.jpg
images=@image2.jpg
```

---

This document reflects the actual backend implementation as present in the project source code.
