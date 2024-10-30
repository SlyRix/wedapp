import React, {useState, useEffect} from 'react';
import {
    CheckCircle,
    Upload,
    X,
    AlertCircle,
    Settings,
    LogIn,
    ChevronDown,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

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
    const [guestName, setGuestName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        if (!image) return null;

        // Determine if we're viewing challenge photos or regular gallery
        const isChallengeView = selectedTab === 'challenges';
        const currentChallengePhotos = isChallengeView && activeChallenge ?
            challengePhotos[activeChallenge] || [] : [];
        const photosToUse = isChallengeView ? currentChallengePhotos : (isAdmin ? allPhotos : photos);

        const currentIndex = photosToUse.findIndex(photo =>
            `${API_URL}/uploads/${photo.filename}` === image
        );

        const handlePrev = (e) => {
            e.stopPropagation();
            if (currentIndex > 0) {
                setSelectedImage(`${API_URL}/uploads/${photosToUse[currentIndex - 1].filename}`);
            }
        };

        const handleNext = (e) => {
            e.stopPropagation();
            if (currentIndex < photosToUse.length - 1) {
                setSelectedImage(`${API_URL}/uploads/${photosToUse[currentIndex + 1].filename}`);
            }
        };

        return (
            <div
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div className="max-w-[90vw] max-h-[90vh] relative">
                    <img
                        src={image}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        <X className="w-8 h-8"/>
                    </button>

                    {currentIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
                        >
                            <ChevronLeft className="w-8 h-8"/>
                        </button>
                    )}

                    {currentIndex < photosToUse.length - 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
                        >
                            <ChevronRight className="w-8 h-8"/>
                        </button>
                    )}
                </div>
            </div>
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
            setIsLoggedIn(true);
            fetchPhotos();
            challenges.forEach(challenge => {
                fetchChallengePhotos(challenge.id);
            });
        }
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


    const Toast = ({message, type = 'success', onClose}) => {
        const bgColor = type === 'success' ? 'bg-wedding-green-light' : 'bg-red-100';
        const textColor = type === 'success' ? 'text-wedding-green-dark' : 'text-red-800';
        const Icon = type === 'success' ? CheckCircle : AlertCircle;

        // Auto-dismiss after 3 seconds
        React.useEffect(() => {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div
                className={`fixed top-4 right-4 z-50 ${bgColor} border-l-4 border-${type === 'success' ? 'wedding-green' : 'red-500'} p-4 rounded shadow-lg max-w-md transform transition-transform duration-300 ease-in-out`}>
                <div className="flex items-start">
                    <div className={`flex-shrink-0 ${textColor}`}>
                        <Icon className="h-5 w-5"/>
                    </div>
                    <div className="ml-3">
                        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onClose}
                            className={`inline-flex ${textColor} hover:opacity-75 focus:outline-none`}
                        >
                            <X className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderHeader = () => (
        <header className="relative mb-8">
            <div className="text-center">
                <h1 className="text-4xl font-serif text-wedding-purple-dark mb-2 relative inline-block">
                    Engagement Photo Gallery
                    <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-wedding-purple"></div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-wedding-purple"></div>
                    <div
                        className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-wedding-purple"></div>
                    <div
                        className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-wedding-purple"></div>
                </h1>
                <p className="text-wedding-purple mt-6">
                    {isAdmin ? 'Admin View - All Photos' : `Welcome, ${guestName}!`}
                </p>
            </div>
            {!isAdmin && (
                <button
                    onClick={() => setShowAdminModal(true)}
                    className="fixed bottom-4 right-4 p-2 text-gray-400 hover:text-wedding-purple transition-colors duration-300 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md"
                    title="Admin Access"
                >
                    <Settings className="w-5 h-5"/>
                </button>
            )}
            {isAdmin && (
                <div
                    className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm px-2 py-1">
                    <div className="text-xs text-wedding-green-dark">
                        Admin
                    </div>
                    <button
                        onClick={() => {
                            setIsAdmin(false);
                            setAllPhotos([]);
                            setPhotos([]);
                            fetchPhotos(false);
                        }}
                        className="p-1 text-gray-400 hover:text-wedding-purple"
                    >
                        <X className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </header>
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-serif mb-4">Upload Photos</h2>
            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                        <Upload className="w-12 h-12 text-gray-400 mb-2"/>
                        <p className="text-gray-600">
                            Click to select up to {MAX_PHOTOS} photos
                            <br/>
                            <span className="text-sm text-gray-400">
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
                                    <CheckCircle className="text-wedding-green-dark" size={24} />
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
                                                <CheckCircle size={32} />
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
                                                <Upload size={32} />
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
                                    <div className="flex items-center justify-between bg-wedding-green-light/30 p-2 rounded">
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
                                            <X className="w-4 h-4" />
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
                                                <div key={photo.id} className="bg-wedding-green-light/10 p-2 rounded aspect-auto">
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
                                            <div key={photo.id} className="bg-wedding-green-light/10 p-2 rounded aspect-auto">
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
        const getImageUrl = (filename) => {
            return `${API_URL}/uploads/${filename}`;
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
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-serif mb-4">
                    {isAdmin ? 'All Photos' : 'Your Photos'}
                </h2>
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading photos...</p>
                    </div>
                ) : photosToDisplay.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No photos found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photosToDisplay.map((photo) => {
                            const imageUrl = getImageUrl(photo.filename);

                            return (
                                <div key={photo.id} className="bg-gray-100 p-4 rounded">
                                    <div className="relative">
                                        <img
                                            src={imageUrl}
                                            alt={`Photo by ${photo.uploadedBy || 'Unknown Guest'}`}
                                            className="w-full h-48 object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setSelectedImage(imageUrl)}
                                            onError={(e) => {
                                                console.error('Image load error:', imageUrl);
                                                setImageErrors(prev => ({
                                                    ...prev,
                                                    [photo.id]: true
                                                }));
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            By: {photo.uploadedBy || 'Unknown Guest'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {photo.uploadType || 'General'}
                                            {photo.challengeInfo && ` - ${photo.challengeInfo}`}
                                        </p>
                                        {isAdmin && photo.deviceInfo && (
                                            <p className="text-xs text-gray-500">
                                                Uploaded from: {photo.deviceInfo}
                                            </p>
                                        )}
                                        <a
                                            href={imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline text-sm block"
                                        >
                                            View full size
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    if (!isLoggedIn) {
        return (
            <div
                className="min-h-screen bg-wedding-accent-light flex items-center justify-center bg-[url('/paisley-pattern.png')] bg-opacity-5">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-2 border-wedding-purple">
                    <h1 className="text-3xl font-serif text-center mb-6 text-wedding-purple-dark">
                        Welcome to Rushel and Sivani's Engagement Celebration
                    </h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full p-2 border-2 border-wedding-green focus:ring-wedding-purple focus:border-wedding-purple rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-wedding-purple text-white p-2 rounded hover:bg-wedding-purple-dark transition duration-300 shadow-lg"
                        >
                            Join the Celebration
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wedding-accent-light p-4">
            <div className="max-w-4xl mx-auto">
                {renderHeader()}

                {/* Show tabs and upload sections only when not in admin mode */}
                {!isAdmin && (
                    <>
                        <div className="mb-6 flex space-x-4 justify-center">
                            <button
                                onClick={() => setSelectedTab('general')}
                                className={`px-6 py-2 rounded-full shadow-md transition duration-300 ${
                                    selectedTab === 'general'
                                        ? 'bg-wedding-purple text-white'
                                        : 'bg-wedding-green-light text-wedding-purple hover:bg-wedding-green hover:text-white'
                                }`}
                            >
                                General Upload
                            </button>
                            <button
                                onClick={() => setSelectedTab('challenges')}
                                className={`px-6 py-2 rounded-full shadow-md transition duration-300 ${
                                    selectedTab === 'challenges'
                                        ? 'bg-wedding-purple text-white'
                                        : 'bg-wedding-green-light text-wedding-purple hover:bg-wedding-green hover:text-white'
                                }`}
                            >
                                Photo Challenges
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

                {/* Show gallery for admin regardless of tab */}
                {isAdmin && renderPhotoGallery()}
            </div>

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
    );
};


export default App;