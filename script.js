// EduSphere Pro - Advanced Student Management System

// ===== APPLICATION STATE =====
const state = {
    students: JSON.parse(localStorage.getItem('eduSphereStudents')) || [],
    editingId: null,
    currentFilter: '',
    currentSort: 'name-asc',
    currentView: 'table'
};

// ===== DOM ELEMENTS =====
const studentForm = document.getElementById('studentForm');
const studentsTableBody = document.getElementById('studentsTableBody');
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const filterDept = document.getElementById('filterDept');
const filterYear = document.getElementById('filterYear');
const sortBy = document.getElementById('sortBy');
const emptyState = document.getElementById('emptyState');
const tableView = document.getElementById('tableView');
const cardsView = document.getElementById('cardsView');
const viewButtons = document.querySelectorAll('.view-btn');
const totalStudents = document.getElementById('totalStudents');
const totalDepartments = document.getElementById('totalDepartments');
const recordCount = document.getElementById('recordCount');
const footerStudentCount = document.getElementById('footerStudentCount');
const footerDeptCount = document.getElementById('footerDeptCount');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addFirstStudent = document.getElementById('addFirstStudent');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// ===== UTILITY FUNCTIONS =====

/**
 * Show 3D toast notification
 */
function showToast(message, type = 'success') {
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    const toastProgress = toast.querySelector('.toast-progress');
    
    // Reset animation
    toastProgress.style.animation = 'none';
    toastProgress.offsetHeight; // Trigger reflow
    toastProgress.style.animation = null;
    
    toastMessage.textContent = message;
    toast.className = 'toast-3d show ' + type;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Save to localStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('eduSphereStudents', JSON.stringify(state.students));
    updateStats();
}

/**
 * Update all statistics
 */
function updateStats() {
    const total = state.students.length;
    totalStudents.textContent = total;
    footerStudentCount.textContent = `${total} Students`;
    
    // Count unique departments
    const departments = new Set(state.students.map(s => s.department));
    const deptCount = departments.size;
    totalDepartments.textContent = deptCount;
    footerDeptCount.textContent = `${deptCount} Departments`;
    
    // Update record count badge
    const filteredCount = getFilteredStudents().length;
    recordCount.textContent = filteredCount;
}

/**
 * Validate form data
 */
function validateFormData(data) {
    const errors = {};
    
    // Name validation
    if (!data.name.trim()) {
        errors.name = 'Full name is required';
    } else if (data.name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
    } else if (!/^[A-Za-z\s]{2,}$/.test(data.name)) {
        errors.name = 'Name can only contain letters and spaces';
    }
    
    // Roll number validation
    if (!data.rollNo.trim()) {
        errors.rollNo = 'Roll number is required';
    } else if (state.students.some(s => s.rollNo === data.rollNo && s.id !== data.id)) {
        errors.rollNo = 'This roll number is already registered';
    }
    
    // Department validation
    if (!data.department) {
        errors.department = 'Please select a department';
    }
    
    // Year validation
    if (!data.year) {
        errors.year = 'Please select academic year';
    }
    
    // Email validation
    if (!data.email.trim()) {
        errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (!data.phone.trim()) {
        errors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,15}$/.test(data.phone.replace(/\D/g, ''))) {
        errors.phone = 'Please enter a valid phone number (10-15 digits)';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Display form errors with animation
 */
function displayFormErrors(errors) {
    // Clear all errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    // Display new errors with animation
    Object.entries(errors).forEach(([field, message]) => {
        const errorEl = document.getElementById(`${field}Error`);
        const inputEl = document.getElementById(field);
        
        if (errorEl && inputEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            
            // Add shake animation to input
            inputEl.style.animation = 'none';
            inputEl.offsetHeight;
            inputEl.style.animation = 'shake 0.5s ease-in-out';
        }
    });
}

/**
 * Get filtered and sorted students
 */
function getFilteredStudents() {
    let filtered = [...state.students];
    
    // Apply search filter
    if (state.currentFilter) {
        const searchLower = state.currentFilter.toLowerCase();
        filtered = filtered.filter(student => 
            student.name.toLowerCase().includes(searchLower) ||
            student.rollNo.toLowerCase().includes(searchLower) ||
            student.department.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower)
        );
    }
    
    // Apply department filter
    const selectedDept = filterDept.value;
    if (selectedDept) {
        filtered = filtered.filter(student => student.department === selectedDept);
    }
    
    // Apply year filter
    const selectedYear = filterYear.value;
    if (selectedYear) {
        filtered = filtered.filter(student => student.year === selectedYear);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        switch(state.currentSort) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'roll-asc':
                return a.rollNo.localeCompare(b.rollNo);
            case 'roll-desc':
                return b.rollNo.localeCompare(a.rollNo);
            case 'year-asc':
                return a.year - b.year;
            case 'year-desc':
                return b.year - a.year;
            default:
                return 0;
        }
    });
    
    return filtered;
}

