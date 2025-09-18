// Game state
let currentCountry = null;
let countriesGuessed = 0;
let totalCountries = 0;
let guessesLeft = 3;
let gameActive = false;
let availableCountries = [];
let guessedCountries = new Set();
let timerInterval = null;
let elapsedSeconds = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const prompt = document.getElementById('prompt');
const countriesGuessedElement = document.getElementById('countriesGuessed');
const totalCountriesElement = document.getElementById('totalCountries');
const guessesElement = document.getElementById('guesses');
const feedback = document.getElementById('feedback');
const mapWrapper = document.getElementById('mapWrapper');
const worldMap = document.getElementById('worldMap');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetViewBtn = document.getElementById('resetView');
const realMapBtn = document.getElementById('realMapBtn');
const realSatBtn = document.getElementById('realSatBtn');

// Map state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isZooming = false;
let originalViewBox = null;
let realMapActive = false; // toggles Leaflet basemap
let leafletMap = null;
let leafletLayers = { streets: null, satellite: null };
let realBasemapType = null; // 'map' | 'sat'
let leafletCountryLayer = null;
let leafletCountryNames = [];
const countryNameToLeafletLayer = new Map();
const leafletCountryState = new Map(); // name -> 'correct' | 'incorrect' | undefined
let continentLayer = null; // visible continent outlines only

