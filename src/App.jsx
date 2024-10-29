import React, {useState, useEffect} from 'react';
import {CheckCircle, Upload, X} from 'lucide-react';

const GOOGLE_CLIENT_ID = '149658260490-pf8nbtpm23macvlorrmungbld2kia9nq.apps.googleusercontent.com';
const ADMIN_PASSWORD = 'happy';
const API_KEY = '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';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.appdata';
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
        title: 'Best Outfit of the Day',
        description: 'Capture the most stylish guest!'
    },
    {
        id: 2,
        title: 'Catch the Groom',
        description: 'Take a fun picture with the groom'
    },
    {
        id: 3,
        title: 'Dance Floor Moments',
        description: 'Capture the best dance moves'
    },
    {
        id: 4,
        title: 'Sweet Moments',
        description: 'Share touching moments from the celebration'
    },
];

function App() {
    const [guestName, setGuestName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedTab, setSelectedTab] = useState('general');
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
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

    useEffect(() => {
        // Load Google API
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = gapiLoaded;
        document.body.appendChild(script);

        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = gisLoaded;
        document.body.appendChild(gisScript);

        // Load saved auth state
        const savedToken = localStorage.getItem('googleAuthToken');
        if (savedToken) {
            try {
                const tokenData = JSON.parse(savedToken);
                // Check if token is expired
                if (tokenData.expiry_date > Date.now()) {
                    // Token is still valid
                    gapi.client.setToken(tokenData);
                } else {
                    // Token is expired, remove it
                    localStorage.removeItem('googleAuthToken');
                }
            } catch (error) {
                console.error('Error parsing saved token:', error);
                localStorage.removeItem('googleAuthToken');
            }
        }

        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const browser = getBrowserInfo(userAgent);
        const device = getDeviceInfo(userAgent, platform);
        setDeviceInfo(`${device} - ${browser}`);

        // Rest of your useEffect code...
    }, [guestName]);


    useEffect(() => {
        if (isLoggedIn && gapiInited && gisInited) {
            fetchPhotos();
        }
    }, [isLoggedIn, gapiInited, gisInited]); // Will fetch photos when user logs in and APIs are ready


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

    function gapiLoaded() {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setGapiInited(true);
            } catch (err) {
                console.error('Error initializing GAPI client:', err);
            }
        });
    }

    function gisLoaded() {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse.error !== undefined) {
                    throw tokenResponse;
                }
                // Save the token
                const tokenData = {
                    ...tokenResponse,
                    expiry_date: Date.now() + (tokenResponse.expires_in * 1000)
                };
                localStorage.setItem('googleAuthToken', JSON.stringify(tokenData));

                // Continue with the regular callback logic
                if (typeof client.callback === 'function') {
                    client.callback(tokenResponse);
                }
            },
            prompt: 'consent',
            ux_mode: 'popup',
            include_granted_scopes: true,
            enable_serial_consent: true,
            error_callback: (err) => {
                console.error('Token client error:', err);
                localStorage.removeItem('googleAuthToken');
            }
        });
        setTokenClient(client);
        setGisInited(true);
    }

    // Add a function to handle token refresh
    const refreshToken = async () => {
        if (tokenClient) {
            tokenClient.callback = (response) => {
                if (response.error !== undefined) {
                    console.error('Error refreshing token:', response);
                    localStorage.removeItem('googleAuthToken');
                    return;
                }
                const tokenData = {
                    ...response,
                    expiry_date: Date.now() + (response.expires_in * 1000)
                };
                localStorage.setItem('googleAuthToken', JSON.stringify(tokenData));
                gapi.client.setToken(tokenData);
            };
            tokenClient.requestAccessToken({prompt: ''});
        }
    };
    const checkAndRefreshToken = async () => {
        const savedToken = localStorage.getItem('googleAuthToken');
        if (savedToken) {
            const tokenData = JSON.parse(savedToken);
            // Refresh token if it expires in less than 5 minutes
            if (tokenData.expiry_date < Date.now() + (5 * 60 * 1000)) {
                await refreshToken();
            }
        }
    };

    async function initializeGapiClient() {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        setGapiInited(true);
    }


    const createWeddingFolder = async () => {
        try {
            const response = await gapi.client.drive.files.list({
                q: "name='Wedding Photos' and mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)',
            });

            if (response.result.files.length > 0) {
                return response.result.files[0].id;
            }

            const fileMetadata = {
                name: 'Wedding Photos',
                mimeType: 'application/vnd.google-apps.folder',
            };

            const folder = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id',
            });

            return folder.result.id;
        } catch (err) {
            console.error('Error creating folder:', err);
            throw err;
        }
    };

    const handleFileSelection = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > MAX_PHOTOS) {
            alert(`You can only upload up to ${MAX_PHOTOS} photos at once.`);
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
            return isImage && isUnder10MB;
        });

        if (validFiles.length !== files.length) {
            alert('Some files were skipped. Only images under 10MB are allowed.');
        }

        setSelectedFiles(validFiles);
        // Initialize progress for each file
        const initialProgress = {};
        validFiles.forEach(file => {
            initialProgress[file.name] = 0;
        });
        setUploadProgress(initialProgress);
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
        try {
            await checkAndRefreshToken();
            if (!gapi.client.getToken()) {
                return new Promise((resolve, reject) => {
                    try {
                        tokenClient.callback = async (resp) => {
                            if (resp.error !== undefined) {
                                reject(resp);
                                return;
                            }
                            try {
                                await uploadMultipleFiles();
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        };
                        tokenClient.requestAccessToken();
                    } catch (err) {
                        reject(err);
                    }
                });
            } else {
                await uploadMultipleFiles();
            }
        } catch (err) {
            console.error('Error uploading files:', err);
            alert('Error uploading photos. Please try again.');
        }
        setLoading(false);
    };

    const uploadMultipleFiles = async () => {
        const folderId = await createWeddingFolder();
        const timestamp = new Date().toISOString();

        for (const file of selectedFiles) {
            try {
                const metadata = {
                    name: `${guestName}_General_${timestamp}_${file.name}`,
                    parents: [folderId],
                    description: JSON.stringify({
                        uploadedBy: guestName,
                        uploadDate: timestamp,
                        deviceInfo: deviceInfo,
                        uploadType: 'General Upload'
                    }),
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
                form.append('file', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
                xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.client.getToken().access_token);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: progress
                        }));
                    }
                };

                await new Promise((resolve, reject) => {
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            resolve();
                        } else {
                            reject(new Error(`Upload failed for ${file.name}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error(`Network error for ${file.name}`));
                    xhr.send(form);
                });

            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
            }
        }

        alert('All photos uploaded successfully!');
        setSelectedFiles([]);
        setUploadProgress({});
        fetchPhotos();
    };

    const handleChallengeUpload = async (e, challengeId) => {
        if (!e.target.files[0]) return;

        setLoading(true);
        setActiveChallenge(challengeId);
        const file = e.target.files[0];

        try {
            if (!gapi.client.getToken()) {
                return new Promise((resolve, reject) => {
                    try {
                        tokenClient.callback = async (resp) => {
                            if (resp.error !== undefined) {
                                reject(resp);
                                return;
                            }
                            try {
                                await uploadChallengeFile(file, challengeId);
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        };
                        tokenClient.requestAccessToken();
                    } catch (err) {
                        reject(err);
                    }
                });
            } else {
                await uploadChallengeFile(file, challengeId);
            }
        } catch (err) {
            console.error('Error uploading challenge photo:', err);
            alert('Error uploading photo. Please try again.');
        }
        setLoading(false);
        setActiveChallenge(null);
        setUploadProgress({...uploadProgress, challenge: 0});
    };

    const uploadChallengeFile = async (file, challengeId) => {
        if (!file) return;

        setLoading(true);
        setActiveChallenge(challengeId);

        try {
            if (!gapi.client.getToken()) {
                tokenClient.callback = async (resp) => {
                    if (resp.error !== undefined) {
                        throw resp;
                    }
                    await performChallengeUpload(file, challengeId);
                };
                tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
                await performChallengeUpload(file, challengeId);
            }
        } catch (err) {
            console.error('Error uploading challenge photo:', err);
            alert('Error uploading photo. Please try again.');
        }

        setLoading(false);
        setActiveChallenge(null);

        // Clear the selected file after upload
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

// Add this new function to handle the actual upload:
    const performChallengeUpload = async (file, challengeId) => {
        const folderId = await createWeddingFolder();
        const challenge = challenges.find(c => c.id === challengeId);
        const timestamp = new Date().toISOString();

        const metadata = {
            name: `${guestName}_${challenge.title}_${timestamp}_${file.name}`,
            parents: [folderId],
            description: JSON.stringify({
                uploadedBy: guestName,
                uploadDate: timestamp,
                deviceInfo: deviceInfo,
                uploadType: 'Challenge',
                challengeTitle: challenge.title
            }),
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.client.getToken().access_token);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setChallengeUploadProgress(prev => ({
                    ...prev,
                    [challengeId]: progress
                }));
            }
        };

        await new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed for challenge photo`));
                }
            };
            xhr.onerror = () => reject(new Error(`Network error for challenge photo`));
            xhr.send(form);
        });

        const updatedChallenges = new Set(completedChallenges);
        updatedChallenges.add(challengeId);
        setCompletedChallenges(updatedChallenges);
        localStorage.setItem(`completedChallenges_${guestName}`, JSON.stringify([...updatedChallenges]));

        alert('Challenge photo uploaded successfully!');
        fetchPhotos();
    };
    const refreshImageUrls = () => {
        const newAccessToken = gapi.client.getToken().access_token;

        setAllPhotos(prevPhotos => prevPhotos.map(photo => ({
            ...photo,
            imageUrl: `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400-h400&access_token=${newAccessToken}`
        })));

        setPhotos(prevPhotos => prevPhotos.map(photo => ({
            ...photo,
            imageUrl: `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400-h400&access_token=${newAccessToken}`
        })));
    };
    useEffect(() => {
        if (isLoggedIn && (photos.length > 0 || allPhotos.length > 0)) {
            const refreshInterval = setInterval(refreshImageUrls, 1800000); // Refresh every 30 minutes
            return () => clearInterval(refreshInterval);
        }
    }, [isLoggedIn, photos.length, allPhotos.length]);


    const fetchPhotos = async () => {
        if (!gapi.client.getToken()) {
            console.log('No auth token available');
            return;
        }

        setLoading(true);
        try {
            const folderResponse = await gapi.client.drive.files.list({
                q: "name='Wedding Photos' and mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (folderResponse.result.files.length === 0) {
                console.log('No Wedding Photos folder found');
                setLoading(false);
                return;
            }

            const folderId = folderResponse.result.files[0].id;

            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
                fields: 'files(id, name, webViewLink, thumbnailLink, description)',
                orderBy: 'createdTime desc',
                pageSize: 100,
                supportsAllDrives: true
            });

            // Process the files and generate direct thumbnail URLs
            const processedFiles = response.result.files.map(file => {
                return {
                    ...file,
                    // Generate a direct thumbnail URL using the file ID
                    imageUrl: file.thumbnailLink // Use the thumbnailLink directly without access token
                };
            });

            console.log('Processed files:', processedFiles);

            setAllPhotos(processedFiles);
            const userFiles = processedFiles.filter(photo => photo.name.startsWith(guestName));
            setPhotos(userFiles);

        } catch (err) {
            console.error('Error in fetchPhotos:', err);
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
            alert('Please select an image under 10MB.');
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
            const savedChallenges = localStorage.getItem(`completedChallenges_${guestName}`);
            if (savedChallenges) {
                setCompletedChallenges(new Set(JSON.parse(savedChallenges)));
            }
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (adminPassword === ADMIN_PASSWORD) {
            setLoading(true);
            try {
                setIsAdmin(true);
                setShowAdminModal(false);

                if (!gapiInited || !gisInited) {
                    alert('Please wait for Google API to initialize');
                    return;
                }

                if (!gapi.client.getToken()) {
                    console.log('Requesting Google authentication...');
                    tokenClient.callback = async (resp) => {
                        if (resp.error !== undefined) {
                            console.error('Google auth error:', resp);
                            alert('Error authenticating with Google');
                            return;
                        }
                        console.log('Google auth successful, fetching photos...');
                        await fetchPhotos();
                    };
                    tokenClient.requestAccessToken({prompt: 'consent'});
                } else {
                    console.log('Already authenticated, fetching photos...');
                    await fetchPhotos();
                }
            } catch (err) {
                console.error('Admin login error:', err);
                alert('Error logging in as admin. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            alert('Incorrect password');
        }
    };

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
                        disabled={loading || !gapiInited || !gisInited}
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
    const renderPhotoGallery = () => {
        const renderImage = (photo) => {
            const handleImageError = (photoId) => {
                console.log('Image error for:', photoId);
                // Attempt to refresh the token and URL on error
                const newAccessToken = gapi.client.getToken().access_token;
                const updatedUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400-h400&access_token=${newAccessToken}`;

                // Update the photo's URL
                const updatePhotos = (prevPhotos) => prevPhotos.map(p =>
                    p.id === photoId ? {...p, imageUrl: updatedUrl} : p
                );

                setAllPhotos(updatePhotos);
                setPhotos(updatePhotos);

                // If still failing, mark as error
                setImageErrors(prev => ({
                    ...prev,
                    [photoId]: true
                }));
            };

            if (imageErrors[photo.id]) {
                return (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded mb-2">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">Image preview unavailable</p>
                            <a
                                href={photo.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm"
                            >
                                Open in Drive
                            </a>
                        </div>
                    </div>
                );
            }

            return (
                <div className="relative">
                    <img
                        src={photo.imageUrl}
                        alt={photo.name}
                        className="w-full h-48 object-cover rounded mb-2"
                        onError={() => handleImageError(photo.id)}
                        loading="lazy"
                    />
                    {loading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                            <p>Loading...</p>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-serif mb-4">
                    {isAdmin ? 'All Photos' : 'Your Photos'}
                </h2>
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Loading photos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(isAdmin ? allPhotos : photos).map((photo) => {
                            let metadata = {};
                            try {
                                metadata = JSON.parse(photo.description || '{}');
                            } catch (e) {
                                metadata = {};
                            }

                            return (
                                <div key={photo.id} className="bg-gray-100 p-4 rounded">
                                    {renderImage(photo)}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            By: {metadata.uploadedBy || photo.name.split('_')[0]}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {metadata.uploadType || photo.name.split('_')[1]}
                                        </p>
                                        {metadata.deviceInfo && (
                                            <p className="text-xs text-gray-500">
                                                Device: {metadata.deviceInfo}
                                            </p>
                                        )}
                                        <a
                                            href={photo.webViewLink}
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
            <div className="min-h-screen bg-pink-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h1 className="text-3xl font-serif text-center mb-6 text-gray-800">
                        Welcome to Our Engagement
                    </h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition"
                        >
                            Join the Celebration
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pink-50 p-4">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-serif text-gray-800 mb-2">Engagement Photo Gallery</h1>
                    <p className="text-gray-600">Welcome, {guestName}!</p>
                    {!isAdmin && (
                        <button
                            onClick={() => setShowAdminModal(true)}
                            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            Admin Access
                        </button>
                    )}
                </header>

                <div className="mb-6 flex space-x-4 justify-center">
                    <button
                        onClick={() => setSelectedTab('general')}
                        className={`px-4 py-2 rounded ${
                            selectedTab === 'general'
                                ? 'bg-pink-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                        General Upload
                    </button>
                    <button
                        onClick={() => setSelectedTab('challenges')}
                        className={`px-4 py-2 rounded ${
                            selectedTab === 'challenges'
                                ? 'bg-pink-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                        Photo Challenges
                    </button>
                </div>

                {selectedTab === 'general' && renderGeneralUpload()}

                {selectedTab === 'challenges' && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-2xl font-serif mb-4">Photo Challenges</h2>
                        <div className="space-y-6">
                            {challenges.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className={`border rounded-lg p-6 relative ${
                                        completedChallenges.has(challenge.id)
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    {completedChallenges.has(challenge.id) && (
                                        <div className="absolute top-4 right-4">
                                            <CheckCircle className="text-green-500" size={24}/>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                            {challenge.title}
                                        </h3>
                                        <p className="text-gray-600">
                                            {challenge.description}
                                        </p>
                                    </div>

                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleChallengeFileSelect(e, challenge.id)}
                                            className="hidden"
                                            id={`challenge-upload-${challenge.id}`}
                                            disabled={loading || !gapiInited || !gisInited}
                                        />
                                        <label
                                            htmlFor={`challenge-upload-${challenge.id}`}
                                            className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                                                completedChallenges.has(challenge.id)
                                                    ? 'bg-green-50 hover:bg-green-100'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        >
                                            {completedChallenges.has(challenge.id) ? (
                                                <>
                                                    <div className="mb-2 text-green-500">
                                                        <CheckCircle size={32}/>
                                                    </div>
                                                    <p className="text-green-600 font-medium">
                                                        Challenge Completed!
                                                    </p>
                                                    <p className="text-sm text-green-500 mt-1">
                                                        Click to upload another photo
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mb-2 text-gray-400">
                                                        <Upload size={32}/>
                                                    </div>
                                                    <p className="text-gray-600 font-medium">
                                                        Select Photo for this Challenge
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Click to select an image
                                                    </p>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    {selectedChallengeFiles[challenge.id] && (
                                        <div className="mt-4 space-y-4">
                                            <div
                                                className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                <div className="flex-1">
                                                    <p className="text-sm truncate">
                                                        {selectedChallengeFiles[challenge.id].name}
                                                    </p>
                                                    {challengeUploadProgress[challenge.id] > 0 && (
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                                                                style={{width: `${challengeUploadProgress[challenge.id]}%`}}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeChallengeFile(challenge.id)}
                                                    className="ml-2 text-gray-500 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => uploadChallengeFile(selectedChallengeFiles[challenge.id], challenge.id)}
                                                disabled={loading}
                                                className="w-full bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition disabled:bg-gray-300"
                                            >
                                                {loading && activeChallenge === challenge.id
                                                    ? 'Uploading...'
                                                    : 'Upload Photo'
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {renderPhotoGallery()}
            </div>

            {showAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-2xl font-serif mb-4">Admin Access</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter admin password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            />
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-pink-500 text-white p-2 rounded hover:bg-pink-600 transition"
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAdminModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;