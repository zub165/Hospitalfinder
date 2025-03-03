// Symptom definitions with categories
const symptoms = {
    urgent: [
        { id: 'chest-pain', name: 'Chest Pain', description: 'Pain or pressure in chest' },
        { id: 'shortness-breath', name: 'Shortness of Breath', description: 'Difficulty breathing' }
    ],
    common: [
        { id: 'headache', name: 'Headache', description: 'Head pain or pressure' },
        { id: 'fever', name: 'Fever', description: 'Elevated body temperature' },
        { id: 'cough', name: 'Cough', description: 'Persistent coughing' },
        { id: 'sore-throat', name: 'Sore Throat', description: 'Pain or irritation in throat' },
        { id: 'nausea', name: 'Nausea', description: 'Feeling of sickness with inclination to vomit' }
    ],
    digestive: [
        { id: 'vomiting', name: 'Vomiting', description: 'Ejecting stomach contents through mouth' },
        { id: 'diarrhea', name: 'Diarrhea', description: 'Loose, watery stools' },
        { id: 'abdominal-pain', name: 'Abdominal Pain', description: 'Pain in stomach or belly area' }
    ],
    pain: [
        { id: 'back-pain', name: 'Back Pain', description: 'Pain in back' },
        { id: 'joint-pain', name: 'Joint Pain', description: 'Pain in joints' },
        { id: 'muscle-pain', name: 'Muscle Pain', description: 'Pain in muscles' }
    ],
    other: [
        { id: 'dizziness', name: 'Dizziness', description: 'Feeling lightheaded or unsteady' },
        { id: 'fatigue', name: 'Fatigue', description: 'Feeling of tiredness or exhaustion' },
        { id: 'anxiety', name: 'Anxiety', description: 'Feeling nervous or worried' },
        { id: 'depression', name: 'Depression', description: 'Feeling sad or hopeless' },
        { id: 'rash', name: 'Rash', description: 'Skin irritation or eruption' },
        { id: 'itching', name: 'Itching', description: 'Irritating sensation that makes you want to scratch' },
        { id: 'bleeding', name: 'Bleeding', description: 'Loss of blood' },
        { id: 'swelling', name: 'Swelling', description: 'Abnormal enlargement of body part' }
    ]
};

// Initialize registration form
function initializeRegistration() {
    setupFormValidation();
    setupSymptomSeverity();
    setupDatePicker();
    setupPhoneValidation();
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateForm()) {
            await submitRegistration();
        }
    });

    // Add required field validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => {
            validateField(field);
        });
    });
}

// Setup symptom severity selection
function setupSymptomSeverity() {
    const symptomBubbles = document.querySelectorAll('.symptom-bubble');
    symptomBubbles.forEach(bubble => {
        const dots = bubble.querySelectorAll('.severity-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const level = parseInt(dot.getAttribute('data-level'));
                updateSeverityDots(dots, level);
                updateSymptomData(bubble.getAttribute('data-symptom'), level);
            });

            dot.addEventListener('mouseover', () => {
                const level = parseInt(dot.getAttribute('data-level'));
                previewSeverityDots(dots, level);
            });

            dot.addEventListener('mouseout', () => {
                const currentLevel = getCurrentSeverityLevel(bubble.getAttribute('data-symptom'));
                updateSeverityDots(dots, currentLevel);
            });
        });
    });
}

// Update severity dots based on selected level
function updateSeverityDots(dots, level) {
    dots.forEach((dot, index) => {
        if (index < level) {
            dot.classList.add('active');
            if (index >= 7) {
                dot.classList.add('severe');
            } else if (index >= 4) {
                dot.classList.add('moderate');
            } else {
                dot.classList.add('mild');
            }
        } else {
            dot.classList.remove('active', 'mild', 'moderate', 'severe');
        }
    });
}

// Preview severity dots on hover
function previewSeverityDots(dots, level) {
    dots.forEach((dot, index) => {
        if (index < level) {
            dot.classList.add('preview');
            if (index >= 7) {
                dot.classList.add('severe');
            } else if (index >= 4) {
                dot.classList.add('moderate');
            } else {
                dot.classList.add('mild');
            }
        } else {
            dot.classList.remove('preview', 'mild', 'moderate', 'severe');
        }
    });
}

// Get current severity level for a symptom
function getCurrentSeverityLevel(symptomId) {
    const symptomsData = JSON.parse(localStorage.getItem('symptomsData') || '{}');
    return symptomsData[symptomId] || 0;
}

// Update symptom data in localStorage
function updateSymptomData(symptomId, severity) {
    const symptomsData = JSON.parse(localStorage.getItem('symptomsData') || '{}');
    if (severity === 0) {
        delete symptomsData[symptomId];
    } else {
        symptomsData[symptomId] = severity;
    }
    localStorage.setItem('symptomsData', JSON.stringify(symptomsData));
    
    // Update UI to reflect the change
    const bubble = document.querySelector(`[data-symptom="${symptomId}"]`);
    if (severity > 0) {
        bubble.classList.add('selected');
    } else {
        bubble.classList.remove('selected');
    }
}

