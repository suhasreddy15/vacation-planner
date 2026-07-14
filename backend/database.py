import os
from pathlib import Path
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

# Resolve the absolute path to the .env file in the backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

def get_db_connection():
    """
    Creates and returns a new MySQL database connection using credentials from environmental variables.
    It uses DictCursor so that results are returned as dictionaries instead of tuples.
    """
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "voyageiq"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
