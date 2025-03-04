// Chat state
let chatHistory = [];
let selectedHospital = null;
let isTyping = false;
let userProfile = null;

// Intent patterns
const intents = {
    waitTime: {
        patterns: [/wait.*time|how.*long|duration|estimate/i],
        responses: [
            "I'll check the current wait times at nearby hospitals for you.",
            "Let me find the wait time information for emergency rooms in your area.",
            "I'll help you find the shortest ER wait time nearby."
        ]
    },
    findHospital: {
        patterns: [/find.*hospital|nearest|closest|where|nearby/i],
        responses: [
            "I'll help you locate the nearest hospitals to your location.",
            "Let me search for hospitals in your area.",
            "I'll find medical facilities near you."
        ]
    },
    checkSymptoms: {
        patterns: [/symptom|pain|feel|sick|hurt/i],
        responses: [
            "I'll help you assess your symptoms. Could you describe what you're experiencing?",
            "Let me help you evaluate your symptoms. What are you feeling?",
            "I'll assist in checking your symptoms. Please tell me what's bothering you."
        ]
    },
    emergency: {
        patterns: [/emergency|urgent|critical|severe/i],
        responses: [
            "🚨 I'll help you get immediate medical attention. What's the emergency situation?",
            "This sounds serious. Let me help you find emergency care right away.",
            "I'll assist you with this urgent situation. Please briefly describe what's happening."
        ]
    },
    directions: {
        patterns: [/direction|route|way|how.*get|navigate/i],
        responses: [
            "I'll help you get directions to the nearest medical facility.",
            "Let me help you navigate to a hospital.",
            "I'll find the best route to get you medical care."
        ]
    },
    profile: {
        patterns: [/profile|my information|my details|my record|my data/i],
        responses: [
            "I'll help you access your medical profile.",
            "Let me fetch your medical information.",
            "I'll show you your health records."
        ]
    }
};

// Emergency conditions and responses
const emergencyConditions = {
    heartAttack: {
        symptoms: ['chest pain', 'shortness of breath', 'arm pain', 'jaw pain', 'cold sweat', 'nausea', 
                  'chest pressure', 'chest tightness', 'left arm pain', 'upper back pain'],
        severity: 'CRITICAL',
        priority: 1,
        immediateActions: [
            '🚨 Call emergency services (911) IMMEDIATELY',
            '✓ Sit or lie down and stay as calm as possible',
            '✓ If prescribed, take nitroglycerin',
            '✓ If advised by emergency services and not allergic, take aspirin',
            '✓ Loosen any tight clothing',
            '✓ Unlock your door for emergency responders'
        ],
        message: '🚨 CRITICAL EMERGENCY: These symptoms strongly suggest a possible heart attack. Emergency medical care is needed immediately.',
        additionalInfo: 'Time is critical with heart attacks. The faster you get medical help, the better the outcome.'
    },
    stroke: {
        symptoms: ['face drooping', 'arm weakness', 'speech difficulty', 'sudden confusion', 
                  'sudden headache', 'vision problems', 'balance loss', 'numbness', 
                  'facial numbness', 'one-sided weakness'],
        severity: 'CRITICAL',
        priority: 1,
        immediateActions: [
            '🚨 Call emergency services (911) IMMEDIATELY',
            '✓ Note the exact time symptoms started (critical for treatment)',
            '✓ Perform the FAST test (Face, Arms, Speech, Time)',
            '✓ Do not give anything to eat or drink',
            '✓ Help them lie down on their side with head slightly raised',
            '✓ Stay with the person and keep them calm'
        ],
        message: '🚨 CRITICAL EMERGENCY: These symptoms indicate a possible stroke. Immediate medical attention is crucial.',
        additionalInfo: 'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 911'
    },
    severeBleeding: {
        symptoms: ['heavy bleeding', 'blood loss', 'deep cut', 'wound', 'spurting blood', 
                  'uncontrolled bleeding', 'penetrating injury'],
        severity: 'URGENT',
        priority: 2,
        immediateActions: [
            '🚨 Call emergency services (911) for severe bleeding',
            '✓ Apply direct, firm pressure with clean cloth or sterile bandage',
            '✓ Keep the injured area elevated above the heart',
            '✓ Apply tourniquet if bleeding is life-threatening and on a limb',
            '✓ Keep the person warm and calm',
            '✓ Do not remove the cloth if it becomes soaked - add more on top'
        ],
        message: '🚨 URGENT: This appears to be a serious bleeding situation requiring immediate medical attention.',
        additionalInfo: 'Apply direct pressure immediately. If blood soaks through, add more layers without removing the original dressing.'
    },
    allergicReaction: {
        symptoms: ['difficulty breathing', 'swelling', 'hives', 'itching', 'anaphylaxis', 
                  'throat tightness', 'wheezing', 'facial swelling', 'tongue swelling', 'dizziness'],
        severity: 'CRITICAL',
        priority: 1,
        immediateActions: [
            '🚨 Call emergency services (911) IMMEDIATELY',
            '✓ Use epinephrine auto-injector (EpiPen) if available and prescribed',
            '✓ Help the person stay calm and breathe',
            '✓ Remove any known allergens (food, medications, stings)',
            '✓ Keep them sitting up or lying on their side if unconscious',
            '✓ Be prepared to perform CPR if needed'
        ],
        message: '🚨 CRITICAL EMERGENCY: This may be a severe allergic reaction (anaphylaxis) requiring immediate medical attention.',
        additionalInfo: 'If the person has an EpiPen, help them use it immediately. A second dose may be needed after 5-15 minutes.'
    },
    breathingDifficulty: {
        symptoms: ['severe shortness of breath', 'unable to breathe', 'gasping for air', 
                  'blue lips', 'chest tightness', 'can\'t speak full sentences', 'wheezing'],
        severity: 'CRITICAL',
        priority: 1,
        immediateActions: [
            '🚨 Call emergency services (911) IMMEDIATELY',
            '✓ Help the person sit upright to ease breathing',
            '✓ Loosen any tight clothing around neck/chest',
            '✓ Use rescue inhaler if available and prescribed',
            '✓ Stay calm and help them focus on slow breathing',
            '✓ Keep them still and minimize their movement'
        ],
        message: '🚨 CRITICAL EMERGENCY: Severe breathing difficulty requires immediate medical attention.',
        additionalInfo: 'If the person has asthma or COPD, help them use their prescribed inhaler while waiting for emergency services.'
    }
};

