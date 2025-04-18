// Constants for carbon emission factors
const EMISSION_FACTORS = {
    // Transportation
    car: {
        gasoline: 0.404,    // kg CO2 per mile
        hybrid: 0.202,      // kg CO2 per mile
        electric: 0.101     // kg CO2 per mile
    },
    publicTransit: 0.177,   // kg CO2 per mile
    flight: {
        economy: 0.255,     // kg CO2 per mile
        business: 0.382,    // kg CO2 per mile
        first: 0.510       // kg CO2 per mile
    },
    
    // Energy
    electricity: {
        grid: 0.92,        // kg CO2 per kWh
        solar: 0.05,
        wind: 0.01
    },
    heating: {
        naturalGas: 5.3,   // kg CO2 per therm
        electric: 0.92,    // kg CO2 per kWh
        oil: 7.0,         // kg CO2 per gallon
        wood: 0.0         // kg CO2 per cord (considered carbon neutral)
    },
    
    // Diet
    diet: {
        omnivore: 2.5,     // kg CO2 per day
        vegetarian: 1.5,
        vegan: 1.0
    },
    
    // Waste
    waste: {
        recycling: 0.1,    // kg CO2 per kg
        composting: 0.05   // kg CO2 per kg
    }
};

// DOM Elements
const form = document.getElementById('carbonForm');
const progressSteps = document.querySelectorAll('.progress-step');
const formSections = document.querySelectorAll('.form-section');
const nextButtons = document.querySelectorAll('.next-btn');
const prevButtons = document.querySelectorAll('.prev-btn');
const calculateButton = document.querySelector('.calculate-btn');
const resultsSection = document.getElementById('results');
const totalFootprintElement = document.getElementById('totalFootprint');
const comparisonBar = document.querySelector('.bar-fill');
const suggestionsList = document.getElementById('suggestionsList');
const shareButton = document.getElementById('shareResults');
const saveButton = document.getElementById('saveResults');
const printButton = document.getElementById('printResults');
const chartContainer = document.getElementById('footprintChart');
const timelineContainer = document.getElementById('timelineChart');

// State
let currentSection = 0;
let totalFootprint = 0;
let categoryFootprints = {
    transportation: 0,
    energy: 0,
    diet: 0,
    waste: 0
};

// Initialize Chart.js
let footprintChart = null;
let timelineChart = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    setupEventListeners();
    updateProgress();
});

function initializeForm() {
    // Set initial state
    formSections[0].classList.add('active');
    progressSteps[0].classList.add('active');
    
    // Initialize next button state
    const firstNextButton = nextButtons[0];
    if (firstNextButton) {
        firstNextButton.disabled = !validateCurrentSection();
    }
}

function setupEventListeners() {
    // Prevent form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateFootprint();
    });

    // Navigation buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateCurrentSection()) {
                moveToNextSection();
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', moveToPreviousSection);
    });

    // Calculate button
    if (calculateButton) {
        calculateButton.addEventListener('click', (e) => {
            e.preventDefault();
            calculateFootprint();
        });
    }

    // Action buttons
    if (shareButton) shareButton.addEventListener('click', shareResults);
    if (saveButton) saveButton.addEventListener('click', saveResults);
    if (printButton) printButton.addEventListener('click', printResults);

    // Form validation
    form.addEventListener('input', () => {
        const currentButton = nextButtons[currentSection];
        if (currentButton) {
            currentButton.disabled = !validateCurrentSection();
        }
    });
}

function validateCurrentSection() {
    const currentSectionElement = formSections[currentSection];
    const requiredInputs = currentSectionElement.querySelectorAll('input[required], select[required]');
    
    return Array.from(requiredInputs).every(input => {
        if (input.type === 'checkbox') {
            return input.checked;
        }
        return input.value.trim() !== '';
    });
}

function moveToNextSection() {
    if (currentSection < formSections.length - 1) {
        formSections[currentSection].classList.remove('active');
        progressSteps[currentSection].classList.remove('active');
        progressSteps[currentSection].classList.add('completed');
        
        currentSection++;
        
        formSections[currentSection].classList.add('active');
        progressSteps[currentSection].classList.add('active');
        updateProgress();
        
        // Update next button state
        const currentNextButton = nextButtons[currentSection];
        if (currentNextButton) {
            currentNextButton.disabled = !validateCurrentSection();
        }
    }
}

function moveToPreviousSection() {
    if (currentSection > 0) {
        formSections[currentSection].classList.remove('active');
        progressSteps[currentSection].classList.remove('active');
        
        currentSection--;
        
        formSections[currentSection].classList.add('active');
        progressSteps[currentSection].classList.add('active');
        updateProgress();
    }
}