/**
 * Create table row HTML
 */
function createStudentRow(student, index) {
    const yearLabels = {
        '1': 'First Year',
        '2': 'Second Year',
        '3': 'Third Year',
        '4': 'Fourth Year',
        '5': 'Fifth Year'
    };
    
    return `
        <tr style="animation-delay: ${index * 0.05}s">
            <td><strong>${student.rollNo}</strong></td>
            <td>${student.name}</td>
            <td><span class="dept-badge">${student.department}</span></td>
            <td><span class="year-badge year-${student.year}">${yearLabels[student.year] || 'Year ' + student.year}</span></td>
            <td><a href="mailto:${student.email}" class="email-link">${student.email}</a></td>
            <td>${formatPhoneNumber(student.phone)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editStudent('${student.id}')" 
                            title="Edit student" data-tooltip="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDelete('${student.id}')" 
                            title="Delete student" data-tooltip="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="action-btn" onclick="viewStudent('${student.id}')" 
                            title="View details" data-tooltip="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Create student card HTML
 */
function createStudentCard(student, index) {
    const yearLabels = {
        '1': 'First Year',
        '2': 'Second Year',
        '3': 'Third Year',
        '4': 'Fourth Year',
        '5': 'Fifth Year'
    };
    
    return `
        <div class="student-card" style="animation-delay: ${index * 0.05}s">
            <div class="card-header">
                <span class="card-id">${student.rollNo}</span>
                <div class="card-actions">
                    <button class="action-btn btn-edit" onclick="editStudent('${student.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDelete('${student.id}')" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <h3>${student.name}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-building"></i>
                        <span>${student.department}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${yearLabels[student.year] || 'Year ' + student.year}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${formatPhoneNumber(student.phone)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Format phone number
 */
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}

/**
 * Render students based on current view
 */
function renderStudents() {
    const filteredStudents = getFilteredStudents();
    
    // Update record count
    recordCount.textContent = filteredStudents.length;
    
    if (filteredStudents.length === 0) {
        emptyState.style.display = 'block';
        tableView.style.display = 'none';
        cardsView.style.display = 'none';
        
        // Update empty state message
        const hasFilters = state.currentFilter || filterDept.value || filterYear.value;
        if (hasFilters) {
            emptyState.querySelector('h3').textContent = 'No Matching Students';
            emptyState.querySelector('p').textContent = 'Try adjusting your search criteria or filters';
        } else if (state.students.length === 0) {
            emptyState.querySelector('h3').textContent = 'Welcome to EduSphere Pro';
            emptyState.querySelector('p').textContent = 'Start by adding your first student record';
        }
    } else {
        emptyState.style.display = 'none';
        
        if (state.currentView === 'table') {
            tableView.style.display = 'block';
            cardsView.style.display = 'none';
            
            const rows = filteredStudents.map((student, index) => 
                createStudentRow(student, index)
            ).join('');
            
            studentsTableBody.innerHTML = rows;
        } else {
            tableView.style.display = 'none';
            cardsView.style.display = 'block';
            
            const cards = filteredStudents.map((student, index) => 
                createStudentCard(student, index)
            ).join('');
            
            cardsContainer.innerHTML = cards;
        }
    }
}

/**
 * Populate department filter dropdown
 */
function populateDepartmentFilter() {
    const departments = new Set();
    const allDepartments = [
        // Engineering
        'Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Machine Learning',
        'Data Science', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering',
        'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Aerospace Engineering',
        'Automobile Engineering', 'Robotics Engineering', 'Mechatronics',
        // Medical
        'MBBS - General Medicine', 'BDS - Dentistry', 'BAMS - Ayurveda', 'BHMS - Homeopathy',
        'BPT - Physiotherapy', 'B.Pharm - Pharmacy', 'B.Sc Nursing', 'Medical Laboratory Technology',
        // Arts & Humanities
        'Bachelor of Arts (General)', 'BA English Literature', 'BA History', 'BA Political Science',
        'BA Psychology', 'BA Sociology', 'BA Economics', 'BA Philosophy', 'BA Fine Arts',
        'BA Music', 'BA Theatre Arts', 'BA Journalism & Mass Comm',
        // Science
        'B.Sc Physics', 'B.Sc Chemistry', 'B.Sc Mathematics', 'B.Sc Biology', 'B.Sc Computer Science',
        'B.Sc Statistics', 'B.Sc Electronics', 'B.Sc Environmental Science', 'B.Sc Microbiology',
        'B.Sc Biotechnology',
        // Commerce
        'B.Com (General)', 'B.Com (Honors)', 'BBA - Business Administration', 'BMS - Management Studies',
        'BBA in Finance', 'BBA in Marketing', 'BBA in HR', 'Bachelor of Financial Markets',
        // Law
        'BA LLB', 'BBA LLB', 'LLB (3 Year)',
        // Design & Architecture
        'B.Arch - Architecture', 'B.Des - Design', 'BFA - Fine Arts', 'B.Plan - Planning',
        // Other
        'BCA - Computer Applications', 'BBA in Aviation', 'BHM - Hotel Management', 'B.Sc Agriculture',
        'Bachelor of Education', 'Bachelor of Social Work', 'Bachelor of Fashion Tech'
    ];
    
    // Add existing student departments
    state.students.forEach(s => departments.add(s.department));
    
    // Add all possible departments
    allDepartments.forEach(dept => departments.add(dept));
    
    const currentValue = filterDept.value;
    
    // Clear existing options except the first one
    while (filterDept.options.length > 1) {
        filterDept.remove(1);
    }
    
    // Sort departments alphabetically
    const sortedDepartments = Array.from(departments).sort();
    
    // Add department options
    sortedDepartments.forEach(dept => {
        if (dept) {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            filterDept.appendChild(option);
        }
    });
    
    // Restore previous selection
    if (sortedDepartments.includes(currentValue)) {
        filterDept.value = currentValue;
    }
}

/**
 * Reset form to add mode
 */
function resetForm() {
    studentForm.reset();
    state.editingId = null;
    submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Student';
    submitBtn.className = 'btn btn-primary btn-3d';
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    // Focus on first input
    document.getElementById('name').focus();
}

/**
 * Edit student
 */
function editStudent(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;
    
    // Populate form
    document.getElementById('name').value = student.name;
    document.getElementById('rollNo').value = student.rollNo;
    document.getElementById('department').value = student.department;
    document.getElementById('year').value = student.year;
    document.getElementById('email').value = student.email;
    document.getElementById('phone').value = student.phone;
    
    // Update UI for edit mode
    state.editingId = id;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Student';
    submitBtn.className = 'btn btn-secondary btn-3d';
    
    // Scroll to form with smooth animation
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
    
    showToast(`Editing: ${student.name}`, 'warning');
}

/**
 * View student details
 */
function viewStudent(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;
    
    // In a real application, you might show a detailed modal
    showToast(`Viewing: ${student.name} - ${student.department}`, 'success');
}

/**
 * Confirm delete student
 */
let studentToDelete = null;

function confirmDelete(id) {
    studentToDelete = id;
    confirmModal.style.display = 'block';
    
    // Add animation
    confirmModal.style.animation = 'fadeIn 0.3s ease-out';
}

/**
 * Delete student
 */
function deleteStudent(id) {
    const studentIndex = state.students.findIndex(s => s.id === id);
    if (studentIndex === -1) return;
    
    const studentName = state.students[studentIndex].name;
    state.students.splice(studentIndex, 1);
    
    saveToLocalStorage();
    renderStudents();
    populateDepartmentFilter();
    
    showToast(`"${studentName}" has been deleted`, 'error');
    studentToDelete = null;
    confirmModal.style.display = 'none';
}

/**
 * Initialize theme
 */
function initTheme() {
    const savedTheme = localStorage.getItem('eduSphereTheme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-theme');
    }
    
    localStorage.setItem('eduSphereTheme', 
        document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    );
}

