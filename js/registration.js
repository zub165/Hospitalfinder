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
    setupSymptomBubbles();
    setupDatePicker();
    setupPhoneValidation();
    loadSavedSymptoms();
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

// Setup symptom bubbles
function setupSymptomBubbles() {
    Object.entries(symptoms).forEach(([category, categorySymptoms]) => {
        const container = document.getElementById(`${category}Symptoms`);
        if (!container) return;

        categorySymptoms.forEach(symptom => {
            const bubble = createSymptomBubble(symptom);
            container.appendChild(bubble);
        });
    });
}

// Create a symptom bubble
function createSymptomBubble(symptom) {
    const bubble = document.createElement('div');
    bubble.className = 'symptom-bubble';
    bubble.id = `symptom-${symptom.id}`;
    bubble.setAttribute('data-symptom-id', symptom.id);

    const content = `
        <div class="symptom-name">${symptom.name}</div>
        <div class="severity-dots">
            ${Array(10).fill().map((_, i) => `
                <div class="severity-dot" data-level="${i + 1}" onclick="setSeverity('${symptom.id}', ${i + 1})"></div>
            `).join('')}
        </div>
        <div class="symptom-description">${symptom.description}</div>
    `;

    bubble.innerHTML = content;
    bubble.addEventListener('click', () => toggleSymptomSelection(symptom.id));

    return bubble;
}

// Toggle symptom selection
function toggleSymptomSelection(symptomId) {
    const bubble = document.getElementById(`symptom-${symptomId}`);
    if (!bubble) return;

    const isSelected = bubble.classList.toggle('selected');
    updateSymptomHistory();
}

// Set symptom severity
function setSeverity(symptomId, level) {
    const bubble = document.getElementById(`symptom-${symptomId}`);
    if (!bubble) return;

    const dots = bubble.querySelectorAll('.severity-dot');
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

    // Mark as selected when severity is set
    bubble.classList.add('selected');
    if (level >= 7) {
        bubble.classList.add('critical');
    } else {
        bubble.classList.remove('critical');
    }

    updateSymptomHistory();
    event.stopPropagation();
}

// Update symptom history
function updateSymptomHistory() {
    const historyContainer = document.getElementById('symptomHistory');
    if (!historyContainer) return;

    const selectedSymptoms = document.querySelectorAll('.symptom-bubble.selected');
    const symptomsData = {};

    selectedSymptoms.forEach(bubble => {
        const symptomId = bubble.getAttribute('data-symptom-id');
        const activeDots = bubble.querySelectorAll('.severity-dot.active');
        symptomsData[symptomId] = activeDots.length;
    });

    localStorage.setItem('symptomsData', JSON.stringify(symptomsData));
    renderSymptomHistory(symptomsData);
}

// Render symptom history
function renderSymptomHistory(symptomsData) {
    const historyContainer = document.getElementById('symptomHistory');
    if (!historyContainer) return;

    const items = Object.entries(symptomsData).map(([symptomId, severity]) => {
        const symptom = findSymptomById(symptomId);
        if (!symptom) return '';

        return `
            <div class="symptom-history-item">
                <span class="symptom-name">${symptom.name}</span>
                <div class="severity-indicator">
                    ${Array(severity).fill('<div class="severity-dot active"></div>').join('')}
                </div>
            </div>
        `;
    });

    historyContainer.innerHTML = items.length ? items.join('') : '<p class="text-muted">No symptoms selected</p>';
}

// Find symptom by ID
function findSymptomById(symptomId) {
    for (const category in symptoms) {
        const found = symptoms[category].find(s => s.id === symptomId);
        if (found) return found;
    }
    return null;
}

// Load saved symptoms
function loadSavedSymptoms() {
    const savedSymptoms = JSON.parse(localStorage.getItem('symptomsData') || '{}');
    Object.entries(savedSymptoms).forEach(([symptomId, severity]) => {
        const bubble = document.getElementById(`symptom-${symptomId}`);
        if (bubble) {
            bubble.classList.add('selected');
            setSeverity(symptomId, severity);
        }
    });
}

