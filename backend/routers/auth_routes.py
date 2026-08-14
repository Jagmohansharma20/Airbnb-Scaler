import sqlite3
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
from schemas import UserSignup, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(user_data: UserSignup, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (user_data.email.strip(),))
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    pwd_hash = hash_password(user_data.password)
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, phone, is_host) VALUES (?, ?, ?, ?, 0)",
        (user_data.name.strip(), user_data.email.strip().lower(), pwd_hash, user_data.phone)
    )
    db.commit()
    user_id = cursor.lastrowid

    cursor.execute("SELECT id, name, email, phone, is_host, created_at FROM users WHERE id = ?", (user_id,))
    new_user = dict(cursor.fetchone())
    new_user["is_host"] = bool(new_user.get("is_host", 0))

    token = create_access_token(data={"sub": str(user_id), "email": new_user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (login_data.email.strip(),))
    user = cursor.fetchone()
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user_dict = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "is_host": bool(user["is_host"] if "is_host" in user.keys() else 0),
        "created_at": user["created_at"]
    }
    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout():
    return {"message": "Logout successful"}