// Add learning system
const ChatLearningSystem = {
    interactionPatterns: new Map(),
    symptomPatterns: new Map(),
    responseEffectiveness: new Map(),
    userFeedback: new Map(),

    // Initialize learning system
    initialize() {
        this.loadLearningData();
        this.setupFeedbackSystem();
    },

    // Load previous learning data
    loadLearningData() {
        const savedPatterns = localStorage.getItem('chatLearningPatterns');
        const savedEffectiveness = localStorage.getItem('responseEffectiveness');
        const savedSymptoms = localStorage.getItem('symptomPatterns');

        if (savedPatterns) this.interactionPatterns = new Map(JSON.parse(savedPatterns));
        if (savedEffectiveness) this.responseEffectiveness = new Map(JSON.parse(savedEffectiveness));
        if (savedSymptoms) this.symptomPatterns = new Map(JSON.parse(savedSymptoms));
    },

    // Save learning data
    saveLearningData() {
        localStorage.setItem('chatLearningPatterns', 
            JSON.stringify(Array.from(this.interactionPatterns.entries())));
        localStorage.setItem('responseEffectiveness', 
            JSON.stringify(Array.from(this.responseEffectiveness.entries())));
        localStorage.setItem('symptomPatterns', 
            JSON.stringify(Array.from(this.symptomPatterns.entries())));
    },

    // Learn from interaction
    learnFromInteraction(userMessage, botResponse, context) {
        const pattern = this.extractPattern(userMessage);
        const existing = this.interactionPatterns.get(pattern) || {
            count: 0,
            responses: new Map(),
            contexts: new Set()
        };

        existing.count++;
        existing.contexts.add(JSON.stringify(context));
        
        const responseCount = existing.responses.get(botResponse) || 0;
        existing.responses.set(botResponse, responseCount + 1);

        this.interactionPatterns.set(pattern, existing);
        this.saveLearningData();
    },

    // Learn from symptom patterns
    learnFromSymptoms(symptoms, diagnosis, outcome) {
        const symptomKey = symptoms.sort().join('|');
        const existing = this.symptomPatterns.get(symptomKey) || {
            count: 0,
            diagnoses: new Map(),
            outcomes: new Map()
        };

        existing.count++;
        
        const diagnosisCount = existing.diagnoses.get(diagnosis) || 0;
        existing.diagnoses.set(diagnosis, diagnosisCount + 1);

        if (outcome) {
            const outcomeCount = existing.outcomes.get(outcome) || 0;
            existing.outcomes.set(outcome, outcomeCount + 1);
        }

        this.symptomPatterns.set(symptomKey, existing);
        this.saveLearningData();
    },

    // Record response effectiveness
    recordEffectiveness(response, wasEffective) {
        const stats = this.responseEffectiveness.get(response) || {
            effective: 0,
            ineffective: 0
        };

        if (wasEffective) {
            stats.effective++;
        } else {
            stats.ineffective++;
        }

        this.responseEffectiveness.set(response, stats);
        this.saveLearningData();
    },

    // Get improved response based on learning
    getImprovedResponse(userMessage, context) {
        try {
            const pattern = this.extractPattern(userMessage);
            const learned = this.interactionPatterns.get(pattern);

            if (!learned || !learned.responses) {
                return null;
            }

            // Convert responses to array if it's a Map
            const responses = learned.responses instanceof Map ? 
                Array.from(learned.responses.entries()) :
                Object.entries(learned.responses);

            if (responses.length === 0) {
                return null;
            }

            // Sort by effectiveness
            responses.sort((a, b) => {
                const aEffectiveness = this.getEffectivenessScore(a[0]);
                const bEffectiveness = this.getEffectivenessScore(b[0]);
                return bEffectiveness - aEffectiveness;
            });

            return responses[0][0];
        } catch (error) {
            console.error('Error getting improved response:', error);
            return null;
        }
    },

    // Get effectiveness score
    getEffectivenessScore(response) {
        const stats = this.responseEffectiveness.get(response);
        if (!stats) return 0;

        const total = stats.effective + stats.ineffective;
        return total > 0 ? (stats.effective / total) : 0;
    },

    // Extract pattern from message
    extractPattern(message) {
        return message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    // Setup feedback system
    setupFeedbackSystem() {
        document.addEventListener('chatFeedback', (event) => {
            const { messageId, wasHelpful } = event.detail;
            this.recordFeedback(messageId, wasHelpful);
        });
    },

    // Record user feedback
    recordFeedback(messageId, wasHelpful) {
        this.userFeedback.set(messageId, wasHelpful);
        this.saveLearningData();
    },

    // Get suggested responses based on similar patterns
    getSuggestedResponses(userMessage) {
        const pattern = this.extractPattern(userMessage);
        const suggestions = [];

        this.interactionPatterns.forEach((data, storedPattern) => {
            if (this.patternSimilarity(pattern, storedPattern) > 0.7) {
                data.responses.forEach((count, response) => {
                    suggestions.push({
                        response,
                        confidence: count / data.count * this.getEffectivenessScore(response)
                    });
                });
            }
        });

        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);
    }
};

