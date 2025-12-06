from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'user'
    status = db.Column(db.String(20), default='active')  # 'active' or 'inactive'
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Membership(db.Model):
    __tablename__ = 'memberships'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_number = db.Column(db.String(50), unique=True, nullable=False)
    member_name = db.Column(db.String(100), nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    contact_address = db.Column(db.Text, nullable=False)
    aadhar_card = db.Column(db.String(12), unique=True, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='active')
    amount_pending = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Item(db.Model):
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    serial_no = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    item_type = db.Column(db.String(20))  # 'book' or 'movie'
    status = db.Column(db.String(20), default='available')  # 'available', 'issued', 'lost'
    cost = db.Column(db.Float)
    procurement_date = db.Column(db.Date)
    quantity = db.Column(db.Integer, default=1)
    available_copies = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_id = db.Column(db.Integer, db.ForeignKey('memberships.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date)
    fine_amount = db.Column(db.Float, default=0.0)
    fine_paid = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # 'active', 'returned', 'overdue'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    membership = db.relationship('Membership', backref='transactions')
    item = db.relationship('Item', backref='transactions')

class IssueRequest(db.Model):
    __tablename__ = 'issue_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_id = db.Column(db.Integer, db.ForeignKey('memberships.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    requested_date = db.Column(db.Date, nullable=False)
    request_fulfilled_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'fulfilled', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FinePayment(db.Model):
    __tablename__ = 'fine_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_id = db.Column(db.Integer, db.ForeignKey('memberships.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)