// Add custom symptom
function addCustomSymptom() {
    const input = document.getElementById('customSymptom');
    if (!input || !input.value.trim()) return;

    const customSymptomId = 'custom-' + Date.now();
    const customSymptom = {
        id: customSymptomId,
        name: input.value.trim(),
        description: 'Custom symptom'
    };

    const bubble = createSymptomBubble(customSymptom);
    document.getElementById('otherSymptoms').appendChild(bubble);
    input.value = '';
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
            phone: formData.get('phone')
        },
        medicalHistory: {
            pastMedical: formData.get('pmh'),
            pastSurgical: formData.get('psh'),
            allergies: formData.get('allergies'),
            medications: formData.get('medications'),
            socialHistory: formData.get('socialHistory')
        },
        symptoms: symptomsData
    };

    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Register user using UserProfileManager
        const userProfile = await window.userProfileManager.registerUser({
            ...registrationData.personalInfo,
            medicalHistory: registrationData.medicalHistory,
            currentSymptoms: registrationData.symptoms
        });

        // Clear form and show success message
        form.reset();
        localStorage.removeItem('symptomsData');
        showSuccessMessage('Registration successful! Your profile has been created.');

        // Trigger a custom event for successful registration
        const event = new CustomEvent('userRegistered', { detail: userProfile });
        document.dispatchEvent(event);

    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'Email already registered') {
            showErrorMessage('This email is already registered. Please use a different email or login.');
        } else {
            showErrorMessage('Registration failed. Please try again.');
        }
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

// Generate registration information response
function generateRegistrationInfo(clientQuery = '') {
    const registrationSteps = {
        required_documents: [
            "Valid government-issued photo ID",
            "Insurance card (if applicable)",
            "List of current medications",
            "Previous medical records (if available)",
            "Emergency contact information"
        ],
        registration_methods: [
            {
                method: "Online Registration",
                description: "Complete the form on our website",
                estimated_time: "10-15 minutes",
                available: "24/7"
            },
            {
                method: "In-Person Registration",
                description: "Visit our facility",
                estimated_time: "20-30 minutes",
                available: "Monday-Friday, 8 AM - 6 PM"
            },
            {
                method: "Emergency Registration",
                description: "Immediate registration for urgent cases",
                estimated_time: "5-10 minutes",
                available: "24/7"
            }
        ],
        required_information: {
            personal: [
                "Full legal name",
                "Date of birth",
                "Gender",
                "Contact information (phone, email)",
                "Address"
            ],
            medical: [
                "Current symptoms",
                "Past medical history",
                "Past surgical history",
                "Current medications",
                "Allergies",
                "Social history"
            ]
        }
    };

    // Process client query to provide relevant information
    function getRelevantInfo(query) {
        query = query.toLowerCase();
        let response = {
            message: "",
            relevantSteps: [],
            additionalInfo: ""
        };

        // Check for specific query types
        if (query.includes("document") || query.includes("bring")) {
            response.message = "Required Documents:";
            response.relevantSteps = registrationSteps.required_documents;
            response.additionalInfo = "Please bring original documents or clear copies.";
        }
        else if (query.includes("online") || query.includes("website")) {
            response.message = "Online Registration Process:";
            response.relevantSteps = [
                "Visit our website",
                "Click on the Registration tab",
                "Fill out all required fields",
                "Upload necessary documents",
                "Submit the form"
            ];
            response.additionalInfo = "Estimated completion time: 10-15 minutes";
        }
        else if (query.includes("emergency")) {
            response.message = "Emergency Registration:";
            response.relevantSteps = [
                "Proceed directly to the emergency department",
                "Basic information will be collected",
                "Treatment will begin immediately",
                "Additional registration details can be completed later"
            ];
            response.additionalInfo = "Available 24/7 for urgent cases";
        }
        else {
            // Default comprehensive response
            response.message = "Registration Information:";
            response.relevantSteps = [
                "Choose your preferred registration method:",
                "- Online: Available 24/7 through our website",
                "- In-Person: Visit during business hours",
                "- Emergency: Available 24/7 for urgent cases",
                "",
                "Required Documents:",
                ...registrationSteps.required_documents.map(doc => `- ${doc}`),
                "",
                "Required Information:",
                "Personal:",
                ...registrationSteps.required_information.personal.map(info => `- ${info}`),
                "Medical:",
                ...registrationSteps.required_information.medical.map(info => `- ${info}`)
            ];
            response.additionalInfo = "For assistance, contact our help desk at [CONTACT_INFO]";
        }

        return response;
    }

    return getRelevantInfo(clientQuery);
}

// Handle registration inquiry
function handleRegistrationInquiry(clientQuery) {
    const info = generateRegistrationInfo(clientQuery);
    
    // Format response for display
    let formattedResponse = `
        <div class="registration-info">
            <h4>${info.message}</h4>
            <ul class="registration-steps">
                ${info.relevantSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            ${info.additionalInfo ? `<p class="additional-info">${info.additionalInfo}</p>` : ''}
        </div>
    `;

    return formattedResponse;
}

// Example usage in chat.js or other interface:
// const response = handleRegistrationInquiry("What documents do I need?");
// displayResponse(response);

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeRegistration); 