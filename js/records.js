// Mock data for medical records
const mockRecords = [
    {
        id: 1,
        date: '2024-03-01',
        hospital: 'General Hospital',
        symptoms: [
            { name: 'Fever', severity: 7 },
            { name: 'Cough', severity: 5 }
        ],
        status: 'completed'
    },
    {
        id: 2,
        date: '2024-02-15',
        hospital: 'City Medical Center',
        symptoms: [
            { name: 'Headache', severity: 8 },
            { name: 'Nausea', severity: 4 }
        ],
        status: 'completed'
    },
    {
        id: 3,
        date: '2024-03-10',
        hospital: 'General Hospital',
        symptoms: [
            { name: 'Chest Pain', severity: 9 },
            { name: 'Shortness of Breath', severity: 7 }
        ],
        status: 'pending'
    }
];

let currentPage = 1;
const recordsPerPage = 10;
let filteredRecords = [...mockRecords];

function initializeRecords() {
    displayRecords();
    setupSearchAndFilter();
    updatePagination();
}

function setupSearchAndFilter() {
    const searchInput = document.getElementById('recordSearch');
    const filterSelect = document.getElementById('recordFilter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterRecords(searchTerm, filterSelect.value);
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            filterRecords(searchTerm, e.target.value);
        });
    }
}

function filterRecords(searchTerm, filterValue) {
    filteredRecords = mockRecords.filter(record => {
        const matchesSearch = !searchTerm || 
            record.hospital.toLowerCase().includes(searchTerm) ||
            record.symptoms.some(s => s.name.toLowerCase().includes(searchTerm));

        const matchesFilter = filterValue === 'all' ||
            (filterValue === 'recent' && isRecent(record.date)) ||
            (filterValue === record.status);

        return matchesSearch && matchesFilter;
    });

    currentPage = 1;
    displayRecords();
    updatePagination();
}

function isRecent(dateString) {
    const recordDate = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return recordDate >= thirtyDaysAgo;
}

function displayRecords() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const recordsToShow = filteredRecords.slice(startIndex, endIndex);

    tbody.innerHTML = recordsToShow.map(record => `
        <tr>
            <td>${formatDate(record.date)}</td>
            <td>${record.hospital}</td>
            <td>
                <div class="symptoms-list">
                    ${record.symptoms.map(symptom => `
                        <span class="symptom-badge" style="--severity-color: ${getSeverityColor(symptom.severity)}">
                            ${symptom.name} (${symptom.severity}/10)
                        </span>
                    `).join('')}
                </div>
            </td>
            <td>
                <span class="status-badge status-${record.status}">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="viewRecord(${record.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="downloadRecord(${record.id})">
                    <i class="fas fa-download"></i> Download
                </button>
            </td>
        </tr>
    `).join('');
}

function updatePagination() {
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(startRecord + recordsPerPage - 1, totalRecords);

    // Update records info
    const recordsInfo = document.querySelector('.records-info');
    if (recordsInfo) {
        recordsInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;
    }

    // Update pagination buttons
    const prevButton = document.querySelector('.pagination-controls button:first-child');
    const nextButton = document.querySelector('.pagination-controls button:last-child');
    
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
    }
    if (nextButton) {
        nextButton.disabled = currentPage === totalPages;
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRecords();
        updatePagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayRecords();
        updatePagination();
    }
}

function viewRecord(recordId) {
    const record = mockRecords.find(r => r.id === recordId);
    if (record) {
        // Here you would typically show a modal or navigate to a detailed view
        console.log('Viewing record:', record);
        alert('Record details will be shown in a modal (to be implemented)');
    }
}

function downloadRecord(recordId) {
    const record = mockRecords.find(r => r.id === recordId);
    if (record) {
        // Here you would typically generate and download a PDF or other format
        console.log('Downloading record:', record);
        alert('Record download will be implemented');
    }
}

// Helper functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getSeverityColor(severity) {
    const colors = {
        1: '#FFD700',
        2: '#FFC700',
        3: '#FFB700',
        4: '#FFA700',
        5: '#FF9700',
        6: '#FF8700',
        7: '#FF7700',
        8: '#FF6700',
        9: '#FF5700',
        10: '#FF4700'
    };
    return colors[severity] || '#FF4700';
}

// Add tab initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize records when the tab is shown
    const recordsTab = document.getElementById('records-tab');
    if (recordsTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active') && mutation.target.classList.contains('show')) {
                    initializeRecords();
                }
            });
        });

        observer.observe(recordsTab, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Initial check in case the tab is already active
        if (recordsTab.classList.contains('active') && recordsTab.classList.contains('show')) {
            initializeRecords();
        }
    }
}); 