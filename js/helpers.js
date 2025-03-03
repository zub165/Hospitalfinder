// Cache for API responses
const apiCache = new Map();

// Fetch with cache helper
async function cachedFetch(url, options = {}, cacheDuration = window.AppConfig.cache.duration) {
    const cacheKey = url + JSON.stringify(options);
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.data;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin,
                ...(options.headers || {})
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        apiCache.set(cacheKey, {
            timestamp: Date.now(),
            data
        });
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Get traffic conditions around hospital
async function getTrafficConditions(hospitalLat, hospitalLon, radius = 2000) {
    try {
        const response = await cachedFetch(
            `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${window.AppConfig.tomtomApiKey}&point=${hospitalLat},${hospitalLon}&radius=${radius}`
        );
        
        // Calculate average traffic flow
        const flows = response.flowSegmentData || [];
        const avgFlow = flows.reduce((sum, segment) => {
            return sum + (segment.currentSpeed / segment.freeFlowSpeed);
        }, 0) / (flows.length || 1);
        
        // Calculate traffic impact
        const trafficFactor = avgFlow < 0.5 ? 1.4 : // Heavy traffic
                            avgFlow < 0.8 ? 1.2 : // Moderate traffic
                            1.0; // Light traffic
        
        return {
            trafficFactor,
            congestion: avgFlow < 0.5 ? 'heavy' : avgFlow < 0.8 ? 'moderate' : 'light',
            flow: avgFlow
        };
    } catch (error) {
        console.error('Traffic API error:', error);
        return { trafficFactor: 1, congestion: 'unknown', flow: 1 };
    }
}

// Get weather conditions
async function getWeatherConditions(lat, lon) {
    try {
        const response = await cachedFetch(
            `${window.AppConfig.weatherApi.base}${window.AppConfig.weatherApi.current}?lat=${lat}&lon=${lon}&appid=${window.AppConfig.weatherApiKey}`,
            {},
            window.AppConfig.cache.weatherDuration
        );
        
        const weather = response.weather[0];
        const temp = response.main.temp - 273.15; // Convert to Celsius
        
        // Calculate weather impact factors
        let weatherFactor = 1.0;
        let weatherRisk = 'low';
        
        // Temperature impact
        if (temp < 0 || temp > 35) {
            weatherFactor *= 1.3; // Extreme temperatures
            weatherRisk = 'high';
        } else if (temp < 5 || temp > 30) {
            weatherFactor *= 1.2; // Uncomfortable temperatures
            weatherRisk = 'moderate';
        }
        
        // Weather condition impact
        switch (weather.main.toLowerCase()) {
            case 'thunderstorm':
                weatherFactor *= 1.5;
                weatherRisk = 'high';
                break;
            case 'snow':
            case 'rain':
                weatherFactor *= 1.3;
                weatherRisk = 'moderate';
                break;
            case 'drizzle':
            case 'fog':
                weatherFactor *= 1.1;
                weatherRisk = 'low';
                break;
        }
        
        // Air quality impact (if available)
        if (response.main.pressure < 1000) {
            weatherFactor *= 1.1; // Low pressure systems can affect health
        }
        
        return {
            weatherFactor,
            condition: weather.main,
            temperature: temp,
            risk: weatherRisk,
            description: weather.description,
            humidity: response.main.humidity,
            pressure: response.main.pressure
        };
    } catch (error) {
        console.error('Weather API error:', error);
        return {
            weatherFactor: 1,
            condition: 'unknown',
            temperature: null,
            risk: 'unknown'
        };
    }
}

// Historical patterns by time of day and day of week
const historicalPatterns = {
    weekday: {
        morning: { factor: 1.2, baseline: 30, peak: false },    // 6-10
        midday: { factor: 1.0, baseline: 25, peak: false },     // 10-16
        evening: { factor: 1.4, baseline: 35, peak: true },     // 16-22
        night: { factor: 0.8, baseline: 20, peak: false }       // 22-6
    },
    weekend: {
        morning: { factor: 0.9, baseline: 25, peak: false },
        midday: { factor: 1.1, baseline: 30, peak: true },
        evening: { factor: 1.3, baseline: 35, peak: true },
        night: { factor: 1.0, baseline: 25, peak: false }
    }
};

// Get time period
function getTimePeriod(hour) {
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 16) return 'midday';
    if (hour >= 16 && hour < 22) return 'evening';
    return 'night';
}

