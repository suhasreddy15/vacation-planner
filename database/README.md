# VoyageIQ Database

This folder contains a MySQL database design for the Vacation Planner website.

## Files

- `schema.sql` creates the `voyageiq` database and all required tables.
- `seed.sql` inserts starter trips that match the current React frontend.

## Tables

- `users`: registered travelers, organizers, and admins.
- `trips`: vacation packages with INR pricing stored as paise.
- `trip_inclusions`: included items such as hotel, food, transport, and guide.
- `trip_gallery`: image gallery records for each trip.
- `trip_highlights`: trip highlight bullets.
- `trip_itinerary_days`: day-wise itinerary records.
- `bookings`: user trip bookings.
- `ai_planner_requests`: saved AI planner form submissions and generated plans.
- `reviews`: user ratings and reviews for trips.

## Import Order

Run these files in order:

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

For production authentication, store hashed passwords in `users.password_hash`.
Never store plain text passwords in a real database.
