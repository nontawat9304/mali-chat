import sys
try:
    import sqlalchemy
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    print("SQLAlchemy is installed.")
except ImportError:
    print("ERROR: SQLAlchemy is NOT installed.")
    sys.exit(1)

try:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./ainote_users_v2.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    print("Database connection successful!")
    # Try to create tables?
    # from models import Base
    # Base.metadata.create_all(bind=engine)
    db.close()
except Exception as e:
    print(f"Database Error: {e}")