/**
 * Toggle theme with animation
 */
function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    
    // Add transition class for smooth theme change
    document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        showToast('Switched to Light Mode', 'success');
    } else {
        document.body.classList.add('dark-theme');
        showToast('Switched to Dark Mode', 'success');
    }
    
    localStorage.setItem('eduSphereTheme', 
        document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    );
    
    // Remove transition after animation
    setTimeout(() => {
        document.body.style.transition = '';
    }, 500);
}

/**
 * Switch view between table and cards
 */
function switchView(view) {
    state.currentView = view;
    
    // Update button states
    viewButtons.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Render appropriate view
    renderStudents();
}

/**
 * Add sample data
 */
function addSampleData() {
    const sampleStudents = [
        {
            id: '1',
            name: 'Tanisshq M',
            rollNo: '714023105053',
            department: 'Computer Science & Engineering',
            year: '3',
            email: 'mtanisshq7@gmail.com',
            phone: '+91 9345733566'
        },
        
    ];
    
    // Only add sample data if no students exist
    if (state.students.length === 0) {
        state.students = sampleStudents;
        saveToLocalStorage();
        renderStudents();
        populateDepartmentFilter();
        showToast('Sample data loaded successfully!', 'success');
    }
}

// ===== EVENT LISTENERS =====

// Form submission
studentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        id: state.editingId || Date.now().toString(),
        name: document.getElementById('name').value.trim(),
        rollNo: document.getElementById('rollNo').value.trim(),
        department: document.getElementById('department').value,
        year: document.getElementById('year').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };
    
    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }
    
    // Add or update student
    if (state.editingId) {
        // Update existing student
        const index = state.students.findIndex(s => s.id === state.editingId);
        if (index !== -1) {
            state.students[index] = formData;
            showToast(`Updated: ${formData.name}`, 'success');
        }
    } else {
        // Add new student
        state.students.push(formData);
        showToast(`Added: ${formData.name}`, 'success');
    }
    
    // Reset and update UI
    resetForm();
    saveToLocalStorage();
    renderStudents();
    populateDepartmentFilter();
});