function updateProgress() {
    progressSteps.forEach((step, index) => {
        if (index < currentSection) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === currentSection) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function calculateFootprint() {
    // Reset totals
    totalFootprint = 0;
    categoryFootprints = {
        transportation: 0,
        energy: 0,
        diet: 0,
        waste: 0
    };

    // Calculate transportation footprint
    const carType = document.getElementById('carType').value;
    const carMiles = parseFloat(document.getElementById('carMiles').value) || 0;
    const carEmission = carMiles * EMISSION_FACTORS.car[carType];
    
    const publicTransit = parseFloat(document.getElementById('publicTransit').value) || 0;
    const publicTransitEmission = publicTransit * EMISSION_FACTORS.publicTransit;
    
    const airMiles = parseFloat(document.getElementById('airMiles').value) || 0;
    const flightClass = document.getElementById('flightClass').value;
    const flightEmission = airMiles * EMISSION_FACTORS.flight[flightClass];
    
    categoryFootprints.transportation = carEmission + publicTransitEmission + flightEmission;

    // Calculate energy footprint
    const electricitySource = document.getElementById('energySource').value;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const electricityEmission = electricity * 12 * EMISSION_FACTORS.electricity[electricitySource];
    
    const naturalGas = parseFloat(document.getElementById('naturalGas').value) || 0;
    const heatingType = document.getElementById('heatingType').value;
    const heatingEmission = naturalGas * 12 * EMISSION_FACTORS.heating[heatingType];
    
    categoryFootprints.energy = electricityEmission + heatingEmission;

    // Calculate diet footprint
    const dietType = document.getElementById('dietType').value;
    const dietEmission = EMISSION_FACTORS.diet[dietType] * 365; // Annual emissions
    
    categoryFootprints.diet = dietEmission;

    // Calculate waste footprint
    const recycling = parseFloat(document.getElementById('recycling').value) || 0;
    const composting = parseFloat(document.getElementById('composting').value) || 0;
    const wasteEmission = (recycling * EMISSION_FACTORS.waste.recycling) +
                         (composting * EMISSION_FACTORS.waste.composting);
    
    categoryFootprints.waste = wasteEmission;

    // Calculate total footprint
    totalFootprint = Object.values(categoryFootprints).reduce((sum, value) => sum + value, 0);

    // Update UI
    updateResults();
}

function updateResults() {
    totalFootprintElement.textContent = totalFootprint.toFixed(2);
    
    // Updated to use India's average carbon footprint (approximately 1.9 tons = 1900 kg per year)
    const averageFootprint = 1900; // India's average annual footprint in kg
    const percentage = Math.min((totalFootprint / averageFootprint) * 100, 100);
    comparisonBar.style.width = `${percentage}%`;
    
    const comparisonText = document.getElementById('comparisonText');
    if (totalFootprint < averageFootprint) {
        const reduction = ((1 - totalFootprint/averageFootprint) * 100).toFixed(1);
        comparisonText.textContent = `Your footprint is ${reduction}% lower than the Indian average!`;
        comparisonText.style.color = '#4CAF50';
    } else {
        const increase = ((totalFootprint/averageFootprint - 1) * 100).toFixed(1);
        comparisonText.textContent = `Your footprint is ${increase}% higher than the Indian average`;
        comparisonText.style.color = '#F44336';
    }
    
    updateChart();
    updateSuggestions();
    updateTimeline();
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function updateChart() {
    if (footprintChart) {
        footprintChart.destroy();
    }

    const ctx = chartContainer.getContext('2d');
    footprintChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Transportation', 'Energy', 'Diet', 'Waste'],
            datasets: [{
                data: Object.values(categoryFootprints),
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw.toFixed(2);
                            const percentage = ((context.raw / totalFootprint) * 100).toFixed(1);
                            return `${context.label}: ${value} kg CO2 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateSuggestions() {
    suggestionsList.innerHTML = '';
    
    // Generate suggestions based on highest impact categories
    const sortedCategories = Object.entries(categoryFootprints)
        .sort(([, a], [, b]) => b - a);
    
    sortedCategories.forEach(([category, footprint]) => {
        const suggestions = getSuggestionsForCategory(category, footprint);
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
    });
}

function getSuggestionsForCategory(category, footprint) {
    const suggestions = {
        transportation: [
            'Consider using public transportation more often',
            'Try carpooling or ridesharing',
            'If possible, switch to an electric vehicle',
            'Plan your trips to minimize driving'
        ],
        energy: [
            'Switch to renewable energy sources',
            'Improve home insulation',
            'Use energy-efficient appliances',
            'Turn off lights and electronics when not in use'
        ],
        diet: [
            'Reduce meat consumption',
            'Buy local and seasonal produce',
            'Minimize food waste',
            'Consider plant-based alternatives'
        ],
        waste: [
            'Increase recycling efforts',
            'Start composting organic waste',
            'Reduce single-use plastics',
            'Buy products with minimal packaging'
        ]
    };

    return suggestions[category] || [];
}

function updateTimeline() {
    // Destroy existing chart if it exists
    if (timelineChart) {
        timelineChart.destroy();
    }

    const averageReduction = 0.1; // 10% annual reduction
    const years = 5;
    const timelineData = [];
    
    // Calculate projected footprint for each year
    for (let i = 0; i <= years; i++) {
        const reducedFootprint = totalFootprint * Math.pow(1 - averageReduction, i);
        timelineData.push({
            year: new Date().getFullYear() + i,
            footprint: reducedFootprint
        });
    }

    // Get the canvas element
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Create the chart
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.map(d => d.year),
            datasets: [{
                label: 'Projected Carbon Footprint',
                data: timelineData.map(d => d.footprint),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Carbon Footprint: ${context.raw.toFixed(2)} kg CO2`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Carbon Footprint (kg CO2)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            }
        }
    });
}

function shareResults() {
    const text = `My annual carbon footprint is ${totalFootprint.toFixed(2)} kg CO2. Check out this carbon footprint calculator!`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Carbon Footprint Results',
            text: text,
            url: url
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

function saveResults() {
    const results = {
        totalFootprint,
        categoryFootprints,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-footprint-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function printResults() {
    window.print();
} 