// Initialize chat functionality
document.addEventListener('DOMContentLoaded', () => {
    const chatTab = document.getElementById('chat-tab');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');

    if (!chatTab || !messageInput || !chatMessages) {
        console.error('Required chat elements not found');
        return;
    }

    // Initialize chat when tab is shown
    chatTab.addEventListener('shown.bs.tab', () => {
        console.log('Chat tab shown, initializing...');
        initializeChat();
    });

    // Set up message input handler with typing indicator
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isTyping && messageInput.value.trim()) {
                sendMessage();
            }
        }
    });

    // Add typing indicator
    messageInput.addEventListener('input', () => {
        if (messageInput.value.trim()) {
            typingIndicator.textContent = 'You are typing...';
        } else {
            typingIndicator.textContent = '';
        }
    });

    // Initialize suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => selectSuggestion(chip.textContent));
    });

    // Initialize learning system
    ChatLearningSystem.initialize();

    // Load chat history
    loadChatHistory();

    // Add welcome message if no history
    if (!chatHistory.length) {
        addBotMessage(`👋 Hello! I'm your medical assistant. I can help you with:
        
• Finding nearby hospitals and ER wait times
• Checking symptoms and providing health guidance
• Scheduling appointments and managing records
• Getting directions to medical facilities
• Emergency medical information

How can I assist you today?`);

        // Add initial suggestion chips
        addSuggestionChips([
            'Find nearest hospital',
            'Check symptoms',
            'ER wait times',
            'Emergency help'
        ]);
    }
});

