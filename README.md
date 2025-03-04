# Hospital Finder

A modern web application to help users find nearby hospitals, check ER wait times, and get emergency medical assistance.

## Features

- 🏥 Find nearby hospitals and emergency rooms
- ⏱️ Real-time ER wait time estimates
- 🚑 Emergency symptom checker and response system
- 🗺️ Turn-by-turn directions to medical facilities
- 💬 Intelligent chatbot for medical assistance
- 👤 User profile and medical history management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hospitalfinder.git
cd hospitalfinder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
TOMTOM_API_KEY=your_tomtom_api_key
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:5500`

## Technology Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Maps & Navigation: TomTom Maps API
- Real-time Updates: WebSocket
- Backend Proxy: Node.js
- User Data Storage: Local Storage with encryption

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- TomTom for their Maps API
- Emergency response guidelines from medical professionals
- Open source community for various tools and libraries used in this project 