// Country name mapping
const countryNames = {
    'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan', 'AG': 'Antigua and Barbuda',
    'AI': 'Anguilla', 'AL': 'Albania', 'AM': 'Armenia', 'AO': 'Angola', 'AR': 'Argentina',
    'AS': 'American Samoa', 'AT': 'Austria', 'AU': 'Australia', 'AW': 'Aruba', 'AX': 'Aland Islands',
    'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados', 'BD': 'Bangladesh',
    'BE': 'Belgium', 'BF': 'Burkina Faso', 'BG': 'Bulgaria', 'BH': 'Bahrain', 'BI': 'Burundi',
    'BJ': 'Benin', 'BL': 'Saint Barthelemy', 'BN': 'Brunei Darussalam', 'BO': 'Bolivia',
    'BM': 'Bermuda', 'BQ': 'Bonaire, Saint Eustachius and Saba', 'BR': 'Brazil', 'BS': 'Bahamas',
    'BT': 'Bhutan', 'BW': 'Botswana', 'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
    'CD': 'Democratic Republic of the Congo', 'CF': 'Central African Republic', 'CG': 'Republic of the Congo',
    'CH': 'Switzerland', 'CI': 'Ivory Coast', 'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China',
    'CO': 'Colombia', 'CR': 'Costa Rica', 'CU': 'Cuba', 'CV': 'Cape Verde', 'CW': 'Curacao',
    'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DE': 'Germany', 'DJ': 'Djibouti', 'DK': 'Denmark',
    'DM': 'Dominica', 'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador', 'EE': 'Estonia',
    'EG': 'Egypt', 'EH': 'Western Sahara', 'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia',
    'FI': 'Finland', 'FJ': 'Fiji', 'FK': 'Falkland Islands', 'FM': 'Micronesia', 'FO': 'Faroe Islands',
    'FR': 'France', 'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada', 'GE': 'Georgia',
    'GF': 'French Guiana', 'GG': 'Guernsey', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GL': 'Greenland',
    'GM': 'Gambia', 'GN': 'Guinea', 'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea', 'GR': 'Greece',
    'GT': 'Guatemala', 'GU': 'Guam', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong',
    'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary', 'ID': 'Indonesia',
    'IE': 'Ireland', 'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India', 'IQ': 'Iraq',
    'IR': 'Iran', 'IS': 'Iceland', 'IT': 'Italy', 'JE': 'Jersey', 'JM': 'Jamaica',
    'JO': 'Jordan', 'JP': 'Japan', 'KE': 'Kenya', 'KG': 'Kyrgyzstan', 'KH': 'Cambodia',
    'KI': 'Kiribati', 'KM': 'Comoros', 'KP': 'North Korea', 'KR': 'South Korea', 'KW': 'Kuwait',
    'KY': 'Cayman Islands', 'KZ': 'Kazakhstan', 'LA': 'Laos', 'LB': 'Lebanon', 'LC': 'Saint Lucia',
    'LI': 'Liechtenstein', 'LK': 'Sri Lanka', 'LR': 'Liberia', 'LS': 'Lesotho', 'LT': 'Lithuania',
    'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya', 'MA': 'Morocco', 'MC': 'Monaco',
    'MD': 'Moldova', 'ME': 'Montenegro', 'MF': 'Saint Martin', 'MG': 'Madagascar', 'MH': 'Marshall Islands',
    'MK': 'North Macedonia', 'ML': 'Mali', 'MM': 'Myanmar', 'MN': 'Mongolia', 'MO': 'Macau',
    'MP': 'Northern Mariana Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MS': 'Montserrat',
    'MT': 'Malta', 'MU': 'Mauritius', 'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico',
    'MY': 'Malaysia', 'MZ': 'Mozambique', 'NA': 'Namibia', 'NC': 'New Caledonia', 'NE': 'Niger',
    'NF': 'Norfolk Island', 'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands', 'NO': 'Norway',
    'NP': 'Nepal', 'NR': 'Nauru', 'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman',
    'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia', 'PG': 'Papua New Guinea', 'PH': 'Philippines',
    'PK': 'Pakistan', 'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'PR': 'Puerto Rico',
    'PS': 'Palestine', 'PT': 'Portugal', 'PW': 'Palau', 'PY': 'Paraguay', 'QA': 'Qatar',
    'RE': 'Reunion', 'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia', 'RW': 'Rwanda',
    'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles', 'SD': 'Sudan',
    'SE': 'Sweden', 'SG': 'Singapore', 'SI': 'Slovenia', 'SK': 'Slovakia', 'SL': 'Sierra Leone',
    'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname', 'SS': 'South Sudan',
    'ST': 'Sao Tome and Principe', 'SV': 'El Salvador', 'SX': 'Sint Maarten', 'SY': 'Syria',
    'SZ': 'Eswatini', 'TC': 'Turks and Caicos Islands', 'TD': 'Chad', 'TG': 'Togo', 'TH': 'Thailand',
    'TJ': 'Tajikistan', 'TL': 'Timor-Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia', 'TO': 'Tonga',
    'TR': 'Turkey', 'TT': 'Trinidad and Tobago', 'TV': 'Tuvalu', 'TW': 'Taiwan', 'TZ': 'Tanzania',
    'UA': 'Ukraine', 'UG': 'Uganda', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan',
    'VA': 'Vatican City', 'VC': 'Saint Vincent and the Grenadines', 'VE': 'Venezuela', 'VG': 'British Virgin Islands',
    'VI': 'U.S. Virgin Islands', 'VN': 'Vietnam', 'VU': 'Vanuatu', 'WF': 'Wallis and Futuna',
    'WS': 'Samoa', 'YE': 'Yemen', 'YT': 'Mayotte', 'ZA': 'South Africa', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

// Load SVG content
async function loadSVG() {
    try {
        const response = await fetch('world.svg');
        const svgText = await response.text();
        
        // Extract the path elements from the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path');
        
        // Store original viewBox for crisp zooming
        originalViewBox = worldMap.getAttribute('viewBox') || '0 0 1009.6727 665.96301';
        
        // Add only valid country paths to our SVG (filter out miscellaneous lines)
        paths.forEach(path => {
            const id = path.getAttribute('id');
            if (!id || !countryNames[id]) return; // skip non-country paths
            const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            newPath.setAttribute('d', path.getAttribute('d'));
            // Remove any title tooltips to avoid showing country names
            newPath.setAttribute('id', id);
            newPath.classList.add('country');
            // Set default colors for countries (no border by default)
            newPath.removeAttribute('fill');
            newPath.style.fill = '#F5F5DC';
            newPath.style.stroke = 'none';
            newPath.style.strokeWidth = '0';
            worldMap.appendChild(newPath);
        });
        
        // Initialize countries array
        availableCountries = Object.keys(countryNames);
        totalCountries = availableCountries.length;
        totalCountriesElement.textContent = totalCountries;
        
        // Add event listeners to countries
        addCountryEventListeners();
        
        // Call resetAllCountryColors after loading SVG and after each round
        resetAllCountryColors();
        
    } catch (error) {
        console.error('Error loading SVG:', error);
        // Fallback: create a simple world map representation
        createFallbackMap();
    }
}

// Create fallback map if SVG loading fails
function createFallbackMap() {
    const fallbackCountries = [
        { id: 'US', title: 'United States', d: 'M 100,200 L 300,200 L 300,300 L 100,300 Z' },
        { id: 'CA', title: 'Canada', d: 'M 100,100 L 300,100 L 300,200 L 100,200 Z' },
        { id: 'MX', title: 'Mexico', d: 'M 100,300 L 300,300 L 300,400 L 100,400 Z' },
        { id: 'BR', title: 'Brazil', d: 'M 200,400 L 400,400 L 400,600 L 200,600 Z' },
        { id: 'AR', title: 'Argentina', d: 'M 200,600 L 400,600 L 400,700 L 200,700 Z' },
        { id: 'GB', title: 'United Kingdom', d: 'M 500,200 L 520,200 L 520,220 L 500,220 Z' },
        { id: 'FR', title: 'France', d: 'M 500,220 L 530,220 L 530,250 L 500,250 Z' },
        { id: 'DE', title: 'Germany', d: 'M 510,230 L 530,230 L 530,250 L 510,250 Z' },
        { id: 'IT', title: 'Italy', d: 'M 520,240 L 540,240 L 540,270 L 520,270 Z' },
        { id: 'ES', title: 'Spain', d: 'M 490,240 L 510,240 L 510,260 L 490,260 Z' },
        { id: 'RU', title: 'Russia', d: 'M 600,100 L 800,100 L 800,300 L 600,300 Z' },
        { id: 'CN', title: 'China', d: 'M 700,250 L 850,250 L 850,350 L 700,350 Z' },
        { id: 'IN', title: 'India', d: 'M 650,300 L 750,300 L 750,400 L 650,400 Z' },
        { id: 'JP', title: 'Japan', d: 'M 850,200 L 870,200 L 870,220 L 850,220 Z' },
        { id: 'AU', title: 'Australia', d: 'M 750,450 L 900,450 L 900,600 L 750,600 Z' }
    ];
    
    fallbackCountries.forEach(country => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', country.d);
        // Do not set title attribute to avoid name tooltips
        path.setAttribute('id', country.id);
        path.classList.add('country');
        path.removeAttribute('fill');
        path.style.fill = '#F5F5DC';
        path.style.stroke = 'none';
        path.style.strokeWidth = '0';
        worldMap.appendChild(path);
    });
    
    availableCountries = fallbackCountries.map(c => c.id);
    totalCountries = availableCountries.length;
    totalCountriesElement.textContent = totalCountries;
    addCountryEventListeners();
    resetAllCountryColors(); // Ensure fallback map is reset
}

