import os
import re
from datetime import date, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from database import get_db_connection
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_payload
)

app = FastAPI(title="VoyageIQ API", version="1.0.0")

# Enable CORS for direct local testing, although requests will primarily go through Vite proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to format price in paise to INR string
def format_inr(price_paise: int) -> str:
    rupees = price_paise // 100
    s = str(rupees)
    if len(s) <= 3:
        return f"₹{s}"
    last_three = s[-3:]
    remaining = s[:-3]
    groups = []
    while remaining:
        groups.append(remaining[-2:])
        remaining = remaining[:-2]
    groups.reverse()
    return f"₹{','.join(groups)},{last_three}"

# Pydantic Schemas
class RegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "traveler"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class BookingCreateSchema(BaseModel):
    trip_id: int
    travel_date: str  # YYYY-MM-DD
    travelers_count: int = Field(1, ge=1)
    special_requests: Optional[str] = None

class AIPlannerSchema(BaseModel):
    destination: str = Field(..., min_length=2)
    budget: str  # e.g., "1,50,000" or numeric string
    number_of_days: int = Field(..., ge=1)
    travelers_count: int = Field(..., ge=1)
    travel_style: str  # 'Luxury', 'Budget', 'Adventure', 'Family', 'Solo'
    transportation_preference: Optional[str] = None
    accommodation_type: Optional[str] = None
    special_requirements: Optional[str] = None

class TripCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str  # Beach, Mountains, Adventure, Family, Honeymoon
    location: str = Field(..., min_length=2, max_length=150)
    duration_days: int = Field(..., ge=1)
    duration_nights: int = Field(..., ge=0)
    price_rupees: int = Field(..., ge=0)
    image_url: str = Field(..., min_length=10)
    short_description: str = Field(..., min_length=10, max_length=500)
    full_description: str = Field(..., min_length=10)
    inclusions: List[str] = []
    highlights: List[str] = []
    itinerary: List[str] = []

# --- AUTH ROUTES ---

@app.post("/api/auth/register")
def register_user(payload: RegisterSchema):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists."
                )
            
            # Hash password and insert
            pwd_hash = hash_password(payload.password)
            user_role = payload.role if payload.role in ['traveler', 'organizer', 'admin'] else 'traveler'
            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                (payload.name, payload.email, pwd_hash, user_role)
            )
            user_id = cursor.lastrowid
            
            # Generate JWT token
            token = create_access_token({"sub": str(user_id), "email": payload.email, "name": payload.name, "role": user_role})
            
            return {
                "token": token,
                "user": {
                    "id": user_id,
                    "name": payload.name,
                    "email": payload.email,
                    "role": user_role
                }
            }
    finally:
        conn.close()

@app.post("/api/auth/login")
def login_user(payload: LoginSchema):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, full_name, email, password_hash FROM users WHERE email = %s",
                (payload.email,)
            )
            user = cursor.fetchone()
            if not user or not verify_password(payload.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Please check your email and password."
                )
            
            # Generate JWT
            token = create_access_token({"sub": str(user["id"]), "email": user["email"], "name": user["full_name"]})
            
            return {
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["full_name"],
                    "email": user["email"]
                }
            }
    finally:
        conn.close()

