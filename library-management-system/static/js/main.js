// Main JavaScript for Library Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Date validation for issue/return
    const today = new Date().toISOString().split('T')[0];
    const issueDateInputs = document.querySelectorAll('input[name="issue_date"]');
    const returnDateInputs = document.querySelectorAll('input[name="return_date"]');

    issueDateInputs.forEach(input => {
        input.min = today;
        input.value = today;
    });

    returnDateInputs.forEach(input => {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1);
        input.min = minDate.toISOString().split('T')[0];
        
        // Default to 15 days from today
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 15);
        input.value = defaultDate.toISOString().split('T')[0];
    });

    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            const strengthIndicator = this.parentNode.querySelector('.password-strength');
            
            if (!strengthIndicator) {
                const div = document.createElement('div');
                div.className = 'password-strength mt-1 small';
                this.parentNode.appendChild(div);
            }
            
            updateStrengthIndicator(strengthIndicator, strength);
        });
    });

    // Auto-calculate fines
    const dueDateInputs = document.querySelectorAll('input[name="due_date"]');
    dueDateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const returnDateInput = this.closest('form').querySelector('input[name="return_date"]');
            if (returnDateInput && returnDateInput.value) {
                calculateFine(this.value, returnDateInput.value);
            }
        });
    });

    // Search functionality
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            performSearch(this.value, this.dataset.searchType);
        }, 300));
    });

    // Initialize datepickers
    initializeDatePickers();

    // Load initial data
    loadInitialData();
});

function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

function updateStrengthIndicator(element, strength) {
    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const strengthColors = ['danger', 'warning', 'info', 'primary', 'success'];
    
    element.textContent = `Strength: ${strengthText[strength]}`;
    element.className = `password-strength mt-1 small text-${strengthColors[strength]}`;
}

function calculateFine(dueDate, returnDate) {
    const due = new Date(dueDate);
    const returned = new Date(returnDate);
    const diffTime = returned - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        const fine = diffDays * 10; // ₹10 per day
        const fineInput = document.querySelector('input[name="fine_amount"]');
        if (fineInput) {
            fineInput.value = fine;
        }
        return fine;
    }
    return 0;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function performSearch(query, type) {
    if (query.length < 2) return;
    
    try {
        const response = await fetch(`/api/search/${type}?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results, type);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results, type) {
    // Implementation depends on specific search results container
    console.log('Search results:', results);
}

function initializeDatePickers() {
    // Add datepicker functionality if needed
    // Could integrate with a library like flatpickr
}

async function loadInitialData() {
    try {
        // Load any initial data needed
        const endpoints = [
            '/api/stats',
            '/api/notifications'
        ];
        
        const responses = await Promise.all(endpoints.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));
        
        // Process and display initial data
        updateDashboardStats(data[0]);
        displayNotifications(data[1]);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

function updateDashboardStats(stats) {
    // Update dashboard with statistics
    const statElements = {
        'totalBooks': document.querySelector('#totalBooks'),
        'totalMovies': document.querySelector('#totalMovies'),
        'totalMembers': document.querySelector('#totalMembers'),
        'activeIssues': document.querySelector('#activeIssues')
    };
    
    for (const [key, element] of Object.entries(statElements)) {
        if (element && stats[key]) {
            element.textContent = stats[key];
        }
    }
}

function displayNotifications(notifications) {
    // Display notifications if any
    if (notifications && notifications.length > 0) {
        const notificationContainer = document.querySelector('#notificationContainer');
        if (notificationContainer) {
            notificationContainer.innerHTML = notifications.map(notif => `
                <div class="alert alert-${notif.type} alert-dismissible fade show" role="alert">
                    ${notif.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `).join('');
        }
    }
}

// Utility function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Export functions for use in other scripts
window.LibrarySystem = {
    apiCall,
    calculateFine,
    checkPasswordStrength
};