// Add event listeners to country paths
function addCountryEventListeners() {
    const countryPaths = document.querySelectorAll('.country');
    countryPaths.forEach(path => {
        path.addEventListener('click', handleCountryClick);
        path.addEventListener('mouseenter', handleCountryHover);
        path.addEventListener('mouseleave', handleCountryLeave);
    });
    applyMapModeStyles();
}

// Handle country click
function handleCountryClick(event) {
    if (!gameActive) return;
    
    const countryId = event.target.id;
    const countryName = countryNames[countryId];
    
    if (!countryName) return;
    
    // Check if this country has already been guessed
    if (guessedCountries.has(countryId)) {
        feedback.textContent = `You've already guessed ${countryName}! Try a different country.`;
        feedback.className = 'feedback incorrect';
        return;
    }
    
    // Reset only the current country's styling if it's not already correct
    if (!event.target.classList.contains('correct')) {
        event.target.style.stroke = '';
        event.target.style.strokeWidth = '';
        event.target.style.fill = '';
    }

    if (countryName === currentCountry) {
        // Correct guess
        countriesGuessed++;
        countriesGuessedElement.textContent = countriesGuessed;
        guessedCountries.add(countryId);
        
        feedback.textContent = `Correct! ${countryName} is the right answer!`;
        feedback.className = 'feedback correct';
        
        // Fill the correct country with polished green (no border)
        event.target.classList.add('correct');
        event.target.style.fill = '#10B981';
        event.target.style.stroke = 'none';
        event.target.style.strokeWidth = '0';
        
        // End round
        endRound();
    } else {
        // Wrong guess
        guessesLeft--;
        guessesElement.textContent = guessesLeft;
        guessedCountries.add(countryId);
        
        feedback.textContent = `Wrong! That's ${countryName}. Try again!`;
        feedback.className = 'feedback incorrect';
        
        // Fill the wrong country with polished red temporarily (no border)
        event.target.classList.add('incorrect');
        event.target.style.fill = '#EF4444';
        event.target.style.stroke = 'none';
        event.target.style.strokeWidth = '0';
        setTimeout(() => {
            event.target.classList.remove('incorrect');
            event.target.style.fill = '#F5F5DC'; // Beige color for countries
            event.target.style.stroke = '#8B7355';
            event.target.style.strokeWidth = '1';
        }, 1000);
        
        if (guessesLeft <= 0) {
            feedback.textContent = `Game Over! The correct answer was ${currentCountry}.`;
            feedback.className = 'feedback game-over';
            
                    // Fill the correct country with polished green
        const correctPath = document.getElementById(Object.keys(countryNames).find(key => countryNames[key] === currentCountry));
        if (correctPath) {
            correctPath.classList.add('correct');
            correctPath.style.fill = '#10B981';
            correctPath.style.stroke = 'none';
            correctPath.style.strokeWidth = '0';
        }
            
            endRound();
        }
    }
}

