# Wedding Photo Gallery App

A React-based web application that allows wedding guests to upload photos and participate in photo challenges. The app uses Google Drive for storage and features both general photo uploads and specific photo challenges.

## Features

- Multiple photo upload (up to 30 photos at once)
- Photo challenges with progress tracking
- Device and browser detection
- Admin view for all photos
- Progress bars for uploads
- Mobile-friendly design
- Local storage for challenge completion status
- Google Drive integration for photo storage

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (version 14 or higher)
- npm (comes with Node.js)

You'll also need:
- A Google Cloud Console account
- Google Drive API enabled
- OAuth 2.0 Client ID and API Key

## Setup

1. Clone the repository:
```bash
git clone <your-repository-url>
cd wedding-photo-app
```

2. Install dependencies:
```bash
npm install
```

3. Create your Google Cloud Console project:
    - Go to [Google Cloud Console](https://console.cloud.google.com)
    - Create a new project
    - Enable the Google Drive API
    - Create OAuth 2.0 credentials
    - Add authorized JavaScript origins:
      ```
      http://localhost:5173
      http://localhost
      ```

4. Update the constants in `App.jsx`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID';
const API_KEY = 'YOUR_API_KEY';
const ADMIN_PASSWORD = 'your-chosen-password';
```

5. Run the development server:
```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## Development

To start the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Project Structure

```
wedding-photo-app/
├── src/
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── package.json        # Project dependencies
└── README.md          # This file
```

## Configuration Files

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '0.0.0.0',
      port: 5173
    },
    watch: {
      usePolling: true
    }
  }
})
```

## Dependencies

- React
- Vite
- Tailwind CSS
- Google Drive API
- lucide-react (for icons)

## Features in Detail

### Photo Upload
- Multiple file selection
- Progress tracking
- File type validation
- Size limits (10MB per file)
- Automatic Google Drive folder creation

### Photo Challenges
- Predefined photo challenges
- Progress tracking
- Completion status saved locally
- Visual feedback for completed challenges

### Admin View
- Password protected
- Access to all uploaded photos
- Device information display
- Upload metadata

## Usage

1. Enter your name to login
2. Choose between general upload or photo challenges
3. For general upload:
    - Select up to 30 photos
    - View upload progress
    - Remove selected files if needed
4. For challenges:
    - Select a challenge
    - Upload a photo
    - Track completion status
5. Admin access:
    - Click "Admin Access"
    - Enter password
    - View all uploaded photos

## Troubleshooting

If you encounter issues:
1. Check browser console for errors
2. Verify Google Cloud Console credentials
3. Ensure all required APIs are enabled
4. Clear browser cache and cookies
5. Check file sizes and types

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Thanks to the React team
- Google Drive API documentation
- Tailwind CSS team
- Vite team

## Contact

Your Name - your.email@example.com
Project Link: [https://github.com/yourusername/wedding-photo-app](https://github.com/yourusername/wedding-photo-app)