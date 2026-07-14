-- VoyageIQ Vacation Planner database schema
-- MySQL 8 compatible. Store money in paise to avoid floating point rounding issues.

CREATE DATABASE IF NOT EXISTS voyageiq;
USE voyageiq;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  role ENUM('traveler', 'organizer', 'admin') NOT NULL DEFAULT 'traveler',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE trips (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  category ENUM('Beach', 'Mountains', 'Adventure', 'Family', 'Honeymoon') NOT NULL,
  location VARCHAR(160) NOT NULL,
  duration_days INT UNSIGNED NOT NULL,
  duration_nights INT UNSIGNED NOT NULL,
  price_paise INT UNSIGNED NOT NULL,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  image_url TEXT NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  full_description TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE trip_inclusions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT UNSIGNED NOT NULL,
  inclusion_name VARCHAR(80) NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE trip_gallery (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT UNSIGNED NOT NULL,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(180),
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE trip_highlights (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT UNSIGNED NOT NULL,
  highlight_text VARCHAR(180) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE trip_itinerary_days (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT UNSIGNED NOT NULL,
  day_number INT UNSIGNED NOT NULL,
  title VARCHAR(140),
  description TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  UNIQUE (trip_id, day_number)
);

CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  travel_date DATE NOT NULL,
  travelers_count INT UNSIGNED NOT NULL DEFAULT 1,
  total_price_paise INT UNSIGNED NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT
);

CREATE TABLE ai_planner_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  destination VARCHAR(160) NOT NULL,
  budget_paise INT UNSIGNED NOT NULL,
  number_of_days INT UNSIGNED NOT NULL,
  travelers_count INT UNSIGNED NOT NULL,
  travel_style ENUM('Luxury', 'Budget', 'Adventure', 'Family', 'Solo') NOT NULL,
  transportation_preference VARCHAR(160),
  accommodation_type VARCHAR(160),
  special_requirements TEXT,
  generated_plan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5),
  UNIQUE (user_id, trip_id)
);

CREATE INDEX idx_trips_category ON trips(category);
CREATE INDEX idx_trips_location ON trips(location);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_ai_planner_user_id ON ai_planner_requests(user_id);
