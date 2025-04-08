# Spotify Analytics

## Overview
Spotify Analytics is a web application that allows users to view their Spotify listening statistics, including top artists, top songs, and top genres. The application fetches data from the Spotify API and presents it in a user-friendly interface.

## Project Structure
```
spotify-analytics
├── src
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css
│   │   └── js
│   │       └── app.js
│   ├── components
│   │   ├── header.html
│   │   ├── footer.html
│   │   └── sections
│   │       ├── top-artists.html
│   │       ├── top-songs.html
│   │       └── top-genres.html
│   └── pages
│       ├── index.html
│       └── top-insights.html
├── package.json
└── README.md
```

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spotify-analytics
   ```

2. **Install dependencies**
   Make sure you have Node.js installed. Then run:
   ```bash
   npm install
   ```

3. **Run the application**
   You can use a local server to run the application. For example, you can use `live-server` or any other server of your choice:
   ```bash
   npx live-server src/pages
   ```

## Usage
- Open your browser and navigate to `http://localhost:8080` (or the port specified by your server).
- Log in to your Spotify account to grant access to the application.
- View your top artists, songs, and genres on the respective pages.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.