function initializeChat() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!messageInput || !chatMessages) {
        console.error('Required chat elements not found');
        return;
    }

    // Set up message input handler
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initialize suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => selectSuggestion(chip));
    });

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

// Process user message with enhanced error handling
async function processUserMessage(message) {
    if (!message?.trim()) return;

    // Show typing indicator
    showTyping();
    
    try {
        // Add user message to chat
        addUserMessage(message);

        // Check for emergency keywords first
        const emergencyData = analyzeEmergencySymptoms(message);
        if (emergencyData?.emergencies?.length > 0) {
            const response = generateEmergencyResponse(emergencyData);
            if (response) {
                addBotMessage(response);
                addSuggestionChips([
                    '🚑 Call Emergency',
                    '🏥 Nearest ER',
                    '🚨 Emergency Instructions'
                ]);
            }
            return;
        }

        // Get intent and confidence
        const intent = analyzeIntent(message);
        console.log('Detected intent:', intent);

        // Get improved response from learning system
        let response = null;
        try {
            response = ChatLearningSystem.getImprovedResponse(message, {
                intent,
                userProfile,
                selectedHospital
            });
        } catch (error) {
            console.error('Error getting improved response:', error);
        }

        // If no improved response, use default intent response
        if (!response && intent && intents[intent]) {
            const responses = intents[intent].responses;
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        // Add bot response if we have one
        if (response) {
            addBotMessage(response);
        } else {
            addBotMessage("I apologize, but I'm not sure how to help with that. Could you please rephrase your question?");
        }

        // Handle based on intent
        await handleIntent(intent, message);

        // Learn from interaction if we had a valid response
        if (response) {
            try {
                ChatLearningSystem.learnFromInteraction(message, response, {
                    intent,
                    userProfile,
                    selectedHospital
                });
            } catch (error) {
                console.error('Error learning from interaction:', error);
            }
        }

    } catch (error) {
        console.error('Error processing message:', error);
        addBotMessage('I apologize, but I encountered an error. Please try again or rephrase your question.');
        
        // Add helpful suggestions
        addSuggestionChips([
            'Try again',
            'Help',
            'Contact support'
        ]);
    } finally {
        hideTyping();
    }
}

// Analyze intent
function analyzeIntent(message) {
    const lowerMsg = message.toLowerCase();
    let bestMatch = {
        intent: 'general',
        confidence: 0
    };

    // Check each intent
    for (const [intent, data] of Object.entries(intents)) {
        const matches = data.patterns.filter(pattern => pattern.test(lowerMsg));
        const confidence = matches.length / data.patterns.length;

        if (confidence > bestMatch.confidence) {
            bestMatch = { intent, confidence };
        }
    }

    return bestMatch.intent;
}

// Enhanced intent handling
async function handleIntent(intent, message) {
    console.log(`Handling intent: ${intent}`);
    
    // Get random response for the intent
    const getIntentResponse = (intent) => {
        const responses = intents[intent]?.responses || [
            "I'll help you with that.",
            "Let me assist you with that.",
            "I'll look into that for you."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    // Add initial response
    const initialResponse = getIntentResponse(intent);
    addBotMessage(initialResponse);

    // Show typing indicator for next response
    showTyping();

    try {
        switch (intent) {
            case 'waitTime':
                await handleWaitTimeQuery();
                break;
            case 'findHospital':
                await handleHospitalQuery();
                break;
            case 'checkSymptoms':
                await handleSymptomQuery(message);
                break;
            case 'emergency':
                const emergencyData = analyzeEmergencySymptoms(message);
                const response = generateEmergencyResponse(emergencyData);
                addBotMessage(response);
                break;
            case 'profile':
                await handleProfileQuery(message);
                break;
            case 'directions':
                await handleDirectionsQuery(message);
                break;
            default:
                handleGeneralQuery(message);
        }
    } catch (error) {
        console.error('Error handling intent:', error);
        addBotMessage("I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.");
    } finally {
        hideTyping();
    }
}

// New function to handle directions queries
async function handleDirectionsQuery(message) {
    if (!navigator.geolocation) {
        addBotMessage("I apologize, but I can't access location services. Please make sure location access is enabled in your browser.");
        return;
    }

    try {
        const position = await getCurrentPosition();
        const hospitals = await window.HospitalHelper.findNearbyHospitals(
            position.coords.latitude,
            position.coords.longitude
        );

        if (hospitals.length === 0) {
            addBotMessage("I couldn't find any hospitals near your location. Would you like to search in a different area?");
            addSuggestionChips(['Search different area', 'Show all hospitals', 'Emergency services']);
            return;
        }

        let response = "I found several hospitals near you:\n\n";
        hospitals.slice(0, 3).forEach((hospital, index) => {
            response += `${index + 1}. **${hospital.name}**\n`;
            response += `📍 ${hospital.distance.toFixed(1)} km away\n`;
            response += `🏥 ${hospital.address}\n\n`;
        });

        response += "Would you like directions to any of these hospitals?";
        addBotMessage(response);

        // Add suggestion chips for each hospital
        addSuggestionChips([
            ...hospitals.slice(0, 3).map(h => `Directions to ${h.name}`),
            'Show more hospitals'
        ]);

    } catch (error) {
        console.error('Error handling directions query:', error);
        addBotMessage("I'm having trouble getting your location. Please make sure location services are enabled, or you can type in your address manually.");
    }
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
        case 'profile':
            await handleProfileQuery(message);
            break;
        case 'registration':
            const registrationResponse = handleRegistrationQuery(message);
            addBotMessage(registrationResponse);
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
        
        addBotMessage(`🏥 ${nearestHospital.name}\n\n⏱️ Current Wait Time:\n${waitTimeMessage}\n\n📍 Distance: ${nearestHospital.distance.toFixed(1)} km\n🏢 Address: ${nearestHospital.address}`);
        
        addSuggestionChips([
            'Find other hospitals',
            'Emergency services',
            'Register now'
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
        
        let response = '🏥 Here are the nearest hospitals:\n\n';
        hospitals.slice(0, 3).forEach((hospital, index) => {
            response += `${index + 1}. ${hospital.name}\n`;
            response += `   📍 Distance: ${hospital.distance.toFixed(1)} km\n`;
            response += `   🏢 Address: ${hospital.address}\n`;
            if (hospital.phone) {
                response += `   📞 Phone: ${hospital.phone}\n`;
            }
            response += '\n';
        });
        
        addBotMessage(response);
        
        addSuggestionChips([
            'Check wait times',
            'Find more hospitals',
            'Emergency services'
        ]);
        
    } catch (error) {
        console.error('Error handling hospital query:', error);
        addBotMessage('I\'m sorry, I couldn\'t find hospital information. Please try again later.');
    }
}

// Enhanced symptom analysis
function analyzeEmergencySymptoms(message) {
    const lowerMsg = message.toLowerCase();
    let emergencies = [];
    let symptomMatches = new Map();

    // Check each emergency condition
    for (const [condition, data] of Object.entries(emergencyConditions)) {
        const matchedSymptoms = data.symptoms.filter(symptom => lowerMsg.includes(symptom));
        if (matchedSymptoms.length > 0) {
            // Calculate match percentage
            const matchPercentage = (matchedSymptoms.length / data.symptoms.length) * 100;
            
            emergencies.push({
                condition,
                matchedSymptoms,
                matchPercentage,
                priority: data.priority,
                data
            });

            // Track symptom matches for correlation
            matchedSymptoms.forEach(symptom => {
                if (!symptomMatches.has(symptom)) {
                    symptomMatches.set(symptom, []);
                }
                symptomMatches.get(symptom).push(condition);
            });
        }
    }

    // Sort emergencies by priority and match percentage
    emergencies.sort((a, b) => {
        if (a.priority === b.priority) {
            return b.matchPercentage - a.matchPercentage;
        }
        return a.priority - b.priority;
    });

    return {
        emergencies,
        symptomMatches
    };
}

// Enhanced emergency response generation
function generateEmergencyResponse(emergencyData) {
    const { emergencies, symptomMatches } = emergencyData;
    if (emergencies.length === 0) return null;

    let response = '🚨 EMERGENCY MEDICAL SITUATION DETECTED\n\n';
    
    // Add primary emergency information
    const primaryEmergency = emergencies[0];
    response += `HIGHEST PRIORITY: ${primaryEmergency.data.message}\n\n`;
    response += 'IMMEDIATE ACTIONS REQUIRED:\n';
    primaryEmergency.data.immediateActions.forEach(action => {
        response += `${action}\n`;
    });
    
    response += `\nADDITIONAL INFORMATION:\n${primaryEmergency.data.additionalInfo}\n\n`;

    // If there are multiple possible emergencies
    if (emergencies.length > 1) {
        response += '⚠️ ADDITIONAL CONCERNS DETECTED:\n';
        emergencies.slice(1).forEach(emergency => {
            response += `• ${emergency.data.message}\n`;
        });
        response += '\n';
    }

    // Add real-time assistance information
    response += '📍 LOCATION & ASSISTANCE:\n';
    response += '• Determining nearest emergency facilities...\n';
    response += '• Calculating fastest route...\n';
    response += '• Checking ER wait times...\n\n';

    response += '⚠️ IMPORTANT REMINDERS:\n';
    response += '• Stay on the line with 911 once called\n';
    response += '• Do not drive yourself if experiencing severe symptoms\n';
    response += '• Have someone meet emergency responders if possible\n';
    response += '• Keep your phone nearby and charged\n\n';

    response += '🏥 Emergency services are being notified. Stay calm and follow the instructions above.';

    return response;
}

// Enhanced emergency handling in handleSymptomQuery
async function handleSymptomQuery(message) {
    const emergencyData = analyzeEmergencySymptoms(message);
    if (emergencyData.emergencies.length > 0) {
        // Generate and display emergency response
        const emergencyResponse = generateEmergencyResponse(emergencyData);
        addBotMessage(emergencyResponse);

        // Track emergency response in learning system
        emergencyData.emergencies.forEach(emergency => {
            ChatLearningSystem.learnFromSymptoms(
                emergency.matchedSymptoms,
                emergency.condition,
                'emergency_response'
            );
        });

        // For critical emergencies, provide immediate location assistance
        const criticalEmergency = emergencyData.emergencies.find(e => e.data.severity === 'CRITICAL');
        if (criticalEmergency) {
            try {
                // Get user's location and find nearest emergency facilities
                const position = await getCurrentPosition();
                const nearestER = await window.HospitalHelper.findNearestER(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                if (nearestER) {
                    // Provide essential emergency facility information
                    addBotMessage(`
🚨 NEAREST EMERGENCY FACILITY:
🏥 ${nearestER.name}
📍 Distance: ${nearestER.distance.toFixed(1)} miles
🏢 Address: ${nearestER.address}
📞 Phone: ${nearestER.phone || 'Emergency: 911'}

⚡ CRITICAL REMINDER: If this is a life-threatening emergency, call 911 immediately.
                    `);
                }

                // Provide emergency action buttons
                addSuggestionChips([
                    '🚑 Call 911',
                    '🏥 Check ER Wait Time',
                    '🚨 Emergency Instructions'
                ]);
            } catch (error) {
                console.error('Error finding nearest ER:', error);
                // Fallback emergency guidance
                addBotMessage('🚨 CALL 911 IMMEDIATELY - Unable to determine nearest facility');
            }
        }
        return;
    }

    // Handle non-emergency symptoms
    const symptoms = extractSymptoms(message);
    const severity = analyzeSymptomSeverity(symptoms);
    
    // Learn from symptom patterns
    if (symptoms.length > 0) {
        ChatLearningSystem.learnFromSymptoms(
            symptoms,
            severity,
            'regular_response'
        );
    }

    if (symptoms.length === 0) {
        addBotMessage('Could you describe your symptoms in more detail?');
        addSuggestionChips([
            'I have a headache',
            'Fever and cough',
            'Stomach pain'
        ]);
        return;
    }

    // Save symptoms to user profile if logged in
    if (userProfile) {
        userProfile.symptoms = userProfile.symptoms || [];
        userProfile.symptoms.push({
            date: new Date(),
            symptoms: symptoms,
            severity: severity
        });
    }

    // Generate appropriate response based on severity
    let response = 'Based on your symptoms:\n\n';
    
    if (severity === 'high') {
        response += '⚠️ Your symptoms suggest you should seek medical attention soon.\n\n';
        addBotMessage(response);
        
        // Offer immediate assistance options
        addSuggestionChips([
            'Find nearest ER',
            'Check ER wait times',
            'Get directions'
        ]);
    } else {
        response += generateSelfCareAdvice(symptoms);
        addBotMessage(response);
        
        addSuggestionChips([
            'Track symptoms',
            'Find a clinic',
            'Get self-care tips'
        ]);
    }
}

// Generate self-care advice
function generateSelfCareAdvice(symptoms) {
    let advice = 'Recommended self-care steps:\n\n';
    
    const selfCareMap = {
        headache: [
            'Rest in a quiet, dark room',
            'Stay hydrated',
            'Try over-the-counter pain relievers',
            'Apply a cold or warm compress'
        ],
        fever: [
            'Rest and stay hydrated',
            'Take acetaminophen or ibuprofen',
            'Use a light blanket if chilled',
            'Monitor your temperature'
        ],
        cough: [
            'Stay hydrated',
            'Use honey for soothing (if over 1 year old)',
            'Use a humidifier',
            'Try over-the-counter cough medicine'
        ],
        // Add more symptoms and their self-care advice
    };

    symptoms.forEach(symptom => {
        if (selfCareMap[symptom]) {
            advice += `For ${symptom}:\n`;
            selfCareMap[symptom].forEach(tip => {
                advice += `• ${tip}\n`;
            });
            advice += '\n';
        }
    });

    advice += '\nMonitor your symptoms and seek medical attention if they worsen.';
    return advice;
}

// Handle general queries
function handleGeneralQuery(message) {
    // Check if we've already greeted the user in this session
    const hasGreeted = chatHistory.some(msg => 
        msg.role === 'bot' && msg.content.includes('Hello! I\'m your medical assistant')
    );

    // Check the context of the conversation
    const lastUserMessage = chatHistory.filter(msg => msg.role === 'user').pop();
    const lastBotMessage = chatHistory.filter(msg => msg.role === 'bot').pop();

    // If user's message is too short or unclear
    if (message.length < 3) {
        addBotMessage('Could you please provide more details about what you need help with?');
        return;
    }

    // If this is a follow-up message
    if (lastBotMessage && lastUserMessage) {
        // Check if user's message might be clarifying a previous query
        const relatedSuggestions = getContextualSuggestions(message, lastBotMessage.content);
        if (relatedSuggestions) {
            addBotMessage(relatedSuggestions.message);
            addSuggestionChips(relatedSuggestions.chips);
            return;
        }
    }

    // If no specific context is found, provide a more engaging general response
    const generalResponses = [
        'I\'m here to help with your medical needs. What would you like to know about?',
        'I can assist you with several medical services. What are you looking for?',
        'How may I assist you with your healthcare needs today?',
        'I\'m your medical assistant. What kind of help do you need?'
    ];

    const randomResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    addBotMessage(randomResponse);

    // Provide relevant suggestion chips based on message content
    const suggestedChips = getSuggestedChipsBasedOnContent(message);
    addSuggestionChips(suggestedChips);
}

// Helper function to get contextual suggestions
function getContextualSuggestions(message, lastBotMessage) {
    const lowerMessage = message.toLowerCase();
    
    // Define common contexts and their related suggestions
    const contexts = {
        symptoms: {
            keywords: ['pain', 'feel', 'hurt', 'ache', 'sick'],
            message: 'What symptoms are you experiencing?',
            chips: ['Check symptoms', 'Find nearest hospital', 'Emergency services']
        },
        emergency: {
            keywords: ['emergency', 'urgent', 'serious', 'bad'],
            message: 'Do you need immediate medical attention?',
            chips: ['Find ER', 'Check wait times', 'Call emergency']
        },
        medication: {
            keywords: ['medicine', 'drug', 'prescription', 'pill'],
            message: 'What would you like to know about medications?',
            chips: ['Review medications', 'Check interactions', 'Set reminders']
        },
        location: {
            keywords: ['where', 'location', 'near', 'closest'],
            message: 'I can help you find medical facilities nearby.',
            chips: ['Find hospital', 'Show clinics', 'Get directions']
        }
    };

    // Check if message matches any context
    for (const [context, data] of Object.entries(contexts)) {
        if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
            return data;
        }
    }

    return null;
}

// Helper function to get suggested chips based on message content
function getSuggestedChipsBasedOnContent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Default suggestions
    let suggestions = [
        'Check ER wait times',
        'Find nearest hospital',
        'Check symptoms'
    ];

    // Add more specific suggestions based on message content
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
        suggestions = [
            'Describe symptoms',
            'Find urgent care',
            'Check wait times'
        ];
    } else if (lowerMessage.includes('medicine') || lowerMessage.includes('drug')) {
        suggestions = [
            'Review medications',
            'Check interactions',
            'Set reminders'
        ];
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
        suggestions = [
            'Find ER',
            'Get directions',
            'Call emergency'
        ];
    }

    return suggestions;
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

// Enhanced addBotMessage with better error handling
function addBotMessage(message) {
    if (!message) {
        console.error('Attempted to add undefined bot message');
        message = "I apologize, but I encountered an error. Please try again.";
    }

    const chatContainer = document.querySelector('.chat-messages');
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }

    const messageId = Date.now().toString();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.setAttribute('data-message-id', messageId);
    
    try {
        // Format message with markdown-like syntax
        const formattedMessage = formatMessage(message.toString());
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-text">${formattedMessage}</div>
            </div>
            <div class="message-time">${formatTime(new Date())}</div>
            <div class="message-feedback">
                <button onclick="provideFeedback('${messageId}', true)" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-thumbs-up"></i> Helpful
                </button>
                <button onclick="provideFeedback('${messageId}', false)" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-thumbs-down"></i> Not Helpful
                </button>
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (error) {
        console.error('Error formatting bot message:', error);
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-text">I apologize, but I encountered an error. Please try again.</div>
            </div>
            <div class="message-time">${formatTime(new Date())}</div>
        `;
        chatContainer.appendChild(messageDiv);
    }
}

function addSuggestionChips(suggestions) {
    const container = document.querySelector('.suggestion-chips');
    if (!container) {
        console.warn('Suggestion chips container not found');
        return;
    }
    
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

// Handle registration related queries
function handleRegistrationQuery(message) {
    // Keywords for registration-related queries
    const registrationKeywords = [
        'register', 'registration', 'sign up', 'enroll',
        'documents', 'bring', 'need to bring',
        'online registration', 'website registration',
        'emergency registration', 'urgent registration'
    ];

    // Check if message contains registration-related keywords
    const isRegistrationQuery = registrationKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isRegistrationQuery) {
        return handleRegistrationInquiry(message);
    }

    return null;
}

// Handle profile-related queries
async function handleProfileQuery(message) {
    // Check if email is provided in the message
    const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    
    if (emailMatch) {
        const email = emailMatch[0];
        const userResponse = window.userProfileManager.formatUserResponse(email);
        addBotMessage(userResponse);
        
        // Add relevant suggestion chips
        addSuggestionChips([
            'Update my information',
            'Check my symptoms',
            'Schedule a visit'
        ]);
    } else {
        addBotMessage('Please provide your registered email address to access your information.');
        addSuggestionChips([
            'Register new patient',
            'I need help',
            'Emergency services'
        ]);
    }
}

// Add event listener for user registration
document.addEventListener('userRegistered', (event) => {
    const user = event.detail;
    addBotMessage(`
        Welcome ${user.firstName}! Your registration is complete. 
        You can now access your profile information using your email address: ${user.email}
    `);
    addSuggestionChips([
        'View my profile',
        'Update information',
        'Check symptoms'
    ]);
});

// Handle user feedback
function provideFeedback(messageId, wasHelpful) {
    const event = new CustomEvent('chatFeedback', {
        detail: { messageId, wasHelpful }
    });
    document.dispatchEvent(event);
    
    // Update UI to show feedback was recorded
    const feedbackDiv = document.querySelector(`[data-message-id="${messageId}"] .message-feedback`);
    if (feedbackDiv) {
        feedbackDiv.innerHTML = `<span class="feedback-recorded">Thank you for your feedback!</span>`;
    }
}

// Helper function to format messages
function formatMessage(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/•/g, '<br>•')
        .replace(/📍/g, '<i class="fas fa-map-marker-alt"></i>')
        .replace(/⚠️/g, '<i class="fas fa-exclamation-triangle text-warning"></i>')
        .replace(/🚨/g, '<i class="fas fa-exclamation-circle text-danger"></i>')
        .replace(/✓/g, '<i class="fas fa-check text-success"></i>')
        .replace(/🏥/g, '<i class="fas fa-hospital"></i>')
        .replace(/🚑/g, '<i class="fas fa-ambulance"></i>')
        .replace(/👋/g, '<i class="fas fa-hand-wave"></i>')
        .replace(/❗/g, '<i class="fas fa-exclamation"></i>');
}

// Helper function to format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
} 