// Handle country hover
function handleCountryHover(event) {
    if (!gameActive) return;
    const path = event.target;
    if (path.classList.contains('correct') || path.classList.contains('incorrect')) return;
    // Fill-only hover highlight to avoid showing internal borders
    // Use bright white for satellite view, bright blue for regular map
    const hoverColor = (realMapActive && realBasemapType === 'sat') ? '#FFFFFF' : '#00BFFF';
    path.style.fill = hoverColor;
    path.style.stroke = 'none';
    path.style.strokeWidth = '0';
}

// Handle country leave
function handleCountryLeave(event) {
    if (!gameActive) return;
    
    // Only reset if the country hasn't been selected
    if (!event.target.classList.contains('correct') && !event.target.classList.contains('incorrect')) {
        setCountryDefaultStyle(event.target);
    }
}

// (click triggers guesses; hover is visual only)

// Start game
async function startGame() {
    gameActive = true;
    countriesGuessed = 0;
    if (realMapActive) {
        await ensureLeafletCountries();
        totalCountries = leafletCountryNames.length;
        console.log(`Real map active. Total countries: ${totalCountries}`);
        console.log(`Leaflet country names:`, leafletCountryNames.slice(0, 10)); // Show first 10 for debugging
    } else {
        totalCountries = availableCountries.length;
        console.log(`SVG map active. Total countries: ${totalCountries}`);
    }
    guessesLeft = 3;
    guessedCountries.clear();
    resetTimer();
    startTimer();
    
    countriesGuessedElement.textContent = countriesGuessed;
    totalCountriesElement.textContent = totalCountries;
    guessesElement.textContent = guessesLeft;
    
    startBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    
    // Clear any previous highlighting when starting a new game
    resetAllCountryColors();
    
    nextCountry();
}