// Calculate estimated ER wait time
async function estimateERWaitTime(hospital, currentPatients = null) {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const timePeriod = getTimePeriod(hour);
    
    // Get base pattern
    const pattern = historicalPatterns[isWeekend ? 'weekend' : 'weekday'][timePeriod];
    
    try {
        // Get real-time factors
        const [traffic, weather] = await Promise.all([
            getTrafficConditions(hospital.position.lat, hospital.position.lon),
            getWeatherConditions(hospital.position.lat, hospital.position.lon)
        ]);
        
        // Calculate wait time
        let waitTime = pattern.baseline;
        let confidenceFactors = [];
        
        // Adjust for current patient load
        if (currentPatients) {
            const loadFactor = currentPatients / hospital.averageCapacity;
            waitTime *= loadFactor;
            confidenceFactors.push('current patient load');
        }
        
        // Apply time-based factors
        waitTime *= pattern.factor;
        confidenceFactors.push('historical patterns');
        
        // Apply traffic factor
        if (traffic.congestion !== 'unknown') {
            waitTime *= traffic.trafficFactor;
            confidenceFactors.push('real-time traffic');
        }
        
        // Apply weather factor
        if (weather.condition !== 'unknown') {
            waitTime *= weather.weatherFactor;
            confidenceFactors.push('weather conditions');
        }
        
        // Calculate confidence level
        let confidence = confidenceFactors.length >= 3 ? 'high' :
                        confidenceFactors.length >= 2 ? 'medium' : 'low';
                        
        // Add peak time warning
        const isPeakTime = pattern.peak;
        
        // Round to nearest 5 minutes
        waitTime = Math.round(waitTime / 5) * 5;
        
        return {
            estimatedWait: waitTime,
            confidence,
            factors: {
                timeOfDay: timePeriod,
                traffic: traffic.congestion,
                weather: {
                    condition: weather.condition,
                    temperature: Math.round(weather.temperature),
                    risk: weather.risk
                },
                isWeekend,
                isPeakTime
            },
            details: {
                confidenceFactors,
                weatherDescription: weather.description,
                humidity: weather.humidity,
                pressure: weather.pressure
            }
        };
    } catch (error) {
        console.error('Error estimating wait time:', error);
        return {
            estimatedWait: pattern.baseline,
            confidence: 'low',
            factors: {
                timeOfDay: timePeriod,
                isWeekend
            }
        };
    }
}

// Format wait time message
function formatWaitTimeMessage(estimate) {
    let message = `The estimated wait time is ${estimate.estimatedWait} minutes`;
    
    // Add factor explanations
    const factors = [];
    if (estimate.factors.traffic !== 'unknown') {
        factors.push(`${estimate.factors.traffic} traffic conditions`);
    }
    if (estimate.factors.weather.condition !== 'unknown') {
        const weather = estimate.factors.weather;
        factors.push(`${weather.condition.toLowerCase()} weather (${weather.temperature}°C, ${weather.risk} risk)`);
    }
    factors.push(`${estimate.factors.timeOfDay} ${estimate.factors.isWeekend ? 'weekend' : 'weekday'} timing`);
    
    if (factors.length > 0) {
        message += `\n\nFactors considered:\n- ${factors.join('\n- ')}`;
    }
    
    // Add peak time warning
    if (estimate.factors.isPeakTime) {
        message += '\n\n⚠️ Note: This is typically a peak time for ER visits.';
    }
    
    // Add confidence level and details
    message += `\n\nConfidence Level: ${estimate.confidence.toUpperCase()}`;
    if (estimate.details) {
        message += `\nBased on: ${estimate.details.confidenceFactors.join(', ')}`;
        if (estimate.details.weatherDescription) {
            message += `\nDetailed weather: ${estimate.details.weatherDescription}`;
            if (estimate.details.humidity) {
                message += `, ${estimate.details.humidity}% humidity`;
            }
        }
    }
    
    return message;
}

// Export helpers
window.ERHelpers = {
    estimateERWaitTime,
    formatWaitTimeMessage,
    getTrafficConditions,
    getWeatherConditions
}; 