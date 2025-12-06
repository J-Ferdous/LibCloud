from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from database import db, User, Membership, Item, Transaction, IssueRequest, FinePayment
from datetime import datetime, timedelta
import hashlib
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Password hashing
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Initialize database
with app.app_context():
    db.create_all()
    # Create default admin and user if they don't exist
    if not User.query.filter_by(username='adm').first():
        admin = User(
            username='adm',
            password=hash_password('adm'),
            name='Administrator',
            role='admin',
            is_admin=True,
            status='active'
        )
        db.session.add(admin)
    
    if not User.query.filter_by(username='user').first():
        user = User(
            username='user',
            password=hash_password('user'),
            name='Regular User',
            role='user',
            is_admin=False,
            status='active'
        )
        db.session.add(user)
    
    db.session.commit()

# Routes
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.password == hash_password(password):
            if user.status == 'active':
                login_user(user)
                if user.is_admin:
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('user_dashboard'))
            else:
                return render_template('login.html', error='Account is inactive')
        else:
            return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        return redirect(url_for('user_dashboard'))
    
    # Get statistics for dashboard
    total_books = Item.query.filter_by(item_type='book').count()
    total_movies = Item.query.filter_by(item_type='movie').count()
    total_members = Membership.query.count()
    active_issues = Transaction.query.filter_by(status='active').count()
    
    return render_template('admin_dashboard.html',
                         total_books=total_books,
                         total_movies=total_movies,
                         total_members=total_members,
                         active_issues=active_issues)

@app.route('/user/dashboard')
@login_required
def user_dashboard():
    # Get user's active issues
    # In a real app, you'd link memberships to users
    active_issues = Transaction.query.filter_by(status='active').limit(5).all()
    
    return render_template('user_dashboard.html', active_issues=active_issues)

# Maintenance Routes
@app.route('/maintenance')
@login_required
def maintenance():
    if not current_user.is_admin:
        return redirect(url_for('user_dashboard'))
    return render_template('maintenance.html')

# Membership Management
@app.route('/api/memberships', methods=['POST'])
@login_required
def add_membership():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    duration = data.get('duration', '6')
    
    # Calculate end date based on duration
    start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
    if duration == '6':
        end_date = start_date + timedelta(days=180)
    elif duration == '12':
        end_date = start_date + timedelta(days=365)
    else:  # 24 months
        end_date = start_date + timedelta(days=730)
    
    membership = Membership(
        membership_number=data['membership_number'],
        member_name=data['member_name'],
        contact_number=data['contact_number'],
        contact_address=data['contact_address'],
        aadhar_card=data['aadhar_card'],
        start_date=start_date,
        end_date=end_date,
        status='active'
    )
    
    db.session.add(membership)
    db.session.commit()
    
    return jsonify({'message': 'Membership added successfully', 'id': membership.id})

@app.route('/api/memberships/<int:membership_id>', methods=['PUT'])
@login_required
def update_membership(membership_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    membership = Membership.query.get_or_404(membership_id)
    
    if 'duration' in data:
        duration = data['duration']
        if duration == '6':
            membership.end_date = membership.start_date + timedelta(days=180)
        elif duration == '12':
            membership.end_date = membership.start_date + timedelta(days=365)
        elif duration == '24':
            membership.end_date = membership.start_date + timedelta(days=730)
    
    if 'status' in data:
        membership.status = data['status']
    
    db.session.commit()
    
    return jsonify({'message': 'Membership updated successfully'})

# Books/Movies Management
@app.route('/api/items', methods=['POST'])
@login_required
def add_item():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    item = Item(
        serial_no=data['serial_no'],
        name=data['name'],
        author=data['author'],
        category=data['category'],
        item_type=data['item_type'],
        cost=float(data['cost']),
        procurement_date=datetime.strptime(data['procurement_date'], '%Y-%m-%d'),
        quantity=int(data['quantity']),
        available_copies=int(data['quantity'])
    )
    
    db.session.add(item)
    db.session.commit()
    
    return jsonify({'message': 'Item added successfully', 'id': item.id})

# Transactions
@app.route('/api/transactions/issue', methods=['POST'])
@login_required
def issue_book():
    data = request.json
    
    # Check if membership exists
    membership = Membership.query.filter_by(membership_number=data['membership_number']).first()
    if not membership:
        return jsonify({'error': 'Membership not found'}), 404
    
    # Check if item exists and is available
    item = Item.query.filter_by(serial_no=data['serial_no']).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    if item.available_copies < 1:
        return jsonify({'error': 'No copies available'}), 400
    
    # Create transaction
    issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d')
    due_date = datetime.strptime(data['return_date'], '%Y-%m-%d')
    
    transaction = Transaction(
        membership_id=membership.id,
        item_id=item.id,
        issue_date=issue_date,
        due_date=due_date,
        status='active'
    )
    
    # Update item availability
    item.available_copies -= 1
    if item.available_copies == 0:
        item.status = 'issued'
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({'message': 'Book issued successfully', 'id': transaction.id})

@app.route('/api/transactions/return', methods=['POST'])
@login_required
def return_book():
    data = request.json
    
    transaction = Transaction.query.filter_by(id=data['transaction_id']).first()
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # Calculate fine if overdue
    return_date = datetime.strptime(data['return_date'], '%Y-%m-%d')
    transaction.return_date = return_date
    
    if return_date > transaction.due_date:
        days_overdue = (return_date - transaction.due_date).days
        fine_amount = days_overdue * 10  # $10 per day fine
        transaction.fine_amount = fine_amount
        transaction.status = 'overdue'
        
        # Update membership fine
        membership = transaction.membership
        membership.amount_pending += fine_amount
    else:
        transaction.status = 'returned'
    
    # Update item availability
    item = transaction.item
    item.available_copies += 1
    item.status = 'available'
    
    db.session.commit()
    
    return jsonify({'message': 'Book returned successfully'})

# Reports
@app.route('/api/reports/books')
@login_required
def get_books_report():
    books = Item.query.filter_by(item_type='book').all()
    result = []
    for book in books:
        result.append({
            'serial_no': book.serial_no,
            'name': book.name,
            'author': book.author,
            'category': book.category,
            'status': book.status,
            'cost': book.cost,
            'procurement_date': book.procurement_date.strftime('%Y-%m-%d'),
            'available_copies': book.available_copies
        })
    return jsonify(result)

@app.route('/api/reports/active-issues')
@login_required
def get_active_issues():
    issues = Transaction.query.filter_by(status='active').all()
    result = []
    for issue in issues:
        result.append({
            'transaction_id': issue.id,
            'serial_no': issue.item.serial_no,
            'item_name': issue.item.name,
            'membership_id': issue.membership.membership_number,
            'member_name': issue.membership.member_name,
            'issue_date': issue.issue_date.strftime('%Y-%m-%d'),
            'due_date': issue.due_date.strftime('%Y-%m-%d')
        })
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)