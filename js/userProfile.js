// User Profile Management
class UserProfileManager {
    constructor() {
        this.users = new Map();
        this.adminEmail = ''; // Admin email to receive notifications
        this.loadUsers();
    }

    // Load users from localStorage
    loadUsers() {
        const savedUsers = localStorage.getItem('registeredUsers');
        if (savedUsers) {
            const userArray = JSON.parse(savedUsers);
            userArray.forEach(user => {
                this.users.set(user.email, user);
            });
        }
    }

    // Save users to localStorage
    saveUsers() {
        const userArray = Array.from(this.users.values());
        localStorage.setItem('registeredUsers', JSON.stringify(userArray));
    }

    // Set admin email for notifications
    setAdminEmail(email) {
        this.adminEmail = email;
    }

    // Send email notification
    async sendEmailNotification(userData) {
        if (!this.adminEmail) {
            console.error('Admin email not set. Please set admin email first.');
            return;
        }

        const emailData = {
            to: this.adminEmail,
            subject: 'New User Registration',
            html: `
                <h2>New User Registration</h2>
                <p>A new user has registered in the system.</p>
                <h3>User Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
                    <li><strong>Email:</strong> ${userData.email}</li>
                    <li><strong>Phone:</strong> ${userData.phone}</li>
                    <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <h3>Medical Information:</h3>
                <ul>
                    <li><strong>Allergies:</strong> ${userData.medicalHistory?.allergies || 'None reported'}</li>
                    <li><strong>Current Medications:</strong> ${userData.medicalHistory?.medications?.length || 0} medications</li>
                </ul>
                <p>Please log in to the admin panel for complete user details.</p>
            `
        };

        try {
            // Send email using your email service
            await this.sendEmail(emailData);
            console.log('Registration notification email sent successfully');
        } catch (error) {
            console.error('Failed to send registration notification:', error);
        }
    }

    // Email sending implementation
    async sendEmail({ to, subject, html }) {
        // You can implement this using your preferred email service
        // Example using Email.js or similar service:
        try {
            const response = await emailjs.send(
                'YOUR_SERVICE_ID',
                'YOUR_TEMPLATE_ID',
                {
                    to_email: to,
                    subject: subject,
                    html_content: html
                },
                'YOUR_USER_ID'
            );
            return response;
        } catch (error) {
            throw new Error('Failed to send email: ' + error.message);
        }
    }

    // Modified registerUser method to include email notification
    async registerUser(userData) {
        const { email } = userData;
        if (this.users.has(email)) {
            throw new Error('Email already registered');
        }

        const newUser = {
            ...userData,
            registrationDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            visits: [],
            medicalRecords: []
        };

        this.users.set(email, newUser);
        this.saveUsers();

        // Send email notification
        await this.sendEmailNotification(newUser);

        return newUser;
    }

    // Get user by email
    getUserByEmail(email) {
        return this.users.get(email);
    }

    // Update user information
    updateUser(email, updates) {
        if (!this.users.has(email)) {
            throw new Error('User not found');
        }

        const user = this.users.get(email);
        const updatedUser = {
            ...user,
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        this.users.set(email, updatedUser);
        this.saveUsers();
        return updatedUser;
    }

    // Add medical visit
    addVisit(email, visitData) {
        if (!this.users.has(email)) {
            throw new Error('User not found');
        }

        const user = this.users.get(email);
        const visit = {
            ...visitData,
            visitDate: new Date().toISOString(),
            visitId: Date.now().toString()
        };

        user.visits.push(visit);
        this.users.set(email, user);
        this.saveUsers();
        return visit;
    }

    // Get user summary
    getUserSummary(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        return {
            personalInfo: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth
            },
            medicalHistory: {
                allergies: user.medicalHistory?.allergies || [],
                medications: user.medicalHistory?.medications || [],
                conditions: user.medicalHistory?.pastMedical || []
            },
            recentVisits: user.visits.slice(-3),
            lastUpdated: user.lastUpdated
        };
    }

    // Format response for chat
    formatUserResponse(email) {
        const user = this.getUserByEmail(email);
        if (!user) {
            return "User not found. Please register first.";
        }

        return `
            <div class="user-profile-summary">
                <h4>Patient Information</h4>
                <div class="profile-section">
                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>DOB:</strong> ${user.dateOfBirth}</p>
                    <p><strong>Contact:</strong> ${user.phone}</p>
                </div>

                <h4>Medical History</h4>
                <div class="profile-section">
                    <p><strong>Allergies:</strong> ${user.medicalHistory?.allergies || 'None reported'}</p>
                    <p><strong>Current Medications:</strong> ${user.medicalHistory?.medications || 'None reported'}</p>
                </div>

                <h4>Recent Visits</h4>
                <div class="profile-section">
                    ${this.formatRecentVisits(user.visits)}
                </div>
            </div>
        `;
    }

