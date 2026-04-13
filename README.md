# Hotel Booking System - Frontend

A Next.js application for hotel booking with authentication, hotel browsing, and booking management.

## Backend API

The backend API is hosted at: `https://backend-for-frontend-dhgt.onrender.com/api/v1`

## Features

- User authentication (register/login)
- Browse available hotels
- Book hotels (max 3 nights per booking)
- View and manage bookings
- Admin dashboard for viewing all bookings

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Routes

- `/` - Redirects to register page
- `/register` - User registration
- `/login` - User login
- `/hotels` - Browse available hotels
- `/hotels/[hotelId]/book` - Book a specific hotel
- `/bookings` - View your bookings
- `/bookings/[id]/edit` - Edit a booking
- `/admin` - Admin dashboard (requires admin role)

## Tech Stack

- Next.js 16 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- React Hook Form
- Lucide React icons

## API Integration

The app uses the backend API with JWT authentication. The token is stored in localStorage after successful login/registration.

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_API_URL=https://backend-for-frontend-dhgt.onrender.com/api/v1
```