// Next country
function nextCountry() {
    // Build the unguessed list depending on mode
    let candidates;
    if (realMapActive) {
        candidates = leafletCountryNames.filter(name => !guessedCountries.has(name));
    } else {
        candidates = availableCountries.filter(countryId => !guessedCountries.has(countryId));
    }

    if (candidates.length === 0) {
        prompt.textContent = `Congratulations! You've completed all ${totalCountries} countries!`;
        feedback.textContent = `Final Score: ${countriesGuessed} out of ${totalCountries} countries guessed correctly!`;
        feedback.className = 'feedback correct';
        gameActive = false;
        nextBtn.textContent = 'Play Again';
        return;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    if (realMapActive) {
        currentCountry = candidates[randomIndex]; // name
    } else {
        const countryId = candidates[randomIndex];
        currentCountry = countryNames[countryId];
    }

    prompt.textContent = `Find: ${currentCountry}`;
    guessesLeft = 3;
    guessesElement.textContent = guessesLeft;
    feedback.textContent = '';
    feedback.className = 'feedback';
}

// End round
function endRound() {
    gameActive = false;
    stopTimer();
    
    // Check if all countries have been guessed
    const unguessedCountries = availableCountries.filter(countryId => !guessedCountries.has(countryId));
    if (unguessedCountries.length === 0) {
        nextBtn.textContent = 'Play Again';
    } else {
        nextBtn.textContent = 'Next Country';
    }
}

// Map controls
function zoomIn() {
    if (realMapActive && leafletMap) {
        leafletMap.zoomIn();
        return;
    }
    const newScale = Math.min(scale * 1.5, 80);
    if (newScale !== scale) zoomToScale(newScale);
}

function zoomOut() {
    if (realMapActive && leafletMap) {
        leafletMap.zoomOut();
        return;
    }
    const newScale = Math.max(scale / 1.8, 0.6);
    if (newScale !== scale) zoomToScale(newScale);
}

function resetView() {
    if (realMapActive && leafletMap) {
        leafletMap.setView([20, 0], 2);
    } else {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateMapTransform();
        if (originalViewBox) {
            worldMap.setAttribute('viewBox', originalViewBox);
        }
    }
    if (gameActive) {
        guessesLeft = 3;
        guessesElement.textContent = guessesLeft;
        if (realMapActive) {
            // Clear incorrect highlighting on Leaflet
            leafletCountryState.forEach((state, name) => {
                if (state === 'incorrect') leafletCountryState.set(name, undefined);
            });
            applyLeafletCountryStyles();
        } else {
            document.querySelectorAll('.country.incorrect').forEach(path => {
                path.classList.remove('incorrect');
                setCountryDefaultStyle(path);
            });
        }
        nextCountry();
    }
}

function zoomToScale(newScale, mouseX = null, mouseY = null) {
    const oldScale = scale;
    
    if (mouseX !== null && mouseY !== null) {
        // Get the mouse position relative to the map wrapper
        const rect = mapWrapper.getBoundingClientRect();
        const mouseXRelative = mouseX - rect.left;
        const mouseYRelative = mouseY - rect.top;
        
        // Calculate the mouse position in the untransformed coordinate system
        const mouseXUntransformed = (mouseXRelative - translateX) / oldScale;
        const mouseYUntransformed = (mouseYRelative - translateY) / oldScale;
        
        // Calculate new translation to keep the mouse point fixed
        scale = newScale;
        translateX = mouseXRelative - mouseXUntransformed * scale;
        translateY = mouseYRelative - mouseYUntransformed * scale;
    } else {
        scale = newScale;
    }
    
    updateMapTransform();
}

function updateViewBox() {
    if (!originalViewBox) return;
    
    const [x, y, width, height] = originalViewBox.split(' ').map(Number);
    const newWidth = width / scale;
    const newHeight = height / scale;
    const newX = x - (translateX / scale);
    const newY = y - (translateY / scale);
    
    worldMap.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
}

function updateMapTransform() {
    // Use viewBox for crisp zooming instead of CSS transforms
    updateViewBox();
    
    // Keep minimal CSS transform for smooth transitions
    if (!isDragging) {
        worldMap.style.transition = 'transform 0.1s ease-out';
    } else {
        worldMap.style.transition = 'none';
    }
    
    // Use minimal transform for fine adjustments
    const fineTranslateX = translateX % 1;
    const fineTranslateY = translateY % 1;
    worldMap.style.transform = `translate(${fineTranslateX}px, ${fineTranslateY}px)`;
    
    // Remove transition after animation completes
    if (!isDragging) {
        setTimeout(() => {
            worldMap.style.transition = '';
        }, 100);
    }
}

// Mode switching
function applyMapModeStyles() {
    // legacy SVG styles only; real basemap modes handled by Leaflet
    // Update default, but keep explicit styles for correct/incorrect
    document.querySelectorAll('#worldMap .country').forEach(path => {
        if (!path.classList.contains('correct') && !path.classList.contains('incorrect')) {
            setCountryDefaultStyle(path);
        }
    });
}

function setCountryDefaultStyle(path) {
    path.style.fill = '#F5F5DC';
    path.style.stroke = 'none';
    path.style.strokeWidth = '0';
}

// Mouse controls for panning
function handleMouseDown(event) {
    if (realMapActive) return;
    if (event.target.classList.contains('country')) return;
    
    isDragging = true;
    dragStartX = event.clientX - translateX;
    dragStartY = event.clientY - translateY;
    mapWrapper.style.cursor = 'grabbing';
    
    // Disable transitions during dragging for better performance
    worldMap.style.transition = 'none';
}

function handleMouseMove(event) {
    if (realMapActive) return;
    if (!isDragging) return;
    
    translateX = event.clientX - dragStartX;
    translateY = event.clientY - dragStartY;
    updateMapTransform();
}

function handleMouseUp() {
    if (realMapActive) return;
    isDragging = false;
    mapWrapper.style.cursor = 'grab';
    
    // Re-enable transitions after dragging
    worldMap.style.transition = 'transform 0.1s ease-out';
}

// Wheel zoom
function handleWheel(event) {
    if (!realMapActive) {
        event.preventDefault();
        if (isZooming) return;
        isZooming = true;
        const delta = event.deltaY > 0 ? 0.80 : 1.15;
        const newScale = Math.max(0.6, Math.min(80, scale * delta));
        zoomToScale(newScale, event.clientX, event.clientY);
        setTimeout(() => { isZooming = false; }, 20);
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', () => {
    if (gameActive) {
        endRound();
    } else {
        if (nextBtn.textContent === 'Play Again') {
            // Reset the game completely
            startGame();
        } else {
            gameActive = true;
            nextCountry();
        }
    }
});

zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
resetViewBtn.addEventListener('click', resetView);

// Map interaction events
mapWrapper.addEventListener('mousedown', handleMouseDown);
mapWrapper.addEventListener('mousemove', handleMouseMove);
mapWrapper.addEventListener('mouseup', handleMouseUp);
mapWrapper.addEventListener('mouseleave', handleMouseUp);
mapWrapper.addEventListener('wheel', handleWheel);

// Prevent context menu on map
mapWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

// Reset all country colors to default
function resetAllCountryColors() {
    const countryPaths = document.querySelectorAll('.country');
    countryPaths.forEach(path => {
        path.classList.remove('correct', 'incorrect');
        path.style.fill = '#F5F5DC';
        path.style.stroke = 'none';
        path.style.strokeWidth = '0';
    });
}

// Initialize
// Start with Real Map active by default; hide SVG and show tiles
document.addEventListener('DOMContentLoaded', () => {
    showRealBasemap('map');
});
// Real basemap integration (Leaflet)
function ensureLeafletMap() {
    if (leafletMap) return;
    const leafletContainer = document.getElementById('leafletMap');
    leafletContainer.style.display = 'block';
    leafletMap = L.map('leafletMap', {
        zoomControl: false,
        attributionControl: false,
        center: [20, 0],
        zoom: 2,
        preferCanvas: true, // faster vector rendering
        wheelDebounceTime: 20,
        wheelPxPerZoomLevel: 80
    });
    // Real map: CARTO Light (no labels) for a clean normal map without labels
    leafletLayers.streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 19
    });
    // Satellite: Esri World Imagery
    leafletLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
    });
}

