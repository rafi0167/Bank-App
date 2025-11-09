from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# LLM Setup
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    address: str
    nid_number: str
    nid_image: Optional[str] = None  # base64 encoded image
    monthly_income: float
    gender: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    address: str
    nid_number: str
    nid_image: Optional[str] = None
    monthly_income: float
    gender: str
    created_at: datetime

class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    account_number: str
    account_type: str
    balance: float
    created_at: datetime

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    account_id: str
    type: str  # credit, debit
    amount: float
    description: str
    timestamp: datetime

class Loan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    amount: float
    interest_rate: float
    duration_months: int
    status: str  # pending, approved, rejected
    created_at: datetime

class Card(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    card_number: str
    card_type: str  # debit, credit
    expiry_date: str
    cvv: str
    status: str
    created_at: datetime

class KYC(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    status: str  # pending, verified, rejected
    documents: List[str]
    updated_at: datetime

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    position: str
    department: str
    image: str
    email: str
    phone: str

class BankInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    branch: str
    address: str
    phone: str
    email: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "address": user_data.address,
        "nid_number": user_data.nid_number,
        "nid_image": user_data.nid_image,
        "monthly_income": user_data.monthly_income,
        "gender": user_data.gender,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create default account
    account_id = str(uuid.uuid4())
    account_number = f"ACC{str(uuid.uuid4())[:8].upper()}"
    account = {
        "id": account_id,
        "user_id": user_id,
        "account_number": account_number,
        "account_type": "savings",
        "balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.accounts.insert_one(account)
    
    # Create KYC record
    kyc_id = str(uuid.uuid4())
    kyc = {
        "id": kyc_id,
        "user_id": user_id,
        "status": "pending",
        "documents": [user_data.nid_image] if user_data.nid_image else [],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kyc.insert_one(kyc)
    
    # Generate token
    access_token = create_access_token(data={"sub": user_id})
    
    return {"message": "Registration successful", "token": access_token, "user_id": user_id}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {"token": access_token, "user_id": user["id"]}

# User Routes
@api_router.get("/user/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Account Routes
@api_router.get("/accounts")
async def get_accounts(user_id: str = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return accounts

# Transaction Routes
@api_router.get("/transactions")
async def get_transactions(user_id: str = Depends(get_current_user)):
    # Get user's accounts
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    account_ids = [acc["id"] for acc in accounts]
    
    transactions = await db.transactions.find(
        {"account_id": {"$in": account_ids}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    return transactions

@api_router.post("/transactions")
async def create_transaction(transaction_data: dict, user_id: str = Depends(get_current_user)):
    # Verify account belongs to user
    account = await db.accounts.find_one({"id": transaction_data["account_id"], "user_id": user_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transaction_id = str(uuid.uuid4())
    transaction = {
        "id": transaction_id,
        "account_id": transaction_data["account_id"],
        "type": transaction_data["type"],
        "amount": transaction_data["amount"],
        "description": transaction_data.get("description", ""),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction)
    
    # Update account balance
    if transaction_data["type"] == "credit":
        new_balance = account["balance"] + transaction_data["amount"]
    else:
        new_balance = account["balance"] - transaction_data["amount"]
    
    await db.accounts.update_one(
        {"id": transaction_data["account_id"]},
        {"$set": {"balance": new_balance}}
    )
    
    return {"message": "Transaction created", "transaction_id": transaction_id}

# Loan Routes
@api_router.get("/loans")
async def get_loans(user_id: str = Depends(get_current_user)):
    loans = await db.loans.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return loans

@api_router.post("/loans")
async def apply_loan(loan_data: dict, user_id: str = Depends(get_current_user)):
    loan_id = str(uuid.uuid4())
    loan = {
        "id": loan_id,
        "user_id": user_id,
        "amount": loan_data["amount"],
        "interest_rate": loan_data.get("interest_rate", 5.5),
        "duration_months": loan_data["duration_months"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.loans.insert_one(loan)
    return {"message": "Loan application submitted", "loan_id": loan_id}

# Card Routes
@api_router.get("/cards")
async def get_cards(user_id: str = Depends(get_current_user)):
    cards = await db.cards.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return cards

@api_router.post("/cards")
async def request_card(card_data: dict, user_id: str = Depends(get_current_user)):
    card_id = str(uuid.uuid4())
    card_number = f"{''.join([str(uuid.uuid4().int)[:4] for _ in range(4)])}"
    card = {
        "id": card_id,
        "user_id": user_id,
        "card_number": card_number[:16],
        "card_type": card_data.get("card_type", "debit"),
        "expiry_date": card_data.get("expiry_date", "12/28"),
        "cvv": str(uuid.uuid4().int)[:3],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cards.insert_one(card)
    return {"message": "Card created", "card_id": card_id}

# KYC Routes
@api_router.get("/kyc")
async def get_kyc(user_id: str = Depends(get_current_user)):
    kyc = await db.kyc.find_one({"user_id": user_id}, {"_id": 0})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    return kyc

@api_router.put("/kyc")
async def update_kyc(kyc_data: dict, user_id: str = Depends(get_current_user)):
    kyc = await db.kyc.find_one({"user_id": user_id})
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC not found")
    
    update_data = {
        "documents": kyc_data.get("documents", kyc["documents"]),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kyc.update_one({"user_id": user_id}, {"$set": update_data})
    return {"message": "KYC updated successfully"}

# Chat Routes
@api_router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, user_id: str = Depends(get_current_user)):
    try:
        # Initialize LLM chat
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"banking_{user_id}",
            system_message="You are a helpful banking assistant. Help users with their banking queries, account information, and general banking questions. Be professional, friendly, and concise."
        ).with_model("openai", "gpt-5")
        
        # Create user message
        user_message = UserMessage(text=message.message)
        
        # Get response
        response = await chat_client.send_message(user_message)
        
        # Store chat history
        chat_history = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "message": message.message,
            "response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_history)
        
        return ChatResponse(response=response)
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

@api_router.get("/chat/history")
async def get_chat_history(user_id: str = Depends(get_current_user)):
    history = await db.chat_history.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    return history

# Public Routes (no auth required)
@api_router.get("/employees")
async def get_employees():
    employees = await db.employees.find({}, {"_id": 0}).to_list(100)
    return employees

@api_router.get("/bank-info")
async def get_bank_info():
    info = await db.bank_info.find({}, {"_id": 0}).to_list(100)
    return info

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Seed initial data
    emp_count = await db.employees.count_documents({})
    if emp_count == 0:
        employees = [
            {
                "id": str(uuid.uuid4()),
                "name": "Sarah Johnson",
                "position": "Chief Executive Officer",
                "department": "Executive",
                "image": "https://randomuser.me/api/portraits/women/44.jpg",
                "email": "sarah.johnson@bank.com",
                "phone": "+1-555-0101"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Michael Chen",
                "position": "Chief Financial Officer",
                "department": "Finance",
                "image": "https://randomuser.me/api/portraits/men/32.jpg",
                "email": "michael.chen@bank.com",
                "phone": "+1-555-0102"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Emily Rodriguez",
                "position": "Head of Operations",
                "department": "Operations",
                "image": "https://randomuser.me/api/portraits/women/68.jpg",
                "email": "emily.rodriguez@bank.com",
                "phone": "+1-555-0103"
            }
        ]
        await db.employees.insert_many(employees)
    
    bank_count = await db.bank_info.count_documents({})
    if bank_count == 0:
        bank_info = [
            {
                "id": str(uuid.uuid4()),
                "name": "SecureBank Main Branch",
                "branch": "Downtown",
                "address": "123 Financial District, New York, NY 10004",
                "phone": "+1-555-BANK-001",
                "email": "downtown@securebank.com"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SecureBank Uptown Branch",
                "branch": "Uptown",
                "address": "456 Madison Avenue, New York, NY 10022",
                "phone": "+1-555-BANK-002",
                "email": "uptown@securebank.com"
            }
        ]
        await db.bank_info.insert_many(bank_info)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()