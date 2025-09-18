# World Geography Game

An interactive web-based geography game that challenges players to identify countries on a world map.

## Features

- **Interactive World Map**: Click on countries to make guesses
- **Three Guesses Per Country**: Players get 3 attempts to find each country
- **Visual Feedback**: 
  - Green highlighting for correct guesses
  - Red highlighting for incorrect guesses
  - Orange pulsing animation for the target country
- **Score Tracking**: Points awarded based on remaining guesses
- **Continent Hints**: Helpful hints showing which continent the target country is on
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient backgrounds and smooth animations

## How to Play

1. **Start the Game**: Click the "Start Game" button to begin
2. **Read the Prompt**: The game will ask you to find a specific country
3. **Make Your Guess**: Click on the country you think is correct on the map
4. **Use Your Guesses**: You have 3 attempts to find each country
5. **Score Points**: More points for finding countries with fewer guesses
6. **Continue**: Click "Next Country" to move to the next challenge
7. **Reset**: Use the "Reset Game" button to start over

## Game Rules

- Each country gives you 3 guesses
- Correct guesses earn points (10 × remaining guesses)
- Incorrect guesses are highlighted in red
- Correct guesses are highlighted in green
- The target country pulses in orange
- Once you've guessed all countries, the game ends

## Files Included

- `index.html` - Main HTML structure
- `styles.css` - CSS styling and responsive design
- `script.js` - Game logic and interactivity
- `world-countries.json` - GeoJSON data for world countries
- `README.md` - This documentation

## How to Run

1. Download all files to a local directory
2. Open `index.html` in a web browser
3. The game will load automatically

**Note**: Due to browser security restrictions, you may need to serve the files through a local web server for the GeoJSON data to load properly. You can use:

- Python: `python -m http.server 8000`
- Node.js: `npx serve .`
- VS Code Live Server extension
- Any other local web server

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Map Data**: GeoJSON format with simplified country boundaries
- **SVG Rendering**: Countries are rendered as SVG paths
- **Responsive Design**: CSS Grid and Flexbox for layout
- **Modern CSS**: Gradients, animations, and backdrop filters

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

- More detailed country boundaries
- Difficulty levels
- Time-based challenges
- Multiplayer support
- Country capitals mode
- Regional focus modes

## License

This project is open source and available under the MIT License. 