// Cancel edit
cancelBtn.addEventListener('click', resetForm);

// Add first student button
addFirstStudent?.addEventListener('click', () => {
    document.getElementById('name').focus();
    showToast('Ready to add your first student!', 'success');
});

// Search input with debounce
let searchTimeout;
searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        state.currentFilter = this.value.trim();
        renderStudents();
    }, 300);
});

// Clear search
clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    state.currentFilter = '';
    renderStudents();
    searchInput.focus();
});

// Filter and sort changes
[filterDept, filterYear, sortBy].forEach(select => {
    select.addEventListener('change', function() {
        state.currentSort = sortBy.value;
        renderStudents();
    });
});

// View toggle buttons
viewButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        switchView(this.dataset.view);
    });
});

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Modal controls
confirmDeleteBtn.addEventListener('click', () => {
    if (studentToDelete) {
        deleteStudent(studentToDelete);
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    studentToDelete = null;
    confirmModal.style.display = 'none';
});

// Close modal on backdrop click
confirmModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        studentToDelete = null;
        confirmModal.style.display = 'none';
    }
});

// ===== INITIALIZATION =====

function initApp() {
    // Initialize theme
    initTheme();
    
    // Load initial data
    updateStats();
    populateDepartmentFilter();
    renderStudents();
    switchView('table');
    
    // Add sample data if empty
    if (state.students.length === 0) {
        setTimeout(addSampleData, 1000);
    }
    
    // Welcome message
    setTimeout(() => {
        showToast('Welcome to EduSphere Pro! 🎓', 'success');
    }, 1500);
    
    // Add shake animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .floating {
            animation: float 3s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // Ctrl/Cmd + N to add new student
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        resetForm();
        document.getElementById('name').focus();
        showToast('Ready to add new student', 'success');
    }
    
    // Escape to cancel/edit or close modal
    if (e.key === 'Escape') {
        if (state.editingId) {
            resetForm();
            showToast('Edit cancelled', 'warning');
        }
        if (studentToDelete) {
            studentToDelete = null;
            confirmModal.style.display = 'none';
        }
    }
    
    // Tab switching with Ctrl+1, Ctrl+2
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        switchView('table');
    }
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        switchView('cards');
    }
});

// ===== EXPORT FUNCTIONS =====
window.editStudent = editStudent;
window.confirmDelete = confirmDelete;
window.viewStudent = viewStudent;

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', initApp);

// ===== OFFLINE SUPPORT =====
window.addEventListener('online', () => {
    showToast('You are back online', 'success');
});

window.addEventListener('offline', () => {
    showToast('Working offline - changes saved locally', 'warning');
});

// ===== DATA EXPORT/IMPORT =====
// Add these functions for data management
function exportData() {
    const dataStr = JSON.stringify(state.students, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `eduSphere-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Data exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                state.students = importedData;
                saveToLocalStorage();
                renderStudents();
                populateDepartmentFilter();
                showToast('Data imported successfully!', 'success');
            } else {
                showToast('Invalid data format', 'error');
            }
        } catch (error) {
            showToast('Error importing data', 'error');
        }
    };
    reader.readAsText(file);
}

// Add export/import buttons to the DOM
function addDataManagementButtons() {
    const controlsHeader = document.querySelector('.controls-header');
    if (!controlsHeader) return;
    
    const dataButtons = document.createElement('div');
    dataButtons.className = 'data-management';
    dataButtons.innerHTML = `
        <button class="btn btn-outline btn-3d" onclick="exportData()" title="Export Data">
            <i class="fas fa-download"></i>
            Export
        </button>
        <label class="btn btn-outline btn-3d" title="Import Data">
            <i class="fas fa-upload"></i>
            Import
            <input type="file" accept=".json" style="display: none;" onchange="importData(event)">
        </label>
    `;
    
    controlsHeader.appendChild(dataButtons);
}

// Initialize data management buttons
setTimeout(addDataManagementButtons, 1000);

// Add these to the global scope
window.exportData = exportData;
window.importData = importData;
