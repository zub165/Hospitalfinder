// Chat state
let chatHistory = [];
let selectedHospital = null;
let isTyping = false;
let userProfile = null;

// Intent patterns
const intents = {
    waitTime: /wait.*time|how.*long|duration|estimate/i,
    findHospital: /find.*hospital|nearest|closest|where/i,
    checkSymptoms: /symptom|pain|feel|sick/i,
    emergency: /emergency|urgent|critical|severe/i,
    directions: /direction|route|way|how.*get|navigate/i
};

// Initialize chat
async function initializeChat() {
    addBotMessage('Hello! I\'m your medical assistant. I can help you with:');
    addSuggestionChips([
        'Check ER wait times',
        'Review my medications',
        'Find nearest hospital',
        'Check symptoms'
    ]);

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Load chat history
    loadChatHistory();
}

// Load chat history from storage
function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
        // Replay last few messages
        chatHistory.slice(-5).forEach(msg => {
            if (msg.role === 'user') {
                addUserMessage(msg.content);
            } else {
                addBotMessage(msg.content);
            }
        });
    }
}

// Save chat history to storage
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Add message to chat
function addMessageToChat(text, type = 'user') {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const message = {
        text,
        type,
        timestamp: new Date().toISOString()
    };

    chatHistory.push(message);
    saveChatHistory();

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">
                <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-text">${text}</div>
        </div>
        <div class="message-time">Just now</div>
    `;

    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

// Show typing indicator
function showTyping() {
    const status = document.getElementById('typingStatus');
    if (status) {
        isTyping = true;
        status.textContent = 'Bot is typing...';
    }
}

// Hide typing indicator
function hideTyping() {
    const status = document.getElementById('typingStatus');
    if (status) {
        isTyping = false;
        status.textContent = '';
    }
}

// Process user message
async function processUserMessage(message) {
    addUserMessage(message);
    
    // Store message in chat history
    chatHistory.push({
        role: 'user',
        content: message
    });
    
    // Analyze intent
    const intent = analyzeIntent(message);
    await handleIntent(intent, message);
    
    // Save chat history
    saveChatHistory();
}

// Analyze message intent
function analyzeIntent(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('medication') || lowerMsg.includes('medicine') || lowerMsg.includes('drug')) {
        return 'medication';
    } else if (lowerMsg.includes('wait') || lowerMsg.includes('er ') || lowerMsg.includes('emergency')) {
        return 'wait_time';
    } else if (lowerMsg.includes('hospital') || lowerMsg.includes('clinic')) {
        return 'find_hospital';
    } else if (lowerMsg.includes('symptom') || lowerMsg.includes('feel')) {
        return 'check_symptoms';
    }
    
    return 'general';
}

// Handle different intents
async function handleIntent(intent, message) {
    switch (intent) {
        case 'medication':
            await handleMedicationQuery(message);
            break;
        case 'wait_time':
            await handleWaitTimeQuery();
            break;
        case 'find_hospital':
            await handleHospitalQuery();
            break;
        case 'check_symptoms':
            await handleSymptomQuery(message);
            break;
        default:
            handleGeneralQuery(message);
    }
}

// Handle medication-related queries
async function handleMedicationQuery(message) {
    if (!userProfile?.medications) {
        addBotMessage('I don\'t see any medications in your profile. Would you like to add some?');
        addSuggestionChips(['Add medications', 'No, thanks']);
        return;
    }
    
    // Process medication history
    const processedMeds = await window.MedicationHelper.processMedicationHistory(userProfile.medications);
    
    // Check for drug interactions
    const interactions = await window.MedicationHelper.checkDrugInteractions(processedMeds);
    
    let response = 'Here\'s your current medication list:\n\n';
    
    // Add each medication's information
    processedMeds.forEach(med => {
        response += window.MedicationHelper.formatMedicationInfo(med) + '\n\n';
    });
    
    // Add interaction warnings if any
    if (interactions.length > 0) {
        response += window.MedicationHelper.formatInteractionWarnings(interactions);
    }
    
    addBotMessage(response);
    
    // Add relevant suggestion chips
    addSuggestionChips([
        'Update medications',
        'Check interactions',
        'Set reminders'
    ]);
}

// Handle wait time queries
async function handleWaitTimeQuery() {
    try {
        // Get user's location
        const position = await getCurrentPosition();
        
        // Find nearest hospital
        const nearestHospital = await window.HospitalHelper.findNearestHospital(
            position.coords.latitude,
            position.coords.longitude
        );
        
        if (!nearestHospital) {
            addBotMessage('I\'m sorry, I couldn\'t find any hospitals near you.');
            return;
        }
        
        // Get wait time estimate
        const estimate = await window.ERHelpers.estimateERWaitTime(nearestHospital);
        const waitTimeMessage = window.ERHelpers.formatWaitTimeMessage(estimate);
        
        addBotMessage(`For ${nearestHospital.name}:\n${waitTimeMessage}`);
        
        addSuggestionChips([
            'Get directions',
            'Find another hospital',
            'Show on map'
        ]);
        
    } catch (error) {
        console.error('Error handling wait time query:', error);
        addBotMessage('I\'m sorry, I couldn\'t get the wait time information. Please try again later.');
    }
}

// Handle hospital-related queries
async function handleHospitalQuery() {
    try {
        const position = await getCurrentPosition();
        const hospitals = await window.HospitalHelper.findNearbyHospitals(
            position.coords.latitude,
            position.coords.longitude
        );
        
        if (hospitals.length === 0) {
            addBotMessage('I couldn\'t find any hospitals near you.');
            return;
        }
        
        let response = 'Here are the nearest hospitals:\n\n';
        hospitals.slice(0, 3).forEach((hospital, index) => {
            response += `${index + 1}. ${hospital.name}\n`;
            response += `   Distance: ${hospital.distance.toFixed(1)} km\n`;
            response += `   Address: ${hospital.address}\n\n`;
        });
        
        addBotMessage(response);
        
        addSuggestionChips([
            'Get directions',
            'Check wait times',
            'Show more hospitals'
        ]);
        
    } catch (error) {
        console.error('Error handling hospital query:', error);
        addBotMessage('I\'m sorry, I couldn\'t find hospital information. Please try again later.');
    }
}

// Handle symptom-related queries
async function handleSymptomQuery(message) {
    // Extract symptoms from message
    const symptoms = extractSymptoms(message);
    
    if (symptoms.length === 0) {
        addBotMessage('Could you describe your symptoms in more detail?');
        addSuggestionChips([
            'I have a headache',
            'Fever and cough',
            'Stomach pain'
        ]);
        return;
    }
    
    // Save symptoms to user profile
    if (!userProfile.symptoms) {
        userProfile.symptoms = [];
    }
    userProfile.symptoms.push({
        date: new Date(),
        symptoms: symptoms
    });
    
    // Analyze severity
    const severity = analyzeSymptomSeverity(symptoms);
    
    if (severity === 'high') {
        addBotMessage('⚠️ Based on your symptoms, you should seek immediate medical attention. Would you like me to:');
        addSuggestionChips([
            'Find nearest ER',
            'Check ER wait times',
            'Call emergency'
        ]);
    } else {
        addBotMessage('I\'ve recorded your symptoms. Would you like to:');
        addSuggestionChips([
            'Track symptoms',
            'Find a clinic',
            'Get self-care tips'
        ]);
    }
}

// Handle general queries
function handleGeneralQuery(message) {
    addBotMessage('How can I help you? I can assist with:');
    addSuggestionChips([
        'Check ER wait times',
        'Review medications',
        'Find nearest hospital',
        'Check symptoms'
    ]);
}

// UI Helper functions
function addUserMessage(message) {
    const chatContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addBotMessage(message) {
    const chatContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addSuggestionChips(suggestions) {
    const container = document.querySelector('.suggestion-chips');
    container.innerHTML = '';
    
    suggestions.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = text;
        chip.onclick = () => processUserMessage(text);
        container.appendChild(chip);
    });
}

// Helper functions
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

function extractSymptoms(message) {
    const commonSymptoms = [
        'fever', 'cough', 'headache', 'pain', 'nausea',
        'vomiting', 'diarrhea', 'fatigue', 'dizzy', 'rash'
    ];
    
    return commonSymptoms.filter(symptom => 
        message.toLowerCase().includes(symptom)
    );
}

function analyzeSymptomSeverity(symptoms) {
    const highRiskSymptoms = [
        'chest pain', 'difficulty breathing', 'severe pain',
        'unconscious', 'seizure', 'stroke'
    ];
    
    return symptoms.some(s => highRiskSymptoms.includes(s)) ? 'high' : 'medium';
}

// Send message
function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim() || isTyping) return;

    const text = input.value.trim();
    input.value = '';

    addMessageToChat(text, 'user');
    processUserMessage(text);
}

// Select suggestion
function selectSuggestion(element) {
    const text = element.textContent;
    addMessageToChat(text, 'user');
    processUserMessage(text);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeChat); 