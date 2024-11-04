# Wedding Photo Sharing App

A real-time photo sharing application designed for weddings and engagement celebrations, allowing guests to upload photos, participate in photo challenges, and interact through likes, comments, and voting.

## 🌟 Features

- **Photo Upload System**
   - Direct photo uploads with progress tracking
   - Support for multiple file selection
   - File size and type validation
   - Mobile-optimized upload experience
   - Automatic device detection

- **Challenge System**
   - Pre-defined photo challenges for guests
   - Private and public challenge options
   - Real-time challenge leaderboards
   - Voting system with one vote per challenge
   - Challenge completion tracking

- **Social Features**
   - Like and comment on photos
   - Photo voting in challenges
   - Interactive leaderboards
   - Real-time updates
   - User engagement metrics

- **Admin Dashboard**
   - Comprehensive photo management
   - User activity tracking
   - Challenge monitoring
   - Export functionality
   - Analytics and statistics

- **User Experience**
   - Responsive design for all devices
   - Intuitive navigation
   - Real-time progress indicators
   - Toast notifications
   - Image optimization

## 🛠️ Technical Stack

### Frontend
- React
- Tailwind CSS
- Lucide Icons
- Framer Motion
- Recharts
- ShadcnUI Components

### Backend
- Node.js
- Express
- SQLite
- Multer
- CORS

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/wedding-photo-app.git
```

2. Install frontend dependencies
```bash
cd wedding-photo-app
npm install
```

3. Install backend dependencies
```bash
cd server
npm install
```

4. Create environment variables
```bash
cp .env.example .env
```

5. Start the development server
```bash
# Start backend server
cd server
npm run dev

# Start frontend in a new terminal
cd ../
npm run dev
```

## 📁 Project Structure

```
wedding-photo-app/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminView.jsx
│   │   ├── ChallengeInteractions.jsx
│   │   ├── ChallengeLeaderboard.jsx
│   │   ├── EnhancedAdminGallery.jsx
│   │   ├── OptimizedImage.jsx
│   │   ├── PhotoUploader.jsx
│   │   ├── SocialFeatures.jsx
│   │   └── VotingSystem.jsx
│   ├── App.jsx
│   └── main.jsx
├── server/
│   └── server.js
└── public/
```

## 🔑 Key Features Explained

### Photo Upload System
- Supports both single and multiple photo uploads
- Handles file validation and size restrictions
- Progress tracking for uploads
- Device-specific optimizations

### Challenge System
- Configurable photo challenges
- Private challenges for sensitive content
- Public challenges with voting and leaderboards
- Real-time challenge status updates

### Admin Features
- Complete photo management
- User activity monitoring
- Challenge administration
- Data export capabilities
- Analytics dashboard

## 🔒 Security Features

- File type validation
- Size restrictions
- CORS configuration
- Rate limiting
- Admin authentication
- Private challenge protection

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices with:
- Touch-friendly interfaces
- Optimized upload experience
- Mobile-first design
- Device-specific features
- Progressive loading

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 👥 Authors

- SlyRix - *Initial work* - [SlyRix](https://github.com/SlyRix/wedapp)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [ShadcnUI](https://ui.shadcn.com/)
- All contributors who have helped shape this project

