import os
import re
from pathlib import Path
from datetime import date, datetime
import pymysql
import pymysql.cursors
import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# Load environment variables
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="VoyageIQ Private Organizer Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "voyageiq_super_secret_jwt_key_987654321_abcdef")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
security = HTTPBearer()

def get_db_connection():
    """Creates a database connection."""
    try:
        return pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "voyageiq"),
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

# Helper to verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# Token helpers
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    return decode_token(token)

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

# Helper to format timestamps and decimals
def clean_row(row):
    if not row:
        return row
    new_row = {}
    for k, v in row.items():
        if isinstance(v, (datetime, date)):
            new_row[k] = v.isoformat()
        elif isinstance(v, float) or hasattr(v, 'as_integer_ratio'):
            new_row[k] = float(v)
        else:
            new_row[k] = v
    return new_row

def clean_rows(rows):
    return [clean_row(row) for row in rows]

# Pydantic Schemas
class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class TripCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str
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

# --- PRIVATE LOGIN ROUTE ---
@app.post("/api/auth/login")
def login_admin(payload: LoginSchema):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, full_name, email, password_hash, role FROM users WHERE email = %s",
                (payload.email,)
            )
            user = cursor.fetchone()
            if not user or not verify_password(payload.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Please check your email and password."
                )
            
            # Verify role is organizer or admin
            if user["role"] not in ["organizer", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access Denied: Organizer or Administrator privileges required."
                )
            
            # Generate JWT containing role
            token = jwt.encode(
                {
                    "sub": str(user["id"]),
                    "email": user["email"],
                    "name": user["full_name"],
                    "role": user["role"]
                },
                SECRET_KEY,
                algorithm=ALGORITHM
            )
            
            return {
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["full_name"],
                    "email": user["email"],
                    "role": user["role"]
                }
            }
    finally:
        conn.close()

# --- ANALYTICS ROUTERS ---
@app.get("/api/analytics/overview")
def get_overview(user_payload: dict = Depends(get_current_user_payload)):
    if user_payload["role"] not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Total revenue (sum of total_price_paise for confirmed/completed bookings)
            cursor.execute("""
                SELECT SUM(total_price_paise) as total_rev 
                FROM bookings 
                WHERE status IN ('confirmed', 'completed')
            """)
            rev_res = cursor.fetchone()
            total_revenue = float(rev_res["total_rev"] or 0) / 100.0

            # 2. Total Bookings count
            cursor.execute("SELECT COUNT(*) as count FROM bookings")
            bookings_count = cursor.fetchone()["count"]

            # 3. Booking Status breakdown
            cursor.execute("SELECT status, COUNT(*) as count FROM bookings GROUP BY status")
            booking_status = {row["status"]: row["count"] for row in cursor.fetchall()}

            # 4. Total Users count
            cursor.execute("SELECT COUNT(*) as count FROM users")
            users_count = cursor.fetchone()["count"]

            # 5. User Roles breakdown
            cursor.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role")
            user_roles = {row["role"]: row["count"] for row in cursor.fetchall()}

            # 6. Trips metrics
            cursor.execute("SELECT COUNT(*) as count FROM trips")
            trips_count = cursor.fetchone()["count"]
            cursor.execute("SELECT COUNT(*) as count FROM trips WHERE is_active = TRUE")
            active_trips = cursor.fetchone()["count"]

            # 7. Avg Rating
            cursor.execute("SELECT AVG(rating) as avg_rating FROM reviews")
            rating_res = cursor.fetchone()
            avg_rating = float(rating_res["avg_rating"]) if rating_res and rating_res["avg_rating"] is not None else 0.0

            # 8. AI Plans
            cursor.execute("SELECT COUNT(*) as count FROM ai_planner_requests")
            ai_plans_count = cursor.fetchone()["count"]

            return {
                "total_revenue": total_revenue,
                "total_bookings": bookings_count,
                "booking_status_breakdown": booking_status,
                "total_users": users_count,
                "user_roles_breakdown": user_roles,
                "total_trips": trips_count,
                "active_trips": active_trips,
                "avg_rating": round(avg_rating, 2),
                "total_ai_plans": ai_plans_count
            }
    finally:
        conn.close()

