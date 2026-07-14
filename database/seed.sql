USE voyageiq;

INSERT INTO trips (
  slug,
  name,
  category,
  location,
  duration_days,
  duration_nights,
  price_paise,
  rating,
  image_url,
  short_description,
  full_description,
  is_featured
) VALUES
(
  'bali-coastal-escape',
  'Bali Coastal Escape',
  'Beach',
  'Bali, Indonesia',
  6,
  5,
  12200000,
  4.9,
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'A relaxed island journey with ocean-view stays, temple visits, beach clubs, waterfall stops, and a private sunset dinner.',
  'A relaxed island journey with ocean-view stays, temple visits, beach clubs, waterfall stops, and a private sunset dinner.',
  TRUE
),
(
  'swiss-alpine-retreat',
  'Swiss Alpine Retreat',
  'Mountains',
  'Interlaken, Switzerland',
  7,
  6,
  19500000,
  4.8,
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'A scenic mountain escape with lake cruises, alpine train rides, guided hikes, and cozy chalet evenings.',
  'A scenic mountain escape with lake cruises, alpine train rides, guided hikes, and cozy chalet evenings.',
  TRUE
),
(
  'costa-rica-adventure',
  'Costa Rica Adventure',
  'Adventure',
  'Arenal and Monteverde',
  8,
  7,
  15900000,
  4.7,
  'https://images.unsplash.com/photo-1518182170546-07661fd94144?auto=format&fit=crop&w=1200&q=80',
  'An active rainforest route with volcano views, ziplining, hot springs, hanging bridges, and wildlife-focused guides.',
  'An active rainforest route with volcano views, ziplining, hot springs, hanging bridges, and wildlife-focused guides.',
  TRUE
),
(
  'orlando-family-magic',
  'Orlando Family Magic',
  'Family',
  'Florida, United States',
  5,
  4,
  10400000,
  4.6,
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'A smooth family vacation with theme-park planning, resort pools, character meals, and flexible downtime built in.',
  'A smooth family vacation with theme-park planning, resort pools, character meals, and flexible downtime built in.',
  FALSE
),
(
  'maldives-honeymoon',
  'Maldives Honeymoon',
  'Honeymoon',
  'North Male Atoll, Maldives',
  6,
  5,
  25700000,
  5.0,
  'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  'A romantic overwater villa stay with lagoon snorkeling, floating breakfast, spa rituals, and candlelit dining.',
  'A romantic overwater villa stay with lagoon snorkeling, floating breakfast, spa rituals, and candlelit dining.',
  TRUE
),
(
  'kyoto-culture-trail',
  'Kyoto Culture Trail',
  'Family',
  'Kyoto, Japan',
  7,
  6,
  16900000,
  4.8,
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  'A culture-rich city break with temples, tea ceremonies, food lanes, bamboo groves, and easy rail connections.',
  'A culture-rich city break with temples, tea ceremonies, food lanes, bamboo groves, and easy rail connections.',
  FALSE
);

INSERT INTO trip_inclusions (trip_id, inclusion_name)
SELECT id, 'Hotel' FROM trips
UNION ALL SELECT id, 'Food' FROM trips
UNION ALL SELECT id, 'Transport' FROM trips
UNION ALL SELECT id, 'Guide' FROM trips;

INSERT INTO trip_highlights (trip_id, highlight_text, sort_order)
SELECT id, 'Curated organizer itinerary', 1 FROM trips
UNION ALL SELECT id, 'Comfortable stays and transfers', 2 FROM trips
UNION ALL SELECT id, 'Local experiences and guided visits', 3 FROM trips
UNION ALL SELECT id, 'Balanced sightseeing and free time', 4 FROM trips;

INSERT INTO trip_itinerary_days (trip_id, day_number, title, description)
SELECT id, 1, 'Arrival and welcome', 'Arrive at the destination, check in, and enjoy a relaxed welcome experience.' FROM trips
UNION ALL SELECT id, 2, 'Signature sightseeing', 'Explore the most iconic attractions with an experienced local guide.' FROM trips
UNION ALL SELECT id, 3, 'Local culture and food', 'Enjoy neighborhood experiences, regional cuisine, and time for shopping.' FROM trips
UNION ALL SELECT id, 4, 'Flexible exploration', 'Choose optional activities or enjoy built-in downtime at your stay.' FROM trips
UNION ALL SELECT id, 5, 'Departure support', 'Wrap up the trip with breakfast and an organized airport or station transfer.' FROM trips;