function showRealBasemap(type) {
    ensureLeafletMap();
    realMapActive = true;
    realBasemapType = type === 'sat' ? 'sat' : 'map';
    // Display leaflet under SVG
    const leafletDiv = document.getElementById('leafletMap');
    leafletDiv.style.display = 'block';
    // Hide SVG entirely to avoid misalignment
    worldMap.style.display = 'none';
    // Switch base layers
    if (leafletMap.hasLayer(leafletLayers.streets)) leafletMap.removeLayer(leafletLayers.streets);
    if (leafletMap.hasLayer(leafletLayers.satellite)) leafletMap.removeLayer(leafletLayers.satellite);
    if (type === 'sat') {
        // Satellite imagery, no labels
        leafletLayers.satellite.addTo(leafletMap);
        leafletDiv.style.background = '';
        // Add satellite class to map wrapper for CSS styling
        mapWrapper.classList.add('satellite');
    } else {
        // Streets basemap (no labels) restored
        leafletLayers.streets.addTo(leafletMap);
        leafletDiv.style.background = '';
        // Remove satellite class from map wrapper
        mapWrapper.classList.remove('satellite');
    }
    // Ensure continent coastlines are visible (no internal borders)
    ensureContinentOutlines();
    ensureLeafletCountries();
    applyLeafletCountryStyles();
    // Update total countries display for real map without mutating SVG country list
    if (!gameActive) {
        totalCountries = leafletCountryNames.length;
        totalCountriesElement.textContent = totalCountries;
    }
}

function hideRealBasemap() {
    realMapActive = false;
    const leafletContainer = document.getElementById('leafletMap');
    leafletContainer.style.display = 'none';
    realBasemapType = null;
    // Remove satellite class when hiding real basemap
    mapWrapper.classList.remove('satellite');
    // Show SVG again
    worldMap.style.display = 'block';
}

// Hook buttons
realMapBtn.addEventListener('click', () => showRealBasemap('map'));
realSatBtn.addEventListener('click', () => showRealBasemap('sat'));

// Helper to get a consistent country name field across datasets
function extractFeatureName(feature) {
    const p = feature.properties || {};
    return p.name || p.NAME || p.ADMIN || p.admin || p.Country || p.country || 'Unknown';
}

