// Cache for medication data
const medicationCache = new Map();

// Normalize medication name
function normalizeMedicationName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Search medication information online
async function searchMedicationInfo(medicationName) {
    const normalizedName = normalizeMedicationName(medicationName);
    
    // Check cache first
    if (medicationCache.has(normalizedName)) {
        return medicationCache.get(normalizedName);
    }
    
    try {
        // Use RxNorm API to get standardized medication information
        const response = await fetch(
            `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(normalizedName)}&maxEntries=1`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch medication info');
        }
        
        const data = await response.json();
        
        if (!data.approximateGroup?.candidate?.[0]) {
            throw new Error('Medication not found');
        }
        
        // Get detailed information using RxCUI
        const rxcui = data.approximateGroup.candidate[0].rxcui;
        const detailsResponse = await fetch(
            `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allrelated.json`
        );
        
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch medication details');
        }
        
        const details = await detailsResponse.json();
        
        // Extract relevant information
        const medicationInfo = {
            standardName: data.approximateGroup.candidate[0].name,
            rxcui: rxcui,
            genericNames: [],
            brandNames: [],
            drugClass: [],
            uses: []
        };
        
        // Process related drug information
        if (details.allRelatedGroup?.conceptGroup) {
            details.allRelatedGroup.conceptGroup.forEach(group => {
                switch(group.tty) {
                    case 'IN': // Ingredient
                        medicationInfo.genericNames = group.conceptProperties?.map(prop => prop.name) || [];
                        break;
                    case 'BN': // Brand Name
                        medicationInfo.brandNames = group.conceptProperties?.map(prop => prop.name) || [];
                        break;
                    case 'EQG': // Generic Drug Group
                        medicationInfo.drugClass = group.conceptProperties?.map(prop => prop.name) || [];
                        break;
                }
            });
        }
        
        // Cache the results
        medicationCache.set(normalizedName, medicationInfo);
        return medicationInfo;
        
    } catch (error) {
        console.error('Error fetching medication info:', error);
        return {
            standardName: medicationName,
            genericNames: [],
            brandNames: [],
            drugClass: [],
            uses: [],
            error: 'Could not verify medication information'
        };
    }
}

// Process medication history
async function processMedicationHistory(medications) {
    const processedMedications = [];
    
    for (const med of medications) {
        const info = await searchMedicationInfo(med.name);
        
        processedMedications.push({
            ...med,
            standardName: info.standardName,
            genericNames: info.genericNames,
            brandNames: info.brandNames,
            drugClass: info.drugClass,
            verificationStatus: info.error ? 'unverified' : 'verified',
            error: info.error
        });
    }
    
    return processedMedications;
}

// Format medication for display
function formatMedicationInfo(medication) {
    let info = `📋 ${medication.standardName}`;
    
    if (medication.dosage) {
        info += `\nDosage: ${medication.dosage}`;
    }
    
    if (medication.frequency) {
        info += `\nFrequency: ${medication.frequency}`;
    }
    
    if (medication.genericNames.length > 0) {
        info += `\nGeneric Names: ${medication.genericNames.join(', ')}`;
    }
    
    if (medication.brandNames.length > 0) {
        info += `\nBrand Names: ${medication.brandNames.join(', ')}`;
    }
    
    if (medication.drugClass.length > 0) {
        info += `\nDrug Class: ${medication.drugClass.join(', ')}`;
    }
    
    if (medication.verificationStatus === 'unverified') {
        info += '\n⚠️ Warning: Medication information could not be verified';
    }
    
    return info;
}

// Check for drug interactions
async function checkDrugInteractions(medications) {
    if (medications.length < 2) return [];
    
    try {
        // Get RxCUIs for all medications
        const rxcuis = medications
            .filter(med => med.rxcui)
            .map(med => med.rxcui);
            
        if (rxcuis.length < 2) return [];
        
        // Use RxNav API to check interactions
        const response = await fetch(
            `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to check drug interactions');
        }
        
        const data = await response.json();
        
        if (!data.fullInteractionTypeGroup) return [];
        
        // Process and format interactions
        const interactions = [];
        data.fullInteractionTypeGroup.forEach(group => {
            group.fullInteractionType.forEach(interaction => {
                interaction.interactionPair.forEach(pair => {
                    interactions.push({
                        drugs: [
                            pair.interactionConcept[0].minConceptItem.name,
                            pair.interactionConcept[1].minConceptItem.name
                        ],
                        severity: pair.severity,
                        description: pair.description
                    });
                });
            });
        });
        
        return interactions;
        
    } catch (error) {
        console.error('Error checking drug interactions:', error);
        return [];
    }
}

// Format interaction warnings
function formatInteractionWarnings(interactions) {
    if (interactions.length === 0) return '';
    
    let message = '\n\n⚠️ Potential Drug Interactions Found:\n';
    
    interactions.forEach(interaction => {
        message += `\n🔸 ${interaction.drugs[0]} + ${interaction.drugs[1]}`;
        message += `\n   Severity: ${interaction.severity}`;
        message += `\n   ${interaction.description}\n`;
    });
    
    return message;
}

// Export helpers
window.MedicationHelper = {
    processMedicationHistory,
    formatMedicationInfo,
    checkDrugInteractions,
    formatInteractionWarnings
}; 