// Add custom symptom
function addCustomSymptom() {
    const customSymptomInput = document.getElementById('customSymptom');
    const symptomName = customSymptomInput.value.trim();
    
    if (!symptomName) return;
    
    const symptomId = 'custom-' + symptomName.toLowerCase().replace(/\s+/g, '-');
    
    // Check if symptom already exists
    if (document.querySelector(`[data-symptom="${symptomId}"]`)) {
        alert('This symptom has already been added.');
        return;
    }
    
    // Create new symptom bubble
    const bubble = document.createElement('div');
    bubble.className = 'symptom-bubble';
    bubble.setAttribute('data-symptom', symptomId);
    
    bubble.innerHTML = `
        <div class="symptom-name">${symptomName}</div>
        <div class="severity-dots">
            ${Array(10).fill().map((_, i) => `
                <span class="severity-dot" data-level="${i + 1}"></span>
            `).join('')}
        </div>
    `;
    
    // Add to Other Symptoms category
    const otherSymptoms = document.querySelector('.symptom-category:last-child .symptom-bubbles');
    otherSymptoms.appendChild(bubble);
    
    // Setup severity selection for new symptom
    const dots = bubble.querySelectorAll('.severity-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const level = parseInt(dot.getAttribute('data-level'));
            updateSeverityDots(dots, level);
            updateSymptomData(symptomId, level);
        });
    });
    
    // Clear input
    customSymptomInput.value = '';
}

// Setup date picker
function setupDatePicker() {
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
        // Set max date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.max = today;
        
        // Set min date to 120 years ago
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 120);
        dateInput.min = minDate.toISOString().split('T')[0];
    }
}

// Setup phone number validation
function setupPhoneValidation() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                e.target.value = formatPhoneNumber(value);
            }
        });
    });
}

// Format phone number
function formatPhoneNumber(value) {
    const match = value.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
        let formatted = '';
        if (match[1]) formatted += match[1];
        if (match[2]) formatted += '-' + match[2];
        if (match[3]) formatted += '-' + match[3];
        return formatted;
    }
    return value;
}

// Validate form fields
function validateForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return false;

    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const errorElement = field.nextElementSibling?.classList.contains('error-message') 
        ? field.nextElementSibling 
        : createErrorElement(field);

    // Clear previous error
    errorElement.textContent = '';
    field.classList.remove('invalid');

    if (!value) {
        field.classList.add('invalid');
        errorElement.textContent = 'This field is required';
        return false;
    }

    // Additional validation based on field type
    switch(field.type) {
        case 'tel':
            if (!validatePhone(value)) {
                field.classList.add('invalid');
                errorElement.textContent = 'Please enter a valid phone number';
                return false;
            }
            break;
        case 'email':
            if (!validateEmail(value)) {
                field.classList.add('invalid');
                errorElement.textContent = 'Please enter a valid email address';
                return false;
            }
            break;
        case 'date':
            if (!validateDate(value)) {
                field.classList.add('invalid');
                errorElement.textContent = 'Please enter a valid date';
                return false;
            }
            break;
    }

    return true;
}

// Create error message element
function createErrorElement(field) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    return errorElement;
}

// Validate phone number
function validatePhone(phone) {
    return /^\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phone);
}

// Validate email
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate date
function validateDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    
    return selectedDate <= today && selectedDate >= minDate;
}

// Submit registration
async function submitRegistration() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const formData = new FormData(form);
    const symptomsData = JSON.parse(localStorage.getItem('symptomsData') || '{}');
    
    const registrationData = {
        personalInfo: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            dateOfBirth: formData.get('dateOfBirth'),
            gender: formData.get('gender'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            whatsapp: formData.get('whatsapp'),
            address: formData.get('address')
        },
        medicalHistory: {
            pastMedical: formData.get('pmh'),
            pastSurgical: formData.get('psh'),
            allergies: formData.get('allergies'),
            medications: formData.get('medications'),
            socialHistory: formData.get('socialHistory'),
            travelHistory: formData.get('travelHistory')
        },
        symptoms: symptomsData
    };

    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Submit data
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        // Clear form and show success message
        form.reset();
        localStorage.removeItem('symptomsData');
        showSuccessMessage('Registration successful!');

    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('Registration failed. Please try again.');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Show success message
function showSuccessMessage(message) {
    const alert = createAlert('success', message);
    document.getElementById('registrationForm').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Show error message
function showErrorMessage(message) {
    const alert = createAlert('error', message);
    document.getElementById('registrationForm').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Create alert element
function createAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    return alert;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeRegistration); 