    // Format recent visits
    formatRecentVisits(visits) {
        if (!visits || visits.length === 0) {
            return '<p>No recent visits</p>';
        }

        return visits.slice(-3).map(visit => `
            <div class="visit-item">
                <p><strong>Date:</strong> ${new Date(visit.visitDate).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> ${visit.reason}</p>
                ${visit.symptoms ? `<p><strong>Symptoms:</strong> ${visit.symptoms.join(', ')}</p>` : ''}
            </div>
        `).join('');
    }

    // Get all registered users
    getAllUsers() {
        return Array.from(this.users.values());
    }

    // Search users by criteria
    searchUsers(criteria) {
        const users = this.getAllUsers();
        return users.filter(user => {
            return (
                user.firstName?.toLowerCase().includes(criteria.toLowerCase()) ||
                user.lastName?.toLowerCase().includes(criteria.toLowerCase()) ||
                user.email?.toLowerCase().includes(criteria.toLowerCase()) ||
                user.phone?.includes(criteria)
            );
        });
    }

    // Get user statistics
    getUserStatistics() {
        const users = this.getAllUsers();
        return {
            totalUsers: users.length,
            recentRegistrations: users.filter(user => {
                const registrationDate = new Date(user.registrationDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return registrationDate >= thirtyDaysAgo;
            }).length,
            activeUsers: users.filter(user => {
                const lastUpdated = new Date(user.lastUpdated);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return lastUpdated >= sevenDaysAgo;
            }).length
        };
    }

    // Get detailed user report
    generateUserReport(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        return {
            personalInfo: {
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                registrationDate: user.registrationDate
            },
            medicalHistory: {
                conditions: user.medicalHistory?.pastMedical || [],
                surgeries: user.medicalHistory?.pastSurgical || [],
                allergies: user.medicalHistory?.allergies || [],
                medications: user.medicalHistory?.medications || [],
                socialHistory: user.medicalHistory?.socialHistory || ''
            },
            currentSymptoms: this.formatCurrentSymptoms(user.currentSymptoms),
            visitHistory: this.formatVisitHistory(user.visits),
            lastUpdate: user.lastUpdated
        };
    }

    // Format current symptoms
    formatCurrentSymptoms(symptoms) {
        if (!symptoms) return [];
        
        return Object.entries(symptoms).map(([id, severity]) => ({
            symptom: id,
            severity: severity,
            severityLevel: this.getSeverityLevel(severity)
        }));
    }

    // Get severity level description
    getSeverityLevel(severity) {
        if (severity >= 8) return 'Severe';
        if (severity >= 5) return 'Moderate';
        return 'Mild';
    }

    // Format visit history
    formatVisitHistory(visits) {
        if (!visits) return [];

        return visits.map(visit => ({
            date: visit.visitDate,
            reason: visit.reason,
            symptoms: visit.symptoms,
            followUp: visit.followUp,
            recommendations: visit.recommendations
        }));
    }

    // Export user data (for medical records)
    exportUserData(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        return {
            timestamp: new Date().toISOString(),
            userData: this.generateUserReport(email),
            format: 'JSON',
            version: '1.0'
        };
    }

    // Get emergency contact info
    getEmergencyContact(email) {
        const user = this.getUserByEmail(email);
        return user?.emergencyContact || null;
    }

    // Format user data for admin view
    formatAdminView(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        return `
            <div class="admin-user-view">
                <div class="user-header">
                    <h3>User Profile - ${user.firstName} ${user.lastName}</h3>
                    <span class="registration-date">Registered: ${new Date(user.registrationDate).toLocaleDateString()}</span>
                </div>

                <div class="user-details">
                    <div class="detail-section">
                        <h4>Contact Information</h4>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Phone:</strong> ${user.phone}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Medical Summary</h4>
                        <p><strong>Allergies:</strong> ${user.medicalHistory?.allergies || 'None reported'}</p>
                        <p><strong>Current Medications:</strong> ${user.medicalHistory?.medications?.length || 0} medications</p>
                        <p><strong>Recent Visits:</strong> ${user.visits?.length || 0} visits</p>
                    </div>

                    <div class="detail-section">
                        <h4>Recent Activity</h4>
                        <p><strong>Last Updated:</strong> ${new Date(user.lastUpdated).toLocaleString()}</p>
                        <p><strong>Active Status:</strong> ${this.getUserActiveStatus(user)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Get user active status
    getUserActiveStatus(user) {
        const lastUpdated = new Date(user.lastUpdated);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (lastUpdated >= thirtyDaysAgo) {
            return 'Active';
        }
        return 'Inactive';
    }

    // Export all users data to CSV format
    exportUsersToCSV() {
        const users = this.getAllUsers();
        if (users.length === 0) return null;

        // Define CSV headers
        const headers = [
            'Registration Date',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Date of Birth',
            'Gender',
            'Allergies',
            'Current Medications',
            'Past Medical History',
            'Past Surgical History',
            'Social History',
            'Last Visit Date',
            'Last Updated'
        ].join(',');

        // Convert users data to CSV rows
        const csvRows = users.map(user => {
            const lastVisit = user.visits && user.visits.length > 0 
                ? new Date(user.visits[user.visits.length - 1].visitDate).toLocaleDateString()
                : 'No visits';

            return [
                new Date(user.registrationDate).toLocaleDateString(),
                this.escapeCSV(user.firstName),
                this.escapeCSV(user.lastName),
                this.escapeCSV(user.email),
                this.escapeCSV(user.phone),
                user.dateOfBirth,
                this.escapeCSV(user.gender),
                this.escapeCSV(user.medicalHistory?.allergies?.join('; ') || ''),
                this.escapeCSV(user.medicalHistory?.medications?.join('; ') || ''),
                this.escapeCSV(user.medicalHistory?.pastMedical || ''),
                this.escapeCSV(user.medicalHistory?.pastSurgical || ''),
                this.escapeCSV(user.medicalHistory?.socialHistory || ''),
                lastVisit,
                new Date(user.lastUpdated).toLocaleDateString()
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers, ...csvRows].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `user_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export single user data to CSV
    exportUserToCSV(email) {
        const user = this.getUserByEmail(email);
        if (!user) return null;

        // Create CSV for single user
        const headers = [
            'Registration Date',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Date of Birth',
            'Gender',
            'Allergies',
            'Current Medications',
            'Past Medical History',
            'Past Surgical History',
            'Social History',
            'Last Visit Date',
            'Last Updated'
        ].join(',');

        const lastVisit = user.visits && user.visits.length > 0 
            ? new Date(user.visits[user.visits.length - 1].visitDate).toLocaleDateString()
            : 'No visits';

        const userData = [
            new Date(user.registrationDate).toLocaleDateString(),
            this.escapeCSV(user.firstName),
            this.escapeCSV(user.lastName),
            this.escapeCSV(user.email),
            this.escapeCSV(user.phone),
            user.dateOfBirth,
            this.escapeCSV(user.gender),
            this.escapeCSV(user.medicalHistory?.allergies?.join('; ') || ''),
            this.escapeCSV(user.medicalHistory?.medications?.join('; ') || ''),
            this.escapeCSV(user.medicalHistory?.pastMedical || ''),
            this.escapeCSV(user.medicalHistory?.pastSurgical || ''),
            this.escapeCSV(user.medicalHistory?.socialHistory || ''),
            lastVisit,
            new Date(user.lastUpdated).toLocaleDateString()
        ].join(',');

        const csvContent = [headers, userData].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `user_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper method to escape CSV values
    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        return `"${value.toString().replace(/"/g, '""')}"`;
    }