// Load and draw GeoJSON countries on Leaflet (prefers real borders, falls back to local)
async function ensureLeafletCountries() {
    if (leafletCountryLayer) return;
    const candidateUrls = [
        // Prefer robust, real borders to avoid boxy country shapes
        'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
        // Local simplified file only as a last resort
        'world-countries.json'
    ];

    let data = null;
    for (const url of candidateUrls) {
        try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) continue;
            const json = await resp.json();
            if (!json || !Array.isArray(json.features) || json.features.length === 0) continue;
            data = json;
            break;
        } catch (_) {
            // try next
        }
    }
    if (!data) {
        console.error('Failed to load any GeoJSON source for country borders');
        return;
    }

    // Filter out non-country territories and disputed regions
    const excludedTerritories = [
        'Southern Patagonian Ice Field', 'Spratly Islands', 'Bir Tawil', 'Somaliland',
        'Serranilla Bank', 'Siachen Glacier', 'Brazilian Island',
        'Coral Islands', 'Baykonur Cosmodrome'
    ];

    // Filter features to only include recognized sovereign countries
    const filteredFeatures = data.features.filter(feature => {
        const name = extractFeatureName(feature);
        
        // Skip features with no name
        if (!name || name === 'Unknown') {
            return false;
        }
        
        // Exclude specific territories and disputed regions
        if (excludedTerritories.some(territory => 
            name.toLowerCase().includes(territory.toLowerCase()) ||
            territory.toLowerCase().includes(name.toLowerCase())
        )) {
            return false;
        }
        
        // Special handling for Cyprus - ensure only the main recognized Cyprus is included
        if (name.toLowerCase().includes('cyprus')) {
            // Only exclude specific Cyprus territories, allow the main Cyprus
            const cyprusExclusions = [
                'northern cyprus', 'turkish republic of northern cyprus', 'trnc',
                'akrotiri and dhekelia', 'british sovereign base areas'
            ];
            
            // If it's exactly "cyprus", include it
            if (name.toLowerCase() === 'cyprus') {
                return true;
            }
            
            // If it contains any of the excluded Cyprus variations, exclude it
            if (cyprusExclusions.some(exclusion => name.toLowerCase().includes(exclusion))) {
                return false;
            }
        }
        
        // More lenient filtering: only exclude features with clearly invalid ISO codes
        const properties = feature.properties || {};
        const isoCode = properties.iso_a2 || properties.ISO3166_1_Alpha_2 || properties.iso_a3 || properties.ISO3166_1_Alpha_3;
        
        // Only exclude features with clearly invalid ISO codes, not missing ones
        if (isoCode === '-99' || isoCode === 'XX' || isoCode === 'ZZ') {
            return false;
        }
        
        return true;
    });

    // Debug logging
    console.log(`Total features loaded: ${data.features.length}`);
    console.log(`Features after filtering: ${filteredFeatures.length}`);
    
    // Check if Cyprus is in the filtered results
    const cyprusInFiltered = filteredFeatures.some(f => extractFeatureName(f).toLowerCase() === 'cyprus');
    console.log(`Cyprus found in filtered results: ${cyprusInFiltered}`);
    
    if (filteredFeatures.length === 0) {
        console.warn('No countries found after filtering. Using unfiltered data.');
        // Fallback to using all features if filtering is too aggressive
        leafletCountryNames = data.features.map(f => extractFeatureName(f)).filter(name => name && name !== 'Unknown');
    } else {
        leafletCountryNames = filteredFeatures.map(f => extractFeatureName(f));
    }
    
    // Log the final country list to verify Cyprus is included
    console.log(`Final country count: ${leafletCountryNames.length}`);
    console.log(`Cyprus in final list: ${leafletCountryNames.includes('Cyprus')}`);
    
    // Ensure Cyprus is included if it exists in the original data
    const originalCyprus = data.features.find(f => extractFeatureName(f).toLowerCase() === 'cyprus');
    if (originalCyprus && !leafletCountryNames.includes('Cyprus')) {
        console.log('Adding Cyprus back to the country list');
        leafletCountryNames.push('Cyprus');
    }

    // Use the country names we determined above
    leafletCountryLayer = L.geoJSON(filteredFeatures.length > 0 ? filteredFeatures : data.features, {
        style: () => defaultLeafletCountryStyle(),
        smoothFactor: 1.2,
        onEachFeature: (feature, layer) => {
            const name = extractFeatureName(feature);
            countryNameToLeafletLayer.set(name, layer);
            layer.on('click', () => handleLeafletCountryClick(name, layer));
            // Hide hover outlines entirely to keep borders invisible
            // and improve performance
            layer.on('mouseover', () => handleLeafletCountryHover(name, layer));
            layer.on('mouseout', () => handleLeafletCountryOut(name, layer));
        }
    }).addTo(leafletMap);
}

function defaultLeafletCountryStyle() {
    // Completely invisible by default: no borders, no fills
    return { 
        color: 'transparent', 
        weight: 0, 
        opacity: 0, 
        fillOpacity: 0,
        fillRule: 'evenodd'
    };
}

