import React, {useState, useEffect} from 'react';
import PhotoUploader from './PhotoUploader';
import EnhancedAdminGallery from './components/EnhancedAdminGallery.jsx';
import OptimizedImage from './components/OptimizedImage';
import SocialFeatures from './components/SocialFeatures';
import AdminDashboard from './components/AdminDashboard';
import AdminView from './components/AdminView';
import VotingSystem from './components/VotingSystem';
import ChallengeLeaderboard from './components/ChallengeLeaderboard';
import ChallengeInteractions from './components/ChallengeInteractions';
import { EllipsisVertical, Trash, Play} from 'lucide-react'; // Or the appropriate icon
import MediaModal from "./components/MediaModal";
// import DeleteConfirmModal from './components/DeleteConfirmModal'; // Adjust the import path if needed

import { createPortal } from 'react-dom';

import {
    CheckCircle, X, AlertCircle, Settings,
    LogIn, ChevronDown, ChevronLeft, ChevronRight,
    Heart, Camera, Star, Calendar,
    FlowerIcon, LogOut, Shield
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Button} from "./components/ui/button";
import {Card, CardContent} from "./components/ui/card";
import {Badge} from "./components/ui/badge";
import confetti from 'canvas-confetti';

const API_URL = 'https://engagement-photos-api.slyrix.com/api';

const ADMIN_PASSWORD = 'happy';
const MAX_PHOTOS = 30;

const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
if (isDev) {
    console.log('Running in development mode');
    console.log('Access URLs:', {
        local: 'http://localhost:5173',
        network: `http://${window.location.hostname}:5173`
    });
}

const challenges = [
    {
        id: 1,
        title: 'Catch the Couple',
        description: 'Take a fun picture with Rushel and Sivani',
        isPrivate: false

    },
    {
        id: 2,
        title: 'Best Outfit of the Day',
        description: 'Capture the most stylish guest!',
        isPrivate: false

    },
    {
        id: 3,
        title: 'Take a selfie',
        description: 'Click a selfie',
        isPrivate: false

    },
    {
        id: 4,
        title: 'Friend Squad',
        description: 'Group photos with friends from each side',
        isPrivate: false

    },
    {
        id: 5,
        title: 'Love Notes',
        description: 'Share your wishes for Rushel and Sivani! Open your phone\'s notes app, write a heartfelt message, take a screenshot, and upload it (is private)',
        isPrivate: true

    },
    {
        id: 6,
        title: 'Sweet Moments',
        description: 'Share touching moments from the celebration',
        isPrivate: false
    },
];
const DeleteConfirmModal = ({ onClose, onConfirm }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
                <h3 className="text-lg font-medium text-wedding-purple-dark mb-2">
                    Confirm Delete
                </h3>
                <p className="text-wedding-purple mb-6">
                    Are you sure you want to delete this photo? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-wedding-purple-light/30 text-wedding-purple hover:bg-wedding-purple-light/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};