@app.get("/api/auth/me")
def get_me(user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, full_name, email, phone, role FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return {
                "id": user["id"],
                "name": user["full_name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
            }
    finally:
        conn.close()


# --- TRIPS ROUTES ---

@app.get("/api/trips")
def get_trips(category: Optional[str] = None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if category and category != "All":
                category_cleaned = category.strip().capitalize()
                cursor.execute(
                    "SELECT id, slug, name, category, location, duration_days, duration_nights, price_paise, rating, image_url, short_description FROM trips WHERE is_active = TRUE AND category = %s",
                    (category_cleaned,)
                )
            else:
                cursor.execute(
                    "SELECT id, slug, name, category, location, duration_days, duration_nights, price_paise, rating, image_url, short_description FROM trips WHERE is_active = TRUE"
                )
            
            db_trips = cursor.fetchall()
            
            # Map database schema to React Frontend structure
            trips_list = []
            for t in db_trips:
                trips_list.append({
                    "id": t["slug"],  # React uses slug as the id path param
                    "db_id": t["id"], # Keep numerical ID for DB relations
                    "name": t["name"],
                    "category": t["category"],
                    "location": t["location"],
                    "duration": f"{t['duration_days']} days / {t['duration_nights']} nights",
                    "price": format_inr(t["price_paise"]),
                    "rating": str(t["rating"]),
                    "image": t["image_url"],
                    "description": t["short_description"]
                })
            return trips_list
    finally:
        conn.close()


@app.post("/api/trips")
def create_trip(payload: TripCreateSchema, user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Verify organizer / admin role
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if not user or user["role"] not in ["organizer", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only organizers or administrators can create trip packages."
                )
            
            # Generate unique slug
            base_slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
            slug = base_slug
            counter = 1
            while True:
                cursor.execute("SELECT id FROM trips WHERE slug = %s", (slug,))
                if not cursor.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1

            # Convert price to paise
            price_paise = payload.price_rupees * 100

            # Insert into trips table
            cursor.execute(
                """
                INSERT INTO trips (slug, name, category, location, duration_days, duration_nights, price_paise, image_url, short_description, full_description, is_featured, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE, TRUE)
                """,
                (slug, payload.name, payload.category, payload.location, payload.duration_days, payload.duration_nights, price_paise, payload.image_url, payload.short_description, payload.full_description)
            )
            trip_id = cursor.lastrowid

            # Insert inclusions
            for inc in payload.inclusions:
                if inc.strip():
                    cursor.execute(
                        "INSERT INTO trip_inclusions (trip_id, inclusion_name) VALUES (%s, %s)",
                        (trip_id, inc.strip())
                    )

            # Insert highlights
            for idx, hl in enumerate(payload.highlights):
                if hl.strip():
                    cursor.execute(
                        "INSERT INTO trip_highlights (trip_id, highlight_text, sort_order) VALUES (%s, %s, %s)",
                        (trip_id, hl.strip(), idx + 1)
                    )

            # Insert itinerary days
            for idx, day_desc in enumerate(payload.itinerary):
                if day_desc.strip():
                    day_num = idx + 1
                    cursor.execute(
                        "INSERT INTO trip_itinerary_days (trip_id, day_number, title, description) VALUES (%s, %s, %s, %s)",
                        (trip_id, day_num, f"Day {day_num}", day_desc.strip())
                    )

            return {
                "ok": True,
                "trip_id": trip_id,
                "slug": slug,
                "name": payload.name
            }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create trip package: {str(e)}"
        )
    finally:
        conn.close()


@app.get("/api/trips/{slug}")
def get_trip_details(slug: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch trip
            cursor.execute("SELECT * FROM trips WHERE slug = %s AND is_active = TRUE", (slug,))
            trip = cursor.fetchone()
            if not trip:
                raise HTTPException(status_code=404, detail="Trip package not found")
            
            trip_id = trip["id"]
            
            # 2. Fetch gallery
            cursor.execute("SELECT image_url FROM trip_gallery WHERE trip_id = %s ORDER BY sort_order ASC", (trip_id,))
            gallery = [row["image_url"] for row in cursor.fetchall()]
            if not gallery:
                gallery = [trip["image_url"]]
            
            # 3. Fetch highlights
            cursor.execute("SELECT highlight_text FROM trip_highlights WHERE trip_id = %s ORDER BY sort_order ASC", (trip_id,))
            highlights = [row["highlight_text"] for row in cursor.fetchall()]
            
            # 4. Fetch itinerary
            cursor.execute("SELECT description FROM trip_itinerary_days WHERE trip_id = %s ORDER BY day_number ASC", (trip_id,))
            itinerary = [row["description"] for row in cursor.fetchall()]
            
            # 5. Fetch inclusions
            cursor.execute("SELECT inclusion_name FROM trip_inclusions WHERE trip_id = %s", (trip_id,))
            inclusions = [row["inclusion_name"] for row in cursor.fetchall()]
            
            # Return mapped data
            return {
                "id": trip["slug"],
                "db_id": trip["id"],
                "name": trip["name"],
                "category": trip["category"],
                "location": trip["location"],
                "duration": f"{trip['duration_days']} days / {trip['duration_nights']} nights",
                "price": format_inr(trip["price_paise"]),
                "rating": str(trip["rating"]),
                "image": trip["image_url"],
                "gallery": gallery,
                "description": trip["full_description"],
                "highlights": highlights,
                "itinerary": itinerary,
                "inclusions": inclusions
            }
    finally:
        conn.close()


# --- BOOKING ROUTES ---

@app.post("/api/bookings")
def create_booking(payload: BookingCreateSchema, user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Get trip price
            cursor.execute("SELECT id, price_paise, name FROM trips WHERE id = %s", (payload.trip_id,))
            trip = cursor.fetchone()
            if not trip:
                raise HTTPException(status_code=404, detail="Trip not found")
            
            total_price = trip["price_paise"] * payload.travelers_count
            
            # Insert booking
            cursor.execute(
                """
                INSERT INTO bookings (user_id, trip_id, travel_date, travelers_count, total_price_paise, status, special_requests)
                VALUES (%s, %s, %s, %s, %s, 'confirmed', %s)
                """,
                (user_id, payload.trip_id, payload.travel_date, payload.travelers_count, total_price, payload.special_requests)
            )
            booking_id = cursor.lastrowid
            
            return {
                "ok": True,
                "booking_id": booking_id,
                "trip_name": trip["name"],
                "total_price": format_inr(total_price),
                "status": "confirmed"
            }
    finally:
        conn.close()

@app.get("/api/bookings")
def get_user_bookings(user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check user role
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user_role_res = cursor.fetchone()
            role = user_role_res["role"] if user_role_res else "traveler"
            
            if role in ["organizer", "admin"]:
                cursor.execute(
                    """
                    SELECT b.id, b.travel_date, b.travelers_count, b.total_price_paise, b.status, b.special_requests,
                           t.name as trip_name, t.location as trip_location, t.image_url as trip_image, t.slug as trip_slug,
                           u.full_name as user_name, u.email as user_email
                    FROM bookings b
                    JOIN trips t ON b.trip_id = t.id
                    JOIN users u ON b.user_id = u.id
                    ORDER BY b.created_at DESC
                    """
                )
            else:
                cursor.execute(
                    """
                    SELECT b.id, b.travel_date, b.travelers_count, b.total_price_paise, b.status, b.special_requests,
                           t.name as trip_name, t.location as trip_location, t.image_url as trip_image, t.slug as trip_slug,
                           u.full_name as user_name, u.email as user_email
                    FROM bookings b
                    JOIN trips t ON b.trip_id = t.id
                    JOIN users u ON b.user_id = u.id
                    WHERE b.user_id = %s
                    ORDER BY b.created_at DESC
                    """,
                    (user_id,)
                )
            bookings = cursor.fetchall()
            
            result = []
            for b in bookings:
                result.append({
                    "id": b["id"],
                    "travel_date": b["travel_date"].strftime("%b %d, %Y") if isinstance(b["travel_date"], (date, datetime)) else str(b["travel_date"]),
                    "travelers_count": b["travelers_count"],
                    "total_price": format_inr(b["total_price_paise"]),
                    "status": b["status"].capitalize(),
                    "special_requests": b["special_requests"],
                    "user_name": b["user_name"],
                    "user_email": b["user_email"],
                    "trip": {
                        "slug": b["trip_slug"],
                        "name": b["trip_name"],
                        "location": b["trip_location"],
                        "image": b["trip_image"]
                    }
                })
            return result
    finally:
        conn.close()


# --- AI PLANNER ROUTES ---

@app.post("/api/ai-planner")
def generate_ai_plan(payload: AIPlannerSchema, user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    
    # 1. Standardize budget string into number of paise
    clean_budget_str = re.sub(r"[^\d]", "", payload.budget)
    budget_rupees = int(clean_budget_str) if clean_budget_str else 100000
    budget_paise = budget_rupees * 100
    
    # 2. Generate a custom, personalized itinerary based on client request parameters
    dest = payload.destination.strip().title()
    style = payload.travel_style.strip().capitalize()
    days = payload.number_of_days
    acc = payload.accommodation_type or "Boutique stays"
    trans = payload.transportation_preference or "Private car"
    reqs = payload.special_requirements or "None specified"
    
    # Simple yet descriptive generator to "wow" the user
    itinerary_days = []
    
    # Day 1: Arrival
    itinerary_days.append(
        f"Day 1: Welcome to {dest}! Arrive and transfer to your accommodations at {acc}. Spend a relaxed evening settling in and taking a gentle walk around the neighborhood to orient yourself."
    )
    
    # Intermediate days
    activities = {
        "Luxury": [
            "Enjoy a private guided culinary and culture walk, exploring hidden gems and sampling fine local delicacies.",
            "Indulge in a premium sightseeing excursion with VIP entries, followed by a luxury sunset cruise and champagne toast.",
            "Take part in a private workshop with a master artisan or spend a relaxing morning at a top-rated local spa.",
            "Embark on a customized private tour of natural reserves or historical landmarks with an expert local host."
        ],
        "Budget": [
            "Explore major sights on a self-guided walking tour, capturing beautiful viewpoints and stopping at local food stalls.",
            "Take local public transit to visit historic sites, neighborhood parks, and free public museums.",
            "Join a group walking route or spend a leisurely day exploring local markets and artisan crafts.",
            "Hike scenic trails or rent local bikes to traverse the countryside at your own pace."
        ],
        "Adventure": [
            "Embark on an active trek or guided wilderness hike to discover waterfalls, viewpoints, and local flora.",
            "Participate in an exciting outdoor activity like river rafting, zip-lining, or reef snorkeling with safety briefings.",
            "Spend the day exploring off-road trails or navigating complex mountain or forest paths with local guides.",
            "Rent specialized gear (kayaks, surfboards, or mountain bikes) for an independent day of exploration."
        ],
        "Family": [
            "Visit a popular local theme park, interactive museum, or animal reserve suited for all generations.",
            "Enjoy a family picnic at a scenic lake or beach, with options for light water sports and beach volleyball.",
            "Take an easy family-friendly walking trail, stopping for snacks, photos, and local ice cream.",
            "Join an interactive family craft workshop or embark on a gentle boat tour of local waterways."
        ],
        "Solo": [
            "Join a social group walking tour to meet other travelers, followed by dinner in a vibrant food court.",
            "Spend a quiet day journaling at a local café, visiting art museums, and reading in historical libraries.",
            "Rent a scooter or walk the local paths to find tranquil parks and lesser-known historical alleys.",
            "Join a shared group activity (like a cooking class or group hike) to mingle and share travel stories."
        ]
    }
    
    # Select activity list
    act_list = activities.get(style, activities["Solo"])
    
    for d in range(2, days):
        act_index = (d - 2) % len(act_list)
        itinerary_days.append(f"Day {d}: {act_list[act_index]}")
    
    # Second to last day (Leisure)
    if days >= 3:
        itinerary_days.append(
            f"Day {days-1}: A flexible day of leisure in {dest}. Revisit your favorite local spots, shop for souvenirs, and enjoy a special dinner to celebrate your journey."
        )
    
    # Last day: Departure
    if days >= 2:
        itinerary_days.append(
            f"Day {days}: Final morning for packing and enjoying a local breakfast. Check out of {acc} and take a pre-arranged transfer via {trans} to the airport for your flight home."
        )
    
    generated_plan_text = f"### Personalized {style} Plan for {dest} ({days} Days)\n\n"
    generated_plan_text += f"**Stays:** {acc} | **Transit:** {trans}\n"
    if payload.special_requirements:
        generated_plan_text += f"**Special Accommodations:** {reqs}\n\n"
    else:
        generated_plan_text += "\n"
    
    generated_plan_text += "#### Day-by-Day Itinerary\n"
    for day_text in itinerary_days:
        generated_plan_text += f"- {day_text}\n"
        
    # 3. Store in database
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ai_planner_requests 
                (user_id, destination, budget_paise, number_of_days, travelers_count, travel_style, transportation_preference, accommodation_type, special_requirements, generated_plan)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, dest, budget_paise, days, payload.travelers_count, style, trans, acc, payload.special_requirements, generated_plan_text)
            )
            request_id = cursor.lastrowid
            
            return {
                "id": request_id,
                "destination": dest,
                "style": style,
                "days": days,
                "itinerary": generated_plan_text
            }
    finally:
        conn.close()

@app.get("/api/ai-planner")
def get_user_plans(user_payload: dict = Depends(get_current_user_payload)):
    user_id = int(user_payload["sub"])
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check user role
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user_role_res = cursor.fetchone()
            role = user_role_res["role"] if user_role_res else "traveler"
            
            if role in ["organizer", "admin"]:
                cursor.execute(
                    """
                    SELECT r.id, r.destination, r.budget_paise, r.number_of_days, r.travelers_count, r.travel_style, r.transportation_preference, r.accommodation_type, r.special_requirements, r.generated_plan, r.created_at,
                           u.full_name as user_name, u.email as user_email
                    FROM ai_planner_requests r
                    JOIN users u ON r.user_id = u.id
                    ORDER BY r.created_at DESC
                    """
                )
            else:
                cursor.execute(
                    """
                    SELECT r.id, r.destination, r.budget_paise, r.number_of_days, r.travelers_count, r.travel_style, r.transportation_preference, r.accommodation_type, r.special_requirements, r.generated_plan, r.created_at,
                           u.full_name as user_name, u.email as user_email
                    FROM ai_planner_requests r
                    JOIN users u ON r.user_id = u.id
                    WHERE r.user_id = %s
                    ORDER BY r.created_at DESC
                    """,
                    (user_id,)
                )
            plans = cursor.fetchall()
            
            result = []
            for p in plans:
                result.append({
                    "id": p["id"],
                    "destination": p["destination"],
                    "budget": format_inr(p["budget_paise"]),
                    "days": p["number_of_days"],
                    "travelers": p["travelers_count"],
                    "style": p["travel_style"],
                    "transportation": p["transportation_preference"],
                    "accommodation": p["accommodation_type"],
                    "requirements": p["special_requirements"],
                    "plan": p["generated_plan"],
                    "user_name": p["user_name"],
                    "user_email": p["user_email"],
                    "created_at": p["created_at"].strftime("%b %d, %Y %I:%M %p") if isinstance(p["created_at"], (date, datetime)) else str(p["created_at"])
                })
            return result
    finally:
        conn.close()