function applyLeafletCountryStyles() {
    if (!leafletCountryLayer) return;
    leafletCountryLayer.eachLayer(layer => {
        const name = layer.feature.properties.name;
        const state = leafletCountryState.get(name);
        if (state === 'correct') {
            // fill entire country for correct answer, no border
            layer.setStyle({ 
                color: 'transparent', 
                weight: 0, 
                opacity: 0, 
                fillColor: '#10B981', 
                fillOpacity: 0.85,
                fillRule: 'evenodd'
            }); // Polished green for correct
        } else if (state === 'incorrect') {
            // fill entire country for incorrect (temporary), no border
            layer.setStyle({ 
                color: 'transparent', 
                weight: 0, 
                opacity: 0, 
                fillColor: '#EF4444', 
                fillOpacity: 0.85,
                fillRule: 'evenodd'
            }); // Polished red for incorrect
        } else {
            // default: fully hidden borders/fills
            layer.setStyle({ opacity: 0, fillOpacity: 0 });
        }
    });
}

function handleLeafletCountryHover(name, layer) {
    if (!gameActive) return;
    const state = leafletCountryState.get(name);
    if (state === 'correct' || state === 'incorrect') return;
    // Fill-only hover to avoid showing internal borders
    // Use bright white for satellite view, bright blue for regular map
    const hoverColor = realBasemapType === 'sat' ? '#FFFFFF' : '#00BFFF';
    const hoverOpacity = realBasemapType === 'sat' ? 0.9 : 0.75; // Higher opacity for white on satellite
    
    // Add smooth transition and enhanced styling
    layer.setStyle({ 
        opacity: 0, 
        weight: 0, 
        fillColor: hoverColor, 
        fillOpacity: hoverOpacity,
        fillRule: 'evenodd'
    });
    
    // Add a subtle glow effect for better visibility
    if (realBasemapType === 'sat') {
        layer.setStyle({ 
            fillColor: '#FFFFFF', 
            fillOpacity: 0.9,
            weight: 0,
            opacity: 0
        });
    }
}

function handleLeafletCountryOut(name, layer) {
    if (!gameActive) return;
    const state = leafletCountryState.get(name);
    if (state === 'correct' || state === 'incorrect') return;
    layer.setStyle({ opacity: 0, fillOpacity: 0 });
}

function handleLeafletCountryClick(name, layer) {
    if (!gameActive) return;
    if (guessedCountries.has(name)) {
        feedback.textContent = `You've already guessed ${name}! Try a different country.`;
        feedback.className = 'feedback incorrect';
        return;
    }
    if (name === currentCountry) {
        countriesGuessed++;
        countriesGuessedElement.textContent = countriesGuessed;
        guessedCountries.add(name);
        feedback.textContent = `Correct! ${name} is the right answer!`;
        feedback.className = 'feedback correct';
        leafletCountryState.set(name, 'correct');
        layer.setStyle({ 
            color: 'transparent', 
            weight: 0, 
            opacity: 0, 
            fillColor: '#10B981', 
            fillOpacity: 0.85,
            fillRule: 'evenodd'
        });
        endRound();
    } else {
        guessesLeft--;
        guessesElement.textContent = guessesLeft;
        guessedCountries.add(name);
        feedback.textContent = `Wrong! That's ${name}. Try again!`;
        feedback.className = 'feedback incorrect';
        leafletCountryState.set(name, 'incorrect');
        layer.setStyle({ 
            color: 'transparent', 
            weight: 0, 
            opacity: 0, 
            fillColor: '#EF4444', 
            fillOpacity: 0.85,
            fillRule: 'evenodd'
        });
        setTimeout(() => {
            if (leafletCountryState.get(name) === 'incorrect') {
                leafletCountryState.set(name, undefined);
                layer.setStyle({ opacity: 0, fillOpacity: 0 });
            }
        }, 1000);
        if (guessesLeft <= 0) {
            feedback.textContent = `Game Over! The correct answer was ${currentCountry}.`;
            feedback.className = 'feedback game-over';
            const correctLayer = countryNameToLeafletLayer.get(currentCountry);
            if (correctLayer) {
                            leafletCountryState.set(currentCountry, 'correct');
            correctLayer.setStyle({ 
                color: 'transparent', 
                weight: 0, 
                opacity: 0, 
                fillColor: '#10B981', 
                fillOpacity: 0.85,
                fillRule: 'evenodd'
            });
            }
            endRound();
        }
    }
}

// Centralized guess for real map (hover-based)
// (click triggers guesses; hover is visual only)

// Timer helpers
function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        elapsedSeconds += 1;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
}

// Continent outlines (disabled - no outlines shown)
async function ensureContinentOutlines() {
    // Function disabled - no continent outlines will be shown
    // This removes the coastline borders from both real map and satellite views
    return;
}