    // Get new registrations since date
    getNewRegistrationsSince(date) {
        const targetDate = new Date(date);
        const users = this.getAllUsers();
        
        return users.filter(user => {
            const registrationDate = new Date(user.registrationDate);
            return registrationDate >= targetDate;
        });
    }

    // Export new registrations to CSV
    exportNewRegistrationsToCSV(since) {
        const newUsers = this.getNewRegistrationsSince(since);
        if (newUsers.length === 0) return null;

        // Use the same CSV export logic but only for new users
        const headers = [
            'Registration Date',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Date of Birth'
        ].join(',');

        const csvRows = newUsers.map(user => [
            new Date(user.registrationDate).toLocaleDateString(),
            this.escapeCSV(user.firstName),
            this.escapeCSV(user.lastName),
            this.escapeCSV(user.email),
            this.escapeCSV(user.phone),
            user.dateOfBirth
        ].join(','));

        const csvContent = [headers, ...csvRows].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `new_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export registration summary for email
    generateRegistrationSummary(user) {
        return {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            registrationDate: new Date(user.registrationDate).toLocaleString(),
            medicalSummary: {
                allergies: user.medicalHistory?.allergies || [],
                medications: user.medicalHistory?.medications || [],
                conditions: user.medicalHistory?.pastMedical || []
            }
        };
    }
}

// Create global instance
window.userProfileManager = new UserProfileManager();

// Export for module usage
export default window.userProfileManager; 