function App() {
    const [challengeUploadProgress, setChallengeUploadProgress] = useState({});

    const [expandedChallenges, setExpandedChallenges] = useState(new Set());
    const [challengePhotos, setChallengePhotos] = useState({});
    const [notification, setNotification] = useState(null);
    const [guestName, setGuestName] = useState(() => {
        // Initialize guestName from localStorage
        return localStorage.getItem('guestName') || '';
    });
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        // Initialize login state from localStorage
        return !!localStorage.getItem('guestName');
    });
    const [selectedChallengeFiles, setSelectedChallengeFiles] = useState({});
    const [selectedTab, setSelectedTab] = useState('general');
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [completedChallenges, setCompletedChallenges] = useState(new Set());
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [allPhotos, setAllPhotos] = useState([]);
    const [activeChallenge, setActiveChallenge] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [deviceInfo, setDeviceInfo] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [comments, setComments] = useState({});
    const [reactions, setReactions] = useState({});
    const [challengeVoteStatus, setChallengeVoteStatus] = useState({});
    const [photoToDelete, setPhotoToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [adminStats, setAdminStats] = useState({
        totalUploads: 0,
        activeUsers: 0,
        challengeCompletion: {},
        uploadTrends: []
    });


    useEffect(() => {
        if (isLoggedIn) {
            fetchPhotos();
            challenges.forEach(challenge => {
                fetchChallengePhotos(challenge.id);
            });
        }
    }, [isLoggedIn]);


    // const triggerConfetti = () => {
    //     confetti({
    //         particleCount: 100,
    //         spread: 70,
    //         origin: {y: 0.6}
    //     });
    // };
    const getBrowserInfo = (userAgent) => {
        if (/Chrome/i.test(userAgent)) return 'Chrome';
        if (/Firefox/i.test(userAgent)) return 'Firefox';
        if (/Safari/i.test(userAgent)) return 'Safari';
        if (/Edge/i.test(userAgent)) return 'Edge';
        if (/MSIE|Trident/i.test(userAgent)) return 'Internet Explorer';
        return 'Unknown Browser';
    };
    const handleAddComment = async (photoId, comment) => {
        try {
            // Here you would typically make an API call to save the comment
            setComments(prev => ({
                ...prev,
                [photoId]: [...(prev[photoId] || []), comment]
            }));
            setNotification({
                message: 'Comment added successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            setNotification({
                message: 'Error adding comment',
                type: 'error'
            });
        }
    };

    const handleAddReaction = async (photoId, reaction) => {
        try {
            // Here you would typically make an API call to save the reaction
            setReactions(prev => ({
                ...prev,
                [photoId]: [...(prev[photoId] || []), { user: guestName, type: reaction }]
            }));
        } catch (error) {
            console.error('Error adding reaction:', error);
            setNotification({
                message: 'Error adding reaction',
                type: 'error'
            });
        }
    };

    const handleExportData = async () => {
        try {
            // Implement export functionality
            const data = {
                photos: allPhotos,
                users: [...new Set(allPhotos.map(p => p.uploadedBy))],
                challenges: challenges
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'wedding-photos-export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setNotification({
                message: 'Data exported successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            setNotification({
                message: 'Error exporting data',
                type: 'error'
            });
        }
    };
    const getDeviceInfo = (userAgent, platform) => {
        // Check mobile devices first
        if (/iPhone/i.test(userAgent)) return 'iPhone';
        if (/iPad/i.test(userAgent)) return 'iPad';
        if (/Android/i.test(userAgent)) return 'Android Device';

        // Check desktop platforms
        if (/Win/i.test(platform)) return 'Windows';
        if (/Mac/i.test(platform)) return 'Mac';
        if (/Linux/i.test(platform)) return 'Linux';

        return 'Unknown Device';
    };

    const ImageModal = ({image, onClose}) => {
        const [touchStart, setTouchStart] = useState(null);
        const [touchEnd, setTouchEnd] = useState(null);
        const [isAnimating, setIsAnimating] = useState(false);
        const minSwipeDistance = 50;

        // Determine if we're viewing challenge photos or regular gallery
        const isChallengeView = selectedTab === 'challenges';
        const currentChallengePhotos = isChallengeView && activeChallenge ?
            challengePhotos[activeChallenge] || [] : [];
        const photosToUse = isChallengeView ? currentChallengePhotos : (isAdmin ? allPhotos : photos);

        const currentIndex = photosToUse.findIndex(photo =>
            `${API_URL}/uploads/${photo.filename}` === image
        );

        const handlePrev = (e) => {
            if (e) e.stopPropagation();
            if (currentIndex > 0 && !isAnimating) {
                setIsAnimating(true);
                setSelectedImage(`${API_URL}/uploads/${photosToUse[currentIndex - 1].filename}`);
                setTimeout(() => setIsAnimating(false), 300);
            }
        };

        const handleNext = (e) => {
            if (e) e.stopPropagation();
            if (currentIndex < photosToUse.length - 1 && !isAnimating) {
                setIsAnimating(true);
                setSelectedImage(`${API_URL}/uploads/${photosToUse[currentIndex + 1].filename}`);
                setTimeout(() => setIsAnimating(false), 300);
            }
        };

        const onTouchStart = (e) => {
            setTouchEnd(null);
            setTouchStart(e.targetTouches[0].clientX);
        };

        const onTouchMove = (e) => {
            setTouchEnd(e.targetTouches[0].clientX);
        };

        const onTouchEnd = () => {
            if (!touchStart || !touchEnd) return;

            const distance = touchStart - touchEnd;
            const isLeftSwipe = distance > minSwipeDistance;
            const isRightSwipe = distance < -minSwipeDistance;

            if (isLeftSwipe && currentIndex < photosToUse.length - 1) {
                handleNext();
            }
            if (isRightSwipe && currentIndex > 0) {
                handlePrev();
            }
        };

        return (
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-4xl h-full flex items-center justify-center"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <motion.img
                        key={image}
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        transition={{duration: 0.3}}
                        src={image}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain select-none"
                        onClick={e => e.stopPropagation()}
                        draggable={false}
                    />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
                    >
                        <X className="w-8 h-8"/>
                    </button>

                    {/* Navigation buttons - show on larger screens or when not swiping */}
                    <div className="hidden md:block">
                        {currentIndex > 0 && (
                            <button
                                onClick={handlePrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full transition-all"
                            >
                                <ChevronLeft className="w-8 h-8"/>
                            </button>
                        )}

                        {currentIndex < photosToUse.length - 1 && (
                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full transition-all"
                            >
                                <ChevronRight className="w-8 h-8"/>
                            </button>
                        )}
                    </div>

                    {/* Mobile swipe indicator - only show briefly on mobile */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm md:hidden"
                    >
                        <div className="flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                            <ChevronLeft className="w-4 h-4"/>
                            <span>Swipe to navigate</span>
                            <ChevronRight className="w-4 h-4"/>
                        </div>
                    </motion.div>

                    {/* Image counter */}
                    <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                        {currentIndex + 1} / {photosToUse.length}
                    </div>
                </div>
            </motion.div>
        );
    };

    const uploadFiles = async (files) => {
        if (!files || files.length === 0) return;
        setLoading(true);

        try {
            const formData = new FormData();

            // Add each file to the FormData with the correct field name
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Add metadata
            formData.append('metadata', JSON.stringify({
                uploadedBy: guestName,
                uploadType: 'General',
                deviceInfo: deviceInfo
            }));

            // Create and configure XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_URL}/upload`, true);

            // Set up promise to handle the upload
            const uploadPromise = new Promise((resolve, reject) => {
                // Handle progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progressPercent = Math.round((event.loaded / event.total) * 100);
                        const newProgress = {};
                        files.forEach(file => {
                            newProgress[file.name] = progressPercent;
                        });
                        setUploadProgress(newProgress);
                    }
                };

                xhr.onerror = () => reject(new Error('Network error occurred during upload'));
                xhr.ontimeout = () => reject(new Error('Upload request timed out'));

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.response);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Server returned ${xhr.status}: ${xhr.statusText}`));
                    }
                };
            });

            xhr.timeout = 60000; // Increased timeout for larger files
            xhr.send(formData);

            await uploadPromise;

            // Handle successful upload
            setNotification({
                message: `Successfully uploaded ${files.length} ${files.length === 1 ? 'file' : 'files'}!`,
                type: 'success'
            });

            // Clear states
            setSelectedFiles([]);
            setUploadProgress({});
            // Refresh photos
            await fetchPhotos();

        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'Error uploading files. Please try again.';

            if (error.message.includes('Network error')) {
                errorMessage = 'Network error occurred. Please check your internet connection.';
            } else if (error.message.includes('timed out')) {
                errorMessage = 'Upload timed out. Please try again with a smaller file or better connection.';
            } else if (error.message.includes('413')) {
                errorMessage = 'Files are too large. Please reduce file sizes and try again.';
            }

            setNotification({
                message: errorMessage,
                type: 'error'
            });

        } finally {
            setLoading(false);
        }
    };

    const toggleChallenge = (challengeId) => {
        setExpandedChallenges(prev => {
            const newSet = new Set(prev);
            if (newSet.has(challengeId)) {
                newSet.delete(challengeId);
            } else {
                newSet.add(challengeId);
            }
            return newSet;
        });
    };

    const uploadChallengeFile = async (file, challengeId) => {
        if (!file) {
            console.error('No file provided');
            setNotification({
                message: 'Please select a file to upload',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        setActiveChallenge(challengeId);

        try {
            const challenge = challenges.find(c => c.id === challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            const formData = new FormData();
            formData.append('photo', file);
            formData.append('uploadedBy', guestName);
            formData.append('challengeId', challengeId.toString());
            formData.append('challengeTitle', challenge.title);
            formData.append('deviceInfo', deviceInfo);

            // Create and configure XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_URL}/challenge-upload`, true);

            // Set up upload progress tracking
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progressPercent = Math.round((event.loaded / event.total) * 100);
                    setChallengeUploadProgress(prev => ({
                        ...prev,
                        [challengeId]: progressPercent
                    }));
                }
            };

            // Create a promise to handle the upload
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.response);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error occurred'));
                xhr.ontimeout = () => reject(new Error('Upload timed out'));
            });

            xhr.timeout = 30000; // 30 second timeout
            xhr.send(formData);

            const data = await uploadPromise;
            console.log('Challenge upload successful:', data);

            // Reset states
            setSelectedChallengeFiles(prev => {
                const updated = {...prev};
                delete updated[challengeId];
                return updated;
            });
            setChallengeUploadProgress(prev => {
                const updated = {...prev};
                delete updated[challengeId];
                return updated;
            });

            // Refresh photos
            await Promise.all([
                fetchChallengePhotos(challengeId),  // Refresh the specific challenge photos
                fetchPhotos(),                      // Refresh all photos
                // Load all challenges to update completion status
                ...challenges.map(c => fetchChallengePhotos(c.id))
            ]);
            setCompletedChallenges(prev => {
                const newCompleted = new Set(prev);
                newCompleted.add(challengeId);
                return newCompleted;
            });
            setNotification({
                message: 'Challenge photo uploaded successfully!',
                type: 'success'
            });

        } catch (error) {
            console.error('Error uploading challenge photo:', error);
            setNotification({
                message: error.message || 'Error uploading photo. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setActiveChallenge(null);
            // Clear progress on completion
            setChallengeUploadProgress(prev => {
                const updated = {...prev};
                delete updated[challengeId];
                return updated;
            });
        }
    };
    useEffect(() => {
        const loadChallenges = async () => {
            for (const challenge of challenges) {  // Loop over each challenge to fetch its status
                const status = await fetchVoteStatus(challenge.id, guestName);

                // Update state with voting status for each challenge
                setChallengeVoteStatus((prevStatus) => ({
                    ...prevStatus,
                    [challenge.id]: {
                        hasVotedOther: status.hasVoted && status.userVotedPhotoId !== null,
                        votedPhotoId: status.userVotedPhotoId,
                    }
                }));
            }
        };

        loadChallenges();
    }, [challenges, guestName]);

    useEffect(() => {
        const userAgent = navigator.userAgent;
        setDeviceInfo(`${getBrowserInfo(userAgent)} on ${getDeviceInfo(userAgent, navigator.platform)} (${/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'Mobile' : 'Desktop'})`);
    }, []);

    useEffect(() => {
        // Load device info only
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const browser = getBrowserInfo(userAgent);
        const device = getDeviceInfo(userAgent, platform);
        setDeviceInfo(`${device} - ${browser}`);
    }, []);
    useEffect(() => {
        const completed = new Set();
        Object.entries(challengePhotos).forEach(([challengeId, photos]) => {
            if (photos.some(photo => photo.uploadedBy === guestName)) {
                completed.add(parseInt(challengeId));
            }
        });
        setCompletedChallenges(completed);
    }, [challengePhotos, guestName]);

    useEffect(() => {
        const savedGuestName = localStorage.getItem('guestName');
        if (savedGuestName) {
            setGuestName(savedGuestName);
            setIsLoggedIn(true);
            fetchPhotos();
            challenges.forEach(challenge => {
                fetchChallengePhotos(challenge.id);
            });
        }
    }, []);
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000); // Notification will disappear after 3 seconds

            // Cleanup timer on component unmount or when notification changes
            return () => clearTimeout(timer);
        }
    }, [notification]);
    useEffect(() => {
        if (isAdmin) {
            // Calculate admin stats
            const stats = {
                totalUploads: allPhotos.length,
                activeUsers: new Set(allPhotos.map(p => p.uploadedBy)).size,
                challengeCompletion: challenges.reduce((acc, challenge) => ({
                    ...acc,
                    [challenge.id]: allPhotos.filter(p => p.challengeId === challenge.id).length
                }), {}),
                uploadTrends: calculateUploadTrends(allPhotos)
            };
            setAdminStats(stats);
        }
    }, [isAdmin, allPhotos, challenges]);
    const calculateUploadTrends = (photos) => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => ({
            date: new Date(date).toLocaleDateString(),
            uploads: photos.filter(photo => {
                const photoDate = new Date(photo.uploadDate || photo.createdAt)
                    .toISOString().split('T')[0];
                return photoDate === date;
            }).length
        }));
    };
    const fetchChallengePhotos = async (challengeId) => {
        try {
            const response = await fetch(`${API_URL}/challenge-photos/${challengeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch challenge photos');
            }
            const data = await response.json();
            setChallengePhotos(prev => ({
                ...prev,
                [challengeId]: data
            }));

            setCompletedChallenges(prevCompleted => {
                const newCompleted = new Set(prevCompleted);
                if (data.some(photo => photo.uploadedBy === guestName)) {
                    newCompleted.add(challengeId);
                } else {
                    newCompleted.delete(challengeId);
                }
                return newCompleted;
            });
        } catch (error) {
            console.error('Error fetching challenge photos:', error);
            setNotification({
                message: 'Error loading challenge photos',
                type: 'error'
            });
        }
    };
    const fetchPhotos = async (isAdminFetch = false) => {
        setLoading(true);
        try {
            const url = (isAdminFetch || isAdmin)
                ? `${API_URL}/photos`
                : `${API_URL}/photos?uploadedBy=${encodeURIComponent(guestName)}`;

            console.log('Fetching photos from:', url);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch photos');

            const data = await response.json();
            console.log('Received photos:', data.length);

            if (isAdminFetch || isAdmin) {
                setAllPhotos(data);
                setPhotos(data);
            } else {
                setPhotos(data);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
            setNotification({
                message: 'Error loading photos. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChallengeFileSelect = (e, challengeId) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const isImage = file.type.startsWith('image/');
        const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit

        if (!isImage || !isUnder10MB) {
            setNotification({message: 'Please select an image under 10MB.', type: 'error'});

            return;
        }

        setSelectedChallengeFiles(prev => ({
            ...prev,
            [challengeId]: file
        }));
        setChallengeUploadProgress(prev => ({
            ...prev,
            [challengeId]: 0
        }));
    };

    const removeChallengeFile = (challengeId) => {
        setSelectedChallengeFiles(prev => {
            const updated = {...prev};
            delete updated[challengeId];
            return updated;
        });
        setChallengeUploadProgress(prev => {
            const updated = {...prev};
            delete updated[challengeId];
            return updated;
        });
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (guestName.trim()) {
            // Save to localStorage
            localStorage.setItem('guestName', guestName.trim());
            setIsLoggedIn(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            fetchPhotos();
            challenges.forEach(challenge => {
                fetchChallengePhotos(challenge.id);
            });
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('guestName');
        setGuestName('');
        setIsLoggedIn(false);
        setPhotos([]);
        setChallengePhotos({});
        setNotification({
            message: 'Logged out successfully',
            type: 'success'
        });
    };
    const handleAdminLogout = () => {
        setIsAdmin(false);
        // Re-fetch photos for normal user view
        fetchPhotos(false);
        setNotification({
            message: 'Exited admin mode',
            type: 'success'
        });
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (adminPassword === ADMIN_PASSWORD) {
            setLoading(true);
            try {
                await fetchPhotos(true); // Pass true to indicate admin fetch
                setIsAdmin(true);
                setShowAdminModal(false);
                setAdminPassword('');
                setNotification({
                    message: 'Admin access granted',
                    type: 'success'
                });
            } catch (err) {
                console.error('Admin login error:', err);
                setNotification({
                    message: 'Error logging in as admin. Please try again.',
                    type: 'error'
                });
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        } else {
            setNotification({
                message: 'Incorrect password',
                type: 'error'
            });
        }
    };


    const Toast = ({ message, type = 'success', onClose }) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 right-4 z-50"
            >
                <div className={`
        rounded-lg shadow-lg p-4 pr-12 backdrop-blur-sm
        ${type === 'success'
                    ? 'bg-wedding-green-light/90 text-wedding-green-dark border border-wedding-green/20'
                    : 'bg-red-50/90 text-red-800 border border-red-200/20'
                }
        max-w-md w-full relative
      `}>
                    <div className="flex items-start gap-3">
                        {type === 'success' ? (
                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}

                        <div className="flex-1">
                            <p className="font-['Quicksand'] font-medium text-sm">{message}</p>
                        </div>

                        <button
                            onClick={onClose}
                            className={`
              absolute right-2 top-2 p-1.5 rounded-full transition-colors
              ${type === 'success'
                                ? 'hover:bg-wedding-green/20'
                                : 'hover:bg-red-200/20'
                            }
            `}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };
    const renderHeader = () => (
        <motion.header
            initial={{y: -20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="relative mb-12 pt-8"
        >
            {/* Container for admin and logout buttons */}
            <div className="absolute top-0 right-0 z-50 p-4 flex gap-2">
                {isAdmin ? (
                    // Admin mode buttons
                    <>
                        <motion.button
                            onClick={handleAdminLogout}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="font-['Quicksand'] px-4 py-2 rounded-full bg-wedding-purple text-white shadow-md hover:bg-wedding-purple-dark transition duration-300 flex items-center gap-2 border border-wedding-purple-light/30 cursor-pointer select-none"
                        >
                            <Shield className="w-4 h-4"/>
                            <span className="hidden sm:inline">Exit Admin</span>
                        </motion.button>
                        <motion.button
                            onClick={handleLogout}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="font-['Quicksand'] px-4 py-2 rounded-full bg-white shadow-md text-wedding-purple hover:bg-wedding-purple hover:text-white transition duration-300 flex items-center gap-2 border border-wedding-purple-light/30 cursor-pointer select-none"
                        >
                            <LogOut className="w-4 h-4"/>
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </>
                ) : (
                    // Regular user buttons
                    <>
                        <motion.button
                            onClick={() => setShowAdminModal(true)}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="font-['Quicksand'] px-4 py-2 rounded-full bg-white shadow-md text-wedding-purple hover:bg-wedding-purple hover:text-white transition duration-300 flex items-center gap-2 border border-wedding-purple-light/30 cursor-pointer select-none"
                        >
                            <Settings className="w-4 h-4"/>
                            <span className="hidden sm:inline">Admin</span>
                        </motion.button>
                        <motion.button
                            onClick={handleLogout}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="font-['Quicksand'] px-4 py-2 rounded-full bg-white shadow-md text-wedding-purple hover:bg-wedding-purple hover:text-white transition duration-300 flex items-center gap-2 border border-wedding-purple-light/30 cursor-pointer select-none"
                        >
                            <LogOut className="w-4 h-4"/>
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </>
                )}
            </div>

            {/* Ensure the content below doesn't overlap with the logout button */}
            <div className="text-center relative h-32 mt-8">
                {/* Animated heart background - adjusted z-index */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute left-0 right-0 top-4 mx-auto flex justify-center z-0"
                >
                    <Heart className="w-20 h-20 text-wedding-purple-light/30 fill-wedding-purple-light/30"/>
                </motion.div>

                {/* Text overlay with adjusted flower positioning */}
                <h1 className="font-['Great_Vibes'] text-6xl text-wedding-purple-dark relative z-10 pt-2">
                    <span className="relative inline-flex items-center">
                        <div className="absolute -left-7 top-1/2 -translate-y-1/2">
                            <FlowerIcon className="w-6 h-6 text-wedding-green"/>
                        </div>
                        R & S
                        <div className="absolute -right-7 top-1/2 -translate-y-1/2">
                            <FlowerIcon className="w-6 h-6 text-wedding-green"/>
                        </div>
                    </span>
                </h1>

                <motion.h2
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="font-['Cormorant_Garamond'] text-3xl text-wedding-purple mb-6"
                >
                    Engagement Celebration
                </motion.h2>

                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        <Heart className="w-4 h-4 text-wedding-purple-light fill-wedding-purple-light"/>
                    </motion.div>
                    <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                </div>
            </div>
        </motion.header>
    );
    const fontStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600&display=swap');
    `;
    const renderLoginScreen = () => (

        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="min-h-screen bg-gradient-to-br from-wedding-accent-light to-wedding-green-light/20 flex items-center justify-center"
        >
            <Card
                className="relative bg-white/95 backdrop-blur-sm p-6 sm:p-12 rounded-lg shadow-xl max-w-md w-full border border-wedding-purple-light/30">
                <CardContent className="text-center mb-8 mt-4">
                    <div className="relative h-32">
                        <style>{fontStyles}</style>

                        {/* Animated heart background */}
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                            className="absolute left-0 right-0 top-4 mx-auto flex justify-center z-0"
                        >
                            <Heart className="w-20 h-20 text-wedding-purple-light/30 fill-wedding-purple-light/30"/>
                        </motion.div>

                        {/* Text overlay */}
                        <motion.h1
                            initial={{scale: 0.9}}
                            animate={{scale: 1}}
                            className="font-['Great_Vibes'] text-5xl text-wedding-purple-dark relative z-10 pt-2"
                        >
                            R & S
                        </motion.h1>

                        <h2 className="font-['Cormorant_Garamond'] text-2xl text-wedding-purple mb-4">
                            Engagement Celebration
                        </h2>

                        {/* Decorative line with heart */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            >
                                <Heart className="w-4 h-4 text-wedding-purple-light fill-wedding-purple-light"/>
                            </motion.div>
                            <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                        </div>

                        {/* Badge with proper mobile styling */}
                        <div className="flex justify-center px-4">
                            <Badge
                                variant="outline"
                                className="font-['Quicksand'] text-wedding-purple-light italic text-sm sm:text-base px-4 py-1 whitespace-nowrap border-wedding-purple-light/30 bg-white/50"
                            >
                                Share your moments with us
                            </Badge>
                        </div>
                    </div>
                </CardContent>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin(e);
                    triggerConfetti();
                }} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="font-['Quicksand'] w-full p-3 pl-10 border-2 border-wedding-green-light focus:border-wedding-purple focus:ring-wedding-purple rounded-full bg-white/70"
                            required
                        />
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wedding-purple-light"/>
                    </div>
                    <button
                        type="submit"
                        className="font-['Quicksand'] w-full bg-wedding-purple text-white p-3 rounded-full hover:bg-wedding-purple-dark transition duration-300 shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <span>Join the Celebration</span>
                        <Heart className="w-4 h-4 group-hover:fill-white transition-colors"/>
                    </button>
                </form>
            </Card>
        </motion.div>
    );
    const EnhancedPhotoGallery = ({photos, onImageClick, API_URL}) => {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {photos.map((photo) => (
                    <motion.div
                        key={photo.id}
                        className="group relative bg-wedding-accent-light rounded-lg sm:rounded-xl overflow-hidden shadow-md cursor-pointer"
                        whileHover={{y: -2}}
                        transition={{duration: 0.2}}
                        onClick={() => onImageClick(`${API_URL}/uploads/${photo.filename}`)}
                    >
                        <OptimizedImage
                            src={`${API_URL}/uploads/${photo.filename}`}
                            thumbnailPath={photo.thumbnailPath}
                            mediaType={photo.mediaType}
                            alt={`Photo by ${photo.uploadedBy || 'Unknown Guest'}`}
                            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Gradient overlay */}
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                        {/* Photo info */}
                        <div
                            className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white bg-gradient-to-t from-black/70 to-transparent sm:transform sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-sm sm:text-base font-medium truncate">
                                {photo.uploadedBy || 'Unknown Guest'}
                            </p>
                            <p className="text-xs sm:text-sm opacity-90 truncate hidden sm:block">
                                {photo.uploadType || 'General'}
                                {photo.challengeInfo && ` - ${photo.challengeInfo}`}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };
    const renderFooter = () => (
        <motion.footer
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="bg-white/80 backdrop-blur-sm mt-20 py-8 rounded-t-3xl shadow-lg border-t border-wedding-purple-light/30"
        >
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center space-y-4">


                    <motion.h2
                        whileHover={{scale: 1.05}}
                        className="font-['Cormorant_Garamond'] text-4xl text-wedding-purple-dark"
                    >
                        Rushel & Sivani
                    </motion.h2>
                    <motion.div
                        className="flex items-center justify-center gap-3 mb-6"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        {/*<GemIcon className="w-5 h-5 text-wedding-purple-light"/>*/}
                        <Heart className="w-6 h-6 text-wedding-purple-light fill-wedding-purple-light"/>
                        {/*<GemIcon className="w-5 h-5 text-wedding-purple-light"/>*/}
                    </motion.div>
                    <motion.div
                        whileHover={{scale: 1.05}}
                        className="flex items-center justify-center gap-2 text-wedding-purple"
                    >
                        <Calendar className="w-5 h-5"/>
                        <p className="font-['Great_Vibes'] text-2xl">
                            10th November 2024
                        </p>
                    </motion.div>

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        >
                            <Heart className="w-4 h-4 text-wedding-purple-light"/>
                        </motion.div>
                        <div className="h-px bg-wedding-purple-light flex-1 max-w-[100px]"/>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
    const fetchVoteStatus = async (challengeId, guestName) => {
        try {
            // Adjust the URL to match the existing endpoint
            const response = await fetch(`${API_URL}/challenges/${challengeId}/vote-status?userName=${guestName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                hasVoted: data.hasVoted,
                userVotedPhotoId: data.userVotedPhotoId,
            };
        } catch (error) {
            console.error('Error fetching vote status:', error);
            return {hasVoted: false, userVotedPhotoId: null };
        }
    };
    // Add this modal render function
    const renderAdminModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full border-2 border-wedding-purple relative">
                <button
                    onClick={() => {
                        setShowAdminModal(false);
                        setAdminPassword('');
                    }}
                    className="absolute top-4 right-4 text-wedding-purple-dark hover:text-wedding-purple transition-colors duration-300"
                >
                    <X className="w-5 h-5"/>
                </button>

                <div className="text-center mb-6">
                    <LogIn className="w-12 h-12 text-wedding-purple mx-auto mb-4"/>
                    <h2 className="text-2xl font-serif text-wedding-purple-dark">
                        Admin Access
                    </h2>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full p-3 border-2 border-wedding-green focus:ring-wedding-purple focus:border-wedding-purple rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-wedding-purple text-white p-3 rounded hover:bg-wedding-purple-dark transition duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <span>Logging in...</span>
                        ) : (
                            <>
                                <span>Login</span>
                                <LogIn className="w-4 h-4"/>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
    const handleDeleteClick = (e, photo) => {
        e.stopPropagation(); // Prevent opening the photo modal
        setPhotoToDelete(photo);
        setShowDeleteConfirm(true);
    };
    const confirmDelete = async () => {
        if (!photoToDelete) return;

        try {
            const response = await fetch(
                `${API_URL}/photos/${photoToDelete.id}?userName=${guestName}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Failed to delete photo');
            }

            // Refresh the gallery
            fetchPhotos();

            setShowDeleteConfirm(false);
            setPhotoToDelete(null);
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };
    const renderGeneralUpload = () => (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8 border border-wedding-purple-light/30">
            <div className="text-center mb-6">
                <Camera className="w-8 h-8 text-wedding-purple mx-auto mb-2" />
                <h2 className="text-2xl font-serif text-wedding-purple-dark">Share Your Photos</h2>
            </div>

            <PhotoUploader
                onFileSelect={setSelectedFiles} // Add this for desktop
                onUpload={uploadFiles}         // This will be used for both mobile and desktop
                maxPhotos={MAX_PHOTOS}
                loading={loading}
                deviceInfo={deviceInfo}
                setNotification={setNotification}
                uploadProgress={uploadProgress}
            />
        </div>
    );

    const renderChallenges = () => {
        return (
            <div className="max-w-4xl mx-auto space-y-4">
                {challenges.map((challenge) => {
                    const hasUploadedPhoto = challengePhotos[challenge.id]?.some(
                        photo => photo.uploadedBy === guestName
                    ) && !challenge.isPrivate;

                    const handleVoteUpdate = async () => {
                        await fetchChallengePhotos(challenge.id);
                        const voteStatusResponse = await fetch(
                            `${API_URL}/challenges/${challenge.id}/vote-status?userName=${guestName}`
                        );
                        const voteStatusData = await voteStatusResponse.json();

                        setChallengeVoteStatus(prevStatus => ({
                            ...prevStatus,
                            [challenge.id]: {
                                hasVotedOther: voteStatusData.hasVoted && voteStatusData.userVotedPhotoId !== null,
                                votedPhotoId: voteStatusData.userVotedPhotoId,
                            }
                        }));
                    };
                    const ChallengeMediaViewer = ({
                                                      challenge,
                                                      photos,
                                                      onMediaClick,
                                                      isCompleted,
                                                      isPrivate,
                                                      guestName
                                                  }) => {
                        return (
                            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {photos.map((photo) => (
                                    <div key={photo.id} className="space-y-2">
                                        <div
                                            className="aspect-square rounded-lg overflow-hidden bg-wedding-purple-light/5 cursor-pointer group relative"
                                            onClick={() => onMediaClick(photo)}
                                        >
                                            {photo.mediaType === 'video' ? (
                                                <div className="relative w-full h-full">
                                                    <OptimizedImage
                                                        src={`${API_URL}/uploads/${photo.filename}`}
                                                        alt={`Video by ${photo.uploadedBy}`}
                                                        mediaType="video"
                                                        className="w-full h-full object-cover"
                                                        thumbnailPath={photo.thumbnailPath}
                                                    />
                                                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                                        {photo.filename.toLowerCase().endsWith('.mov') ? 'MOV' : 'MP4'}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                                                            <Play className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>

                                                    <video
                                                        src={`${API_URL}/uploads/${photo.filename}`}
                                                        className="w-full h-full object-cover"
                                                        preload="metadata"
                                                        muted
                                                        playsInline
                                                        onLoadedMetadata={(e) => {
                                                            e.target.currentTime = 0;
                                                            e.target.pause();
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <OptimizedImage
                                                    src={`${API_URL}/uploads/${photo.filename}`}
                                                    alt={`Photo by ${photo.uploadedBy}`}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    thumbnailPath={photo.thumbnailPath}
                                                />
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-wedding-purple-dark">
                                                By: {photo.uploadedBy}
                                            </p>
                                            <ChallengeInteractions
                                                photoId={photo.id}
                                                currentUser={guestName}
                                                challengeId={challenge.id}
                                                uploadedBy={photo.uploadedBy}
                                                onVoteChange={handleVoteUpdate}
                                                votedPhotoId={challengeVoteStatus[challenge.id]?.votedPhotoId}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    };

                    return (
                        <div
                            key={challenge.id}
                            className={`border rounded-lg overflow-hidden ${
                                completedChallenges.has(challenge.id)
                                    ? 'border-wedding-green bg-wedding-green-light/5'
                                    : 'border-wedding-purple-light/30 bg-white'
                            }`}
                        >
                            {/* Challenge Header */}
                            <div className="p-4 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-medium text-wedding-purple-dark">
                                            {challenge.title}
                                        </h3>
                                        <p className="text-wedding-purple mt-2">
                                            {challenge.description}
                                        </p>
                                    </div>
                                    {completedChallenges.has(challenge.id) && !challenge.isPrivate && (
                                        <CheckCircle className="w-6 h-6 text-wedding-green flex-shrink-0" />
                                    )}
                                </div>
                            </div>

                            {/* Leaderboard Section */}
                            {!challenge.isPrivate && (
                                <div className="px-4 sm:px-6">
                                    <ChallengeLeaderboard
                                        challengeId={challenge.id}
                                        challengeTitle={challenge.title}
                                        challengePhotos={challengePhotos[challenge.id] || []}
                                        guestName={guestName}
                                    />
                                </div>
                            )}

                            {/* Upload Section */}
                            <div className="p-4 sm:p-6 border-t border-wedding-purple-light/10">
                                <PhotoUploader
                                    challengeMode={true}
                                    challengeId={challenge.id}
                                    loading={loading && activeChallenge === challenge.id}
                                    onUpload={uploadChallengeFile}
                                    deviceInfo={deviceInfo}
                                    setNotification={setNotification}
                                    isCompleted={completedChallenges.has(challenge.id)}
                                    isPrivate={challenge.isPrivate}
                                    challengeTitle={challenge.title}
                                    guestName={guestName}
                                    challengePhotos={challengePhotos[challenge.id] || []}
                                    uploadProgress={challengeUploadProgress[challenge.id] || 0}
                                />
                            </div>

                            {/* Photos Grid */}
                            {!challenge.isPrivate && hasUploadedPhoto && challengePhotos[challenge.id] && (
                                <div className="border-t border-wedding-purple-light/10">
                                    <button
                                        onClick={() => toggleChallenge(challenge.id)}
                                        className="w-full flex justify-between items-center p-4 hover:bg-wedding-purple-light/5 transition-colors"
                                    >
                                    <span className="text-lg font-medium text-wedding-purple-dark flex items-center gap-2">
                                        <Camera className="w-5 h-5" />
                                        Challenge Photos ({challengePhotos[challenge.id].length})
                                    </span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-wedding-purple-light transition-transform ${
                                                expandedChallenges.has(challenge.id) ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {expandedChallenges.has(challenge.id) && (
                                        <ChallengeMediaViewer
                                            challenge={challenge}
                                            photos={challengePhotos[challenge.id]}
                                            onMediaClick={(photo) => {
                                                setActiveChallenge(challenge.id);
                                                setSelectedImage(`${API_URL}/uploads/${photo.filename}`);
                                            }}
                                            isCompleted={completedChallenges.has(challenge.id)}
                                            isPrivate={challenge.isPrivate}
                                            guestName={guestName}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPhotoGallery = () => {
        const handleDeleteClick = (e, photo) => {
            e.stopPropagation(); // Prevent opening the photo modal
            setPhotoToDelete(photo);
            setShowDeleteConfirm(true);
        };

        const confirmDelete = async () => {
            if (!photoToDelete) return;

            try {
                const response = await fetch(
                    `${API_URL}/photos/${photoToDelete.id}?userName=${guestName}`,
                    { method: 'DELETE' }
                );

                if (!response.ok) {
                    throw new Error('Failed to delete photo');
                }

                // Refresh the photos
                await fetchPhotos();
                if (photoToDelete.challengeId) {
                    await fetchChallengePhotos(photoToDelete.challengeId);
                }

                if (isAdmin) {
                    for (const challenge of challenges) {
                        await fetchChallengePhotos(challenge.id);
                    }
                }
                // Show success notification
                setNotification({
                    message: 'Photo deleted successfully',
                    type: 'success'
                });

                // Reset states
                setShowDeleteConfirm(false);
                setPhotoToDelete(null);

            } catch (error) {
                console.error('Error deleting photo:', error);
                setNotification({
                    message: 'Error deleting photo',
                    type: 'error'
                });
            }
        };

        const photosToDisplay = isAdmin ? allPhotos : photos.filter(photo => {
            let metadata;
            try {
                metadata = typeof photo.description === 'string'
                    ? JSON.parse(photo.description)
                    : photo.description || {};
            } catch (e) {
                metadata = {};
            }
            return (metadata.uploadedBy === guestName || photo.uploadedBy === guestName) &&
                !challenges.find(c => c.id === metadata.challengeId && c.isPrivate);
        });

        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-8">
                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-serif text-wedding-purple-dark">
                        {isAdmin ? 'Admin Dashboard' : 'Your Captured Moments'}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="h-px bg-wedding-purple-light/50 flex-1 max-w-[50px]"/>
                        <Heart className="w-4 h-4 text-wedding-purple-light fill-wedding-purple-light"/>
                        <div className="h-px bg-wedding-purple-light/50 flex-1 max-w-[50px]"/>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4 sm:py-8">
                        <p className="text-wedding-purple-light italic">Loading moments...</p>
                    </div>
                ) : photosToDisplay.length === 0 ? (
                    <div className="text-center py-4 sm:py-8">
                        <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-wedding-purple-light mx-auto mb-2"/>
                        <p className="text-wedding-purple-light italic">No photos yet</p>
                    </div>
                ) : isAdmin ? (
                    <AdminView
                        photos={photosToDisplay}
                        challenges={challenges}
                        onExportData={handleExportData}
                        onRefreshData={() => fetchPhotos(true)}
                    />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                        {photosToDisplay.map((photo) => (
                            <motion.div
                                key={photo.id}
                                className="group relative bg-wedding-accent-light rounded-lg sm:rounded-xl overflow-hidden shadow-md cursor-pointer"
                                whileHover={{y: -2}}
                                transition={{duration: 0.2}}
                                onClick={() => setSelectedImage(`${API_URL}/uploads/${photo.filename}`)}
                            >
                                {photo.mediaType === 'video' ? (
                                    <div className="relative w-full aspect-square">
                                        <OptimizedImage
                                            src={`${API_URL}/uploads/${photo.filename}`}
                                            thumbnailPath={photo.thumbnailPath}
                                            mediaType="video"
                                            alt={`Video by ${photo.uploadedBy}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 z-10">
                                            <button
                                                onClick={(e) => handleDeleteClick(e, photo)}
                                                className="p-2 rounded-full bg-black/50 hover:bg-black/70 shadow-lg transition-all duration-300"
                                            >
                                                <Trash className="w-4 h-4 text-white"/>
                                            </button>
                                        </div>
                                        {/* Video type indicator */}
                                        <div
                                            className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                            {photo.filename.toLowerCase().endsWith('.mov') ? 'MOV' : 'MP4'}
                                        </div>
                                    </div>
                                ) : (
                                    <OptimizedImage
                                        src={`${API_URL}/uploads/${photo.filename}`}
                                        thumbnailPath={photo.thumbnailPath}
                                        mediaType={photo.mediaType}
                                        alt={`Photo by ${photo.uploadedBy}`}
                                        className="w-full aspect-square object-cover"
                                    />


                                )}
                                <div className="absolute top-2 right-2 z-10">
                                    <button
                                        onClick={(e) => handleDeleteClick(e, photo)}
                                        className="p-2 rounded-full bg-black/50 hover:bg-black/70 shadow-lg transition-all duration-300"
                                    >
                                        <Trash className="w-4 h-4 text-white"/>
                                    </button>
                                </div>
                                {/* Photo/Video info overlay */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white bg-gradient-to-t from-black/70 to-transparent sm:transform sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-sm sm:text-base font-medium truncate">
                                        {photo.uploadedBy || 'Unknown Guest'}
                                    </p>
                                    <p className="text-xs sm:text-sm opacity-90 truncate hidden sm:block">
                                        {photo.uploadType || 'General'}
                                        {photo.challengeInfo && ` - ${photo.challengeInfo}`}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                {selectedImage && (
                    <MediaModal
                        src={selectedImage}
                        photos={photosToDisplay || []} // Make sure to pass the current photos array
                        onClose={() => {
                            setSelectedImage(null);
                            setActiveChallenge(null);
                        }}
                        onNavigate={(newSrc) => {
                            setSelectedImage(newSrc);
                        }}
                    />
                )}
                {showDeleteConfirm && (
                    <AnimatePresence>
                        <DeleteConfirmModal
                            onClose={() => {
                                setShowDeleteConfirm(false);
                                setPhotoToDelete(null);
                            }}
                            onConfirm={confirmDelete}
                        />
                    </AnimatePresence>
                )}

            </div>
        );
    };
    if (!isLoggedIn) {
        return renderLoginScreen();
    }

    return (
        <AnimatePresence>
            <div className="min-h-screen bg-gradient-to-br from-wedding-accent-light to-wedding-green-light/20">
                <style>{fontStyles}</style>
                <div className="p-6">
                    <div className="max-w-4xl mx-auto">
                        {renderHeader()}
                        {!isAdmin && (
                            <>
                                <div className="mb-8 flex justify-center gap-4">
                                    <button
                                        onClick={() => setSelectedTab('general')}
                                        className={`font-['Quicksand'] px-8 py-3 rounded-full shadow-md transition duration-300 flex items-center gap-2 ${
                                            selectedTab === 'general'
                                                ? 'bg-wedding-purple text-white'
                                                : 'bg-white/80 text-wedding-purple hover:bg-wedding-purple hover:text-white'
                                        }`}
                                    >
                                        <Camera className="w-4 h-4"/>
                                        <span>Upload Photos</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedTab('challenges')}
                                        className={`font-['Quicksand'] px-8 py-3 rounded-full shadow-md transition duration-300 flex items-center gap-2 ${
                                            selectedTab === 'challenges'
                                                ? 'bg-wedding-purple text-white'
                                                : 'bg-white/80 text-wedding-purple hover:bg-wedding-purple hover:text-white'
                                        }`}
                                    >
                                        <Star className="w-4 h-4"/>
                                        <span>Photo Challenges</span>
                                    </button>
                                </div>

                                {selectedTab === 'general' && (
                                    <>
                                        {renderGeneralUpload()}
                                        {renderPhotoGallery()}
                                    </>
                                )}
                                {selectedTab === 'challenges' && renderChallenges()}
                            </>
                        )}

                        {isAdmin && renderPhotoGallery()}
                    </div>
                </div>

                {renderFooter()}

                {showAdminModal && renderAdminModal()}
                {notification && (
                    <Toast
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
                {selectedImage && (
                    <MediaModal
                        src={selectedImage}
                        photos={activeChallenge ? challengePhotos[activeChallenge] : photos}
                        onClose={() => {
                            setSelectedImage(null);
                            setActiveChallenge(null);
                        }}
                        onNavigate={(newSrc) => {
                            setSelectedImage(newSrc);
                        }}
                    />
                )}

            </div>
        </AnimatePresence>

    );
}

export default App;