@app.get("/api/analytics/charts")
def get_charts(user_payload: dict = Depends(get_current_user_payload)):
    if user_payload["role"] not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Booking Trends
            cursor.execute("""
                SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
                       COUNT(*) as count, 
                       SUM(total_price_paise) as revenue_paise
                FROM bookings
                WHERE status IN ('confirmed', 'completed')
                GROUP BY month
                ORDER BY month ASC
                LIMIT 12
            """)
            trends = cursor.fetchall()
            booking_trends = [
                {
                    "month": t["month"],
                    "bookings": t["count"],
                    "revenue": float(t["revenue_paise"] or 0) / 100.0
                }
                for t in trends
            ]

            # 2. Revenue by Category
            cursor.execute("""
                SELECT t.category, 
                       COUNT(b.id) as bookings_count, 
                       SUM(b.total_price_paise) as revenue_paise
                FROM bookings b
                JOIN trips t ON b.trip_id = t.id
                WHERE b.status IN ('confirmed', 'completed')
                GROUP BY t.category
            """)
            categories = cursor.fetchall()
            category_revenue = [
                {
                    "category": c["category"],
                    "bookings": c["bookings_count"],
                    "revenue": float(c["revenue_paise"] or 0) / 100.0
                }
                for c in categories
            ]

            # 3. AI Travel Styles
            cursor.execute("""
                SELECT travel_style as style, COUNT(*) as count 
                FROM ai_planner_requests 
                GROUP BY travel_style
                ORDER BY count DESC
            """)
            styles = cursor.fetchall()
            ai_styles = [{"style": s["style"], "count": s["count"]} for s in styles]

            # 4. Popular Destinations
            cursor.execute("""
                SELECT destination, COUNT(*) as count 
                FROM ai_planner_requests 
                GROUP BY destination 
                ORDER BY count DESC 
                LIMIT 5
            """)
            dests = cursor.fetchall()
            popular_destinations = [{"destination": d["destination"], "count": d["count"]} for d in dests]

            return {
                "booking_trends": booking_trends,
                "category_revenue": category_revenue,
                "ai_styles": ai_styles,
                "popular_destinations": popular_destinations
            }
    finally:
        conn.close()

@app.get("/api/analytics/tables")
def get_tables(user_payload: dict = Depends(get_current_user_payload)):
    if user_payload["role"] not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Bookings Table
            cursor.execute("""
                SELECT b.id, u.full_name as user_name, u.email as user_email, 
                       t.name as trip_name, t.location as trip_location,
                       b.travel_date, b.travelers_count, b.total_price_paise, 
                       b.status, b.created_at
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN trips t ON b.trip_id = t.id
                ORDER BY b.created_at DESC
            """)
            bookings = cursor.fetchall()
            cleaned_bookings = []
            for b in bookings:
                row = clean_row(b)
                row["total_price"] = float(b["total_price_paise"] or 0) / 100.0
                del row["total_price_paise"]
                cleaned_bookings.append(row)

            # 2. Users Table
            cursor.execute("""
                SELECT id, full_name as name, email, phone, role, created_at 
                FROM users 
                ORDER BY created_at DESC
            """)
            users = clean_rows(cursor.fetchall())

            # 3. Trips Table (including counts & revenues)
            cursor.execute("""
                SELECT t.id, t.name, t.category, t.location, t.duration_days, 
                       t.duration_nights, t.price_paise, t.is_active, t.is_featured,
                       COUNT(b.id) as bookings_count,
                       COALESCE(SUM(b.total_price_paise), 0) as total_revenue_paise,
                       COALESCE(AVG(r.rating), 0) as avg_rating
                FROM trips t
                LEFT JOIN bookings b ON t.id = b.trip_id AND b.status IN ('confirmed', 'completed')
                LEFT JOIN reviews r ON t.id = r.trip_id
                GROUP BY t.id, t.name, t.category, t.location, t.duration_days, 
                         t.duration_nights, t.price_paise, t.is_active, t.is_featured
                ORDER BY bookings_count DESC
            """)
            trips = cursor.fetchall()
            cleaned_trips = []
            for tr in trips:
                row = clean_row(tr)
                row["price"] = float(tr["price_paise"] or 0) / 100.0
                row["total_revenue"] = float(tr["total_revenue_paise"] or 0) / 100.0
                row["avg_rating"] = float(round(tr["avg_rating"], 1))
                del row["price_paise"]
                del row["total_revenue_paise"]
                cleaned_trips.append(row)

            # 4. AI Planner Table
            cursor.execute("""
                SELECT r.id, u.full_name as user_name, u.email as user_email,
                       r.destination, r.budget_paise, r.number_of_days, 
                       r.travelers_count, r.travel_style, r.created_at, r.generated_plan
                FROM ai_planner_requests r
                JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC
            """)
            ai_plans = cursor.fetchall()
            cleaned_ai_plans = []
            for p in ai_plans:
                row = clean_row(p)
                row["budget"] = float(p["budget_paise"] or 0) / 100.0
                del row["budget_paise"]
                cleaned_ai_plans.append(row)

            # 5. Reviews Table
            cursor.execute("""
                SELECT r.id, u.full_name as user_name, u.email as user_email,
                       t.name as trip_name, r.rating, r.review_text, r.created_at
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN trips t ON r.trip_id = t.id
                ORDER BY r.created_at DESC
            """)
            reviews = clean_rows(cursor.fetchall())

            return {
                "bookings": cleaned_bookings,
                "users": users,
                "trips": cleaned_trips,
                "ai_plans": cleaned_ai_plans,
                "reviews": reviews
            }
    finally:
        conn.close()

# --- PRIVATE TRIP CREATION ROUTE ---
@app.post("/api/trips")
def create_trip(payload: TripCreateSchema, user_payload: dict = Depends(get_current_user_payload)):
    if user_payload["role"] not in ["organizer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Organizer or Administrator privileges required."
        )
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create trip package: {str(e)}"
        )
    finally:
        conn.close()

# Static files hosting configuration
static_dir = Path(__file__).resolve().parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    def index():
        return {"message": "Please create the static directory and index.html"}
