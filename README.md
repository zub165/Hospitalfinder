# Hospital Finder

A modern web application to help patients find nearby hospitals, check ER wait times, and register for medical services.

## Features

- **Smart Chat Interface**: AI-powered chatbot for quick assistance and wait time estimates
- **Patient Registration**: Detailed registration form with symptom severity tracking
- **Medical Records**: View and manage patient medical records
- **Hospital Locator**: Find nearby hospitals using TomTom Maps integration
- **Directions**: Get real-time directions to the nearest hospital
- **Dark/Light Mode**: Supports both dark and light themes for better user experience

## Technologies Used

- HTML5, CSS3, JavaScript
- Bootstrap 5.3.0
- Font Awesome 6.0.0
- TomTom Maps API
- Node.js (for proxy server)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/zub165/Hospitalfinder.git
cd Hospitalfinder
```

2. Install dependencies:
```bash
npm install
```

3. Set up your TomTom API key:
- Get an API key from [TomTom Developer Portal](https://developer.tomtom.com/)
- Replace the API key in `index.html`

4. Start the server:
```bash
node proxy.js
```

5. Open `index.html` in your browser or use a local server.

## Features in Detail

### Patient Registration
- Comprehensive registration form
- 21 common symptoms with severity indicators
- Medical history tracking
- Custom symptom input
- Real-time form validation

### Hospital Finder
- Interactive map interface
- Real-time hospital locations
- Traffic-aware routing
- Detailed hospital information

### Smart Chat
- AI-powered responses
- Wait time estimates
- Symptom-based recommendations
- Emergency guidance

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 