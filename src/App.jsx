import React, {useState, useEffect} from 'react';
import {
    CheckCircle, Upload, X, AlertCircle, Settings,
    LogIn, ChevronDown, ChevronLeft, ChevronRight,
    Heart, Camera, GemIcon, Star, Calendar,
    FlowerIcon, Sparkles, Maximize2, LogOut, Shield
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Alert, AlertTitle} from "./components/ui/alert";
import {Button} from "./components/ui/button";
import {Card, CardContent} from "./components/ui/card";
import {Badge} from "./components/ui/badge";
import confetti from 'canvas-confetti';

const API_URL = 'http://slyrix.com:3001/api';

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
        title: 'Catch the Groom',
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

function App() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
    const [selectedChallengeFiles, setSelectedChallengeFiles] = useState({});
    const [challengeUploadProgress, setChallengeUploadProgress] = useState({});
    const [failedImages, setFailedImages] = useState(new Set()); // Add this state at the top with other states
    const [imageErrors, setImageErrors] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);


    useEffect(() => {
        if (isLoggedIn) {
            fetchPhotos();
            // Fetch photos for all challenges
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

    const handleFileSelection = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > MAX_PHOTOS) {
            setNotification({message: `You can only upload up to ${MAX_PHOTOS} photos at once.`, type: 'error'});
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
            return isImage && isUnder10MB;
        });

        if (validFiles.length !== files.length) {
            setNotification({message: 'Some files were skipped. Only images under 10MB are allowed.', type: 'error'});

        }

        setSelectedFiles(validFiles);
        // Initialize progress for each file
        const initialProgress = {};
        validFiles.forEach(file => {
            initialProgress[file.name] = 0;
        });
        setUploadProgress(initialProgress);
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
    const removeFile = (fileName) => {
        setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
        setUploadProgress(prev => {
            const updated = {...prev};
            delete updated[fileName];
            return updated;
        });
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) return;
        setLoading(true);
        const failedUploads = new Set();

        try {
            // Create a new FormData instance
            const formData = new FormData();

            // Add each file to the FormData
            selectedFiles.forEach((file) => {
                formData.append('photos', file);
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
                        selectedFiles.forEach(file => {
                            newProgress[file.name] = progressPercent;
                        });
                        setUploadProgress(newProgress);
                    }
                };

                // Handle network errors
                xhr.onerror = () => {
                    reject(new Error('Network error occurred during upload'));
                };

                // Handle timeout
                xhr.ontimeout = () => {
                    reject(new Error('Upload request timed out'));
                };

                // Handle response
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Server returned ${xhr.status}: ${xhr.statusText}`));
                    }
                };
            });

            // Set timeout to 30 seconds
            xhr.timeout = 30000;

            // Send the request
            xhr.send(formData);

            // Wait for upload to complete
            await uploadPromise;

            // Handle successful upload
            setNotification({
                message: 'Photos uploaded successfully!',
                type: 'success'
            });

            // Clear upload state
            setSelectedFiles([]);
            setUploadProgress({});

            // Refresh photos
            await fetchPhotos();

        } catch (error) {
            console.error('Upload error:', error);

            // Handle specific error types
            let errorMessage = 'Error uploading photos. Please try again.';

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

            // Mark all files as failed
            selectedFiles.forEach(file => failedUploads.add(file.name));
            setFailedImages(failedUploads);

        } finally {
            setLoading(false);
        }
    };
    const handleChallengeUpload = async (e, challengeId) => {
        if (!e.target.files[0]) return;

        setLoading(true);
        setActiveChallenge(challengeId);
        const file = e.target.files[0];

        try {
            await uploadChallengeFile(file, challengeId);
        } catch (err) {
            console.error('Error uploading challenge photo:', err);
            setNotification({message: 'Error uploading photo. Please try again.', type: 'error'});
        }
        setLoading(false);
        setActiveChallenge(null);
        setUploadProgress({...uploadProgress, challenge: 0});
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
        if (!file) return;

        setLoading(true);
        setActiveChallenge(challengeId);

        try {
            const challenge = challenges.find(c => c.id === challengeId);
            const formData = new FormData();

            formData.append('photo', file);
            formData.append('uploadedBy', guestName);
            formData.append('challengeId', challengeId.toString());
            formData.append('challengeTitle', challenge.title);
            formData.append('deviceInfo', deviceInfo);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_URL}/challenge-upload`, true);

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progressPercent = Math.round((event.loaded / event.total) * 100);
                        setChallengeUploadProgress(prev => ({
                            ...prev,
                            [challengeId]: progressPercent
                        }));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error occurred during upload'));
                xhr.ontimeout = () => reject(new Error('Upload request timed out'));

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(new Error(`HTTP error! status: ${xhr.status}`));
                    }
                };
            });

            xhr.timeout = 30000;
            xhr.send(formData);

            const data = await uploadPromise;
            console.log('Challenge upload successful:', data);
            await fetchChallengePhotos(challengeId);
            await fetchPhotos();

            // Reset upload state after successful upload
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

            setNotification({
                message: 'Challenge photo uploaded successfully!',
                type: 'success'
            });

        } catch (error) {
            console.error('Error uploading challenge photo:', error);
            setNotification({
                message: 'Error uploading photo. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setActiveChallenge(null);
        }
    };
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

    const fetchChallengePhotos = async (challengeId) => {
        try {
            const response = await fetch(`${API_URL}/challenge-photos/${challengeId}`);
            const data = await response.json();
            setChallengePhotos(prev => ({
                ...prev,
                [challengeId]: data
            }));
        } catch (error) {
            console.error('Error fetching challenge photos:', error);
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
                className="relative bg-white/95 backdrop-blur-sm p-12 rounded-lg shadow-xl max-w-md w-full border border-wedding-purple-light/30"
            >
                <div className="absolute left-0 right-0 -top-14 flex justify-center">
                    <style>{fontStyles}</style>
                    <motion.div
                        initial={{y: -10}}
                        animate={{y: 0}}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                    >
                        {/*<Heart className="w-12 h-12 text-wedding-purple fill-wedding-purple"/>*/}
                    </motion.div>
                </div>

                <CardContent className="text-center mb-8 mt-4">
                    <motion.h1
                        initial={{scale: 0.9}}
                        animate={{scale: 1}}
                        className="font-['Great_Vibes'] text-5xl text-wedding-purple-dark mb-2"
                    >
                        R & S
                    </motion.h1>
                    <h2 className="font-['Cormorant_Garamond'] text-2xl text-wedding-purple mb-4">
                        Engagement Celebration
                    </h2>
                    <Badge variant="outline" className="font-['Quicksand'] text-wedding-purple-light italic">
                        Share your moments with us
                    </Badge>
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
                    <Button
                        type="submit"
                        className="font-['Quicksand'] w-full bg-wedding-purple text-white p-3 rounded-full hover:bg-wedding-purple-dark transition duration-300 shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <span>Join the Celebration</span>
                        <Heart className="w-4 h-4 group-hover:fill-white transition-colors"/>
                    </Button>
                </form>
            </Card>
        </motion.div>
    );
    const renderFooter = () => (
        <motion.footer
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="bg-white/80 backdrop-blur-sm mt-20 py-8 rounded-t-3xl shadow-lg border-t border-wedding-purple-light/30"
        >
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center space-y-4">
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

                    <motion.h2
                        whileHover={{scale: 1.05}}
                        className="font-['Cormorant_Garamond'] text-4xl text-wedding-purple-dark"
                    >
                        Rushel & Sivani
                    </motion.h2>

                    <motion.div
                        whileHover={{scale: 1.05}}
                        className="flex items-center justify-center gap-2 text-wedding-purple"
                    >
                        <Calendar className="w-5 h-5"/>
                        <p className="font-['Great_Vibes'] text-2xl">
                            10th November, 2024
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

    const renderGeneralUpload = () => (
        <div
            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8 border border-wedding-purple-light/30">
            <div className="text-center mb-6">
                <Camera className="w-8 h-8 text-wedding-purple mx-auto mb-2"/>
                <h2 className="text-2xl font-serif text-wedding-purple-dark">Share Your Photos</h2>
            </div>

            <div className="space-y-4">
                <div
                    className="border-2 border-dashed border-wedding-purple-light/50 rounded-xl p-8 text-center bg-wedding-accent-light/50">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelection}
                        className="hidden"
                        id="file-upload"
                        disabled={loading}
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                    >
                        <Upload className="w-12 h-12 text-wedding-purple-light mb-2"/>
                        <p className="text-wedding-purple-dark">
                            Click to select up to {MAX_PHOTOS} photos
                            <br/>
                            <span className="text-sm text-wedding-purple-light italic">
                                (Max 10MB per image)
                            </span>
                        </p>
                    </label>
                </div>
                {selectedFiles.length > 0 && (
                    <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto">
                            {selectedFiles.map((file) => (
                                <div key={file.name}
                                     className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <div className="flex-1">
                                        <p className="text-sm truncate">{file.name}</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                                                style={{width: `${uploadProgress[file.name] || 0}%`}}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.name)}
                                        className="ml-2 text-gray-500 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={uploadFiles}
                            disabled={loading}
                            className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition disabled:bg-gray-300"
                        >
                            {loading ? 'Uploading...' : `Upload ${selectedFiles.length} Photos`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderChallenges = () => (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-wedding-purple-light">
            <h2 className="text-2xl font-serif mb-4 text-wedding-purple-dark">Photo Challenges</h2>
            <div className="space-y-6">
                {challenges.map((challenge) => {
                    const hasUploadedPhoto = challengePhotos[challenge.id]?.some(
                        photo => photo.uploadedBy === guestName
                    ) && !challenge.isPrivate;

                    return (
                        <div
                            key={challenge.id}
                            className={`border-2 rounded-lg p-6 relative ${
                                completedChallenges.has(challenge.id)
                                    ? 'bg-wedding-green-light/20 border-wedding-green'
                                    : 'bg-white border-wedding-purple-light'
                            }`}
                        >
                            {completedChallenges.has(challenge.id) && (
                                <div className="absolute top-4 right-4">
                                    <CheckCircle className="text-wedding-green-dark" size={24}/>
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-semibold text-wedding-purple-dark mb-2">
                                    {challenge.title}
                                </h3>
                                <p className="text-wedding-purple">
                                    {challenge.description}
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-wedding-green rounded-lg p-4 text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChallengeFileSelect(e, challenge.id)}
                                    className="hidden"
                                    id={`challenge-upload-${challenge.id}`}
                                    disabled={loading}
                                />
                                <label
                                    htmlFor={`challenge-upload-${challenge.id}`}
                                    className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                                        completedChallenges.has(challenge.id)
                                            ? 'bg-wedding-green-light/20 hover:bg-wedding-green-light/40'
                                            : 'bg-wedding-accent-light hover:bg-wedding-green-light/20'
                                    }`}
                                >
                                    {completedChallenges.has(challenge.id) ? (
                                        <>
                                            <div className="mb-2 text-wedding-green-dark">
                                                <CheckCircle size={32}/>
                                            </div>
                                            <p className="text-wedding-purple-dark font-medium">
                                                Challenge Completed!
                                            </p>
                                            <p className="text-sm text-wedding-purple mt-1">
                                                Click to upload another photo
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-2 text-wedding-purple">
                                                <Upload size={32}/>
                                            </div>
                                            <p className="text-wedding-purple-dark font-medium">
                                                Select Photo for this Challenge
                                            </p>
                                            <p className="text-sm text-wedding-purple mt-1">
                                                Click to select an image
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>

                            {selectedChallengeFiles[challenge.id] && (
                                <div className="mt-4 space-y-4">
                                    <div
                                        className="flex items-center justify-between bg-wedding-green-light/30 p-2 rounded">
                                        <div className="flex-1">
                                            <p className="text-sm truncate text-wedding-purple-dark">
                                                {selectedChallengeFiles[challenge.id].name}
                                            </p>
                                            {challengeUploadProgress[challenge.id] > 0 && (
                                                <div className="w-full bg-wedding-green-light rounded-full h-2">
                                                    <div
                                                        className="bg-wedding-purple h-2 rounded-full transition-all duration-300"
                                                        style={{width: `${challengeUploadProgress[challenge.id]}%`}}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeChallengeFile(challenge.id)}
                                            className="ml-2 text-wedding-purple hover:text-wedding-purple-dark"
                                        >
                                            <X className="w-4 h-4"/>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => uploadChallengeFile(selectedChallengeFiles[challenge.id], challenge.id)}
                                        disabled={loading}
                                        className="w-full bg-wedding-purple text-white p-2 rounded hover:bg-wedding-purple-dark transition duration-300 disabled:bg-wedding-purple-light/50"
                                    >
                                        {loading && activeChallenge === challenge.id
                                            ? 'Uploading...'
                                            : 'Upload Photo'
                                        }
                                    </button>
                                </div>
                            )}

                            {hasUploadedPhoto && challengePhotos[challenge.id] && challengePhotos[challenge.id].length > 0 ? (
                                <div className="mt-6">
                                    <button
                                        onClick={() => toggleChallenge(challenge.id)}
                                        className="w-full flex justify-between items-center text-lg font-medium text-wedding-purple-dark p-2 hover:bg-wedding-green-light/10 rounded"
                                    >
                                        <span>Challenge Photos ({challengePhotos[challenge.id].length})</span>
                                        <ChevronDown
                                            className={`transform transition-transform ${
                                                expandedChallenges.has(challenge.id) ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                    {expandedChallenges.has(challenge.id) && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                            {challengePhotos[challenge.id].map((photo) => (
                                                <div key={photo.id}
                                                     className="bg-wedding-green-light/10 p-2 rounded aspect-auto">
                                                    <img
                                                        src={`${API_URL}/uploads/${photo.filename}`}
                                                        alt={`Photo by ${photo.uploadedBy}`}
                                                        className="w-full h-[200px] object-contain rounded"
                                                        onClick={() => {
                                                            setActiveChallenge(challenge.id);
                                                            setSelectedImage(`${API_URL}/uploads/${photo.filename}`);
                                                        }}/>
                                                    <p className="text-sm mt-1 text-wedding-purple">
                                                        By: {photo.uploadedBy}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : challenge.isPrivate && !hasUploadedPhoto ? (
                                <p className="text-sm text-gray-500 mt-4">
                                    This is a private challenge. Only your own photos will be visible here.
                                </p>
                            ) : challenge.isPrivate ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                    {challengePhotos[challenge.id]
                                        .filter(photo => photo.uploadedBy === guestName) // Filter to show only the current user's photos
                                        .map(photo => (
                                            <div key={photo.id}
                                                 className="bg-wedding-green-light/10 p-2 rounded aspect-auto">
                                                <img
                                                    src={`${API_URL}/uploads/${photo.filename}`}
                                                    alt={`Photo by ${photo.uploadedBy}`}
                                                    className="w-full h-[200px] object-contain rounded"
                                                    onClick={() => {
                                                        setActiveChallenge(challenge.id);
                                                        setSelectedImage(`${API_URL}/uploads/${photo.filename}`);
                                                    }}
                                                />
                                                <p className="text-sm mt-1 text-wedding-purple">
                                                    By: {photo.uploadedBy}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
    const renderPhotoGallery = () => {
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
                        {isAdmin ? 'All Captured Moments' : 'Your Captured Moments'}
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
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                        {photosToDisplay.map((photo) => {
                            const imageUrl = `${API_URL}/uploads/${photo.filename}`;

                            return (
                                <motion.div
                                    key={photo.id}
                                    className="group relative bg-wedding-accent-light rounded-lg sm:rounded-xl overflow-hidden shadow-md cursor-pointer"
                                    whileHover={{y: -2}}
                                    transition={{duration: 0.2}}
                                >
                                    <div
                                        className="relative aspect-square"
                                        onClick={() => setSelectedImage(imageUrl)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Photo by ${photo.uploadedBy || 'Unknown Guest'}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => {
                                                setImageErrors(prev => ({
                                                    ...prev,
                                                    [photo.id]: true
                                                }));
                                            }}
                                            loading="lazy"
                                        />
                                        {/* Gradient overlay */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                                        {/* Photo info - Always visible on mobile, hover on desktop */}
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
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {selectedImage && (
                    <ImageModal
                        image={selectedImage}
                        onClose={() => {
                            setSelectedImage(null);
                            setActiveChallenge(null);
                        }}
                    />
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
                    <ImageModal
                        image={selectedImage}
                        onClose={() => {
                            setSelectedImage(null);
                            setActiveChallenge(null);
                        }}
                    />
                )}
            </div>
        </AnimatePresence>

    );
};

export default App;