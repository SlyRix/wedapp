import React, { useState, useEffect } from 'react';
import { Upload, X, Camera, CheckCircle, Lock, Video } from 'lucide-react';

const PhotoUploader = ({
                           onFileSelect,
                           onUpload,
                           maxPhotos = 30,
                           loading = false,
                           deviceInfo = '',
                           setNotification,
                           challengeMode = false,
                           challengeId = null,
                           isCompleted = false,
                           isPrivate = false,
                           guestName = '',
                           challengePhotos = [],
                           uploadProgress = 0
                       }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [currentUploads, setCurrentUploads] = useState(0);

    // Calculate how many photos the current user has already uploaded for this challenge
    const remainingUploads = 3 - currentUploads;


    useEffect(() => {
        const checkMobile = () => {
            return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                deviceInfo.includes('Mobile') ||
                deviceInfo.includes('iPhone') ||
                deviceInfo.includes('Android');
        };
        setIsMobile(checkMobile());
    }, [deviceInfo]);

    useEffect(() => {
        if (!loading && uploadProgress === 100) {
            clearUploadStates();
        }
    }, [loading, uploadProgress]);

    useEffect(() => {
        if (challengeMode && challengePhotos) {
            const uploadsCount = challengePhotos.filter(
                photo => photo.uploadedBy === guestName
            ).length;
            setCurrentUploads(uploadsCount);
        }
    }, [challengeMode, challengePhotos, guestName]);
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderProgressBar = (fileName) => {
        const progress = challengeMode ? uploadProgress : (uploadProgress[fileName] || 0);
        return (
            <div className="w-full bg-wedding-green-light rounded-full h-2">
                <div
                    className="bg-wedding-purple h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        );
    };
    const validateFile = (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (challengeMode && currentUploads >= 3) {
            return {
                valid: false,
                reason: 'You have reached the maximum limit of 3 photos for this challenge'
            };
        }
        if (!isImage && !isVideo) {
            return {
                valid: false,
                reason: 'File must be an image or video'
            };
        }
        if (challengeMode && !isImage) {
            return {
                valid: false,
                reason: 'Only images are allowed for challenges'
            };
        }
        // Size validation
        if (isImage && file.size > 10 * 1024 * 1024) {
            return {
                valid: false,
                reason: `Image size must be under 10MB (current size: ${formatFileSize(file.size)})`
            };
        }

        if (isVideo && file.size > 50 * 1024 * 1024) {
            return {
                valid: false,
                reason: `Video size must be under 50MB (current size: ${formatFileSize(file.size)})`
            };
        }

        if (isVideo && !['video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(file.type)) {
            return {
                valid: false,
                reason: 'Only MP4, MOV, and AVI video formats are supported'
            };
        }

        return { valid: true };
    };

    const renderFilePreview = (file) => {
        const isVideo = file.type.startsWith('video/');

        return (
            <div key={file.name} className="flex items-center justify-between bg-wedding-green-light/30 p-2 rounded">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {isVideo ? <Video className="w-4 h-4 text-wedding-purple" /> :
                            <Camera className="w-4 h-4 text-wedding-purple" />}
                        <p className="text-sm truncate text-wedding-purple-dark">{file.name}</p>
                    </div>
                    <p className="text-xs text-wedding-purple-light">{formatFileSize(file.size)}</p>
                    <div className="w-full bg-wedding-green-light rounded-full h-2">
                        <div
                            className="bg-wedding-purple h-2 rounded-full transition-all duration-300"
                            style={{ width: `${challengeMode ? uploadProgress : 0}%` }}
                        />
                    </div>
                </div>
                <button
                    onClick={() => removeFile(file.name)}
                    className="ml-2 text-wedding-purple hover:text-wedding-purple-dark"
                    disabled={loading}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    };

    const clearUploadStates = () => {
        setSelectedFiles([]);
        if (onFileSelect) {
            onFileSelect([]);
        }
    };
    const handleFileSelection = async (e) => {
        try {
            const files = Array.from(e.target.files);

            if (!files || files.length === 0) return;

            if (challengeMode && files.length > 1) {
                setNotification({
                    message: 'Please select only one file for the challenge',
                    type: 'error'
                });
                return;
            }

            if (!challengeMode && files.length > maxPhotos) {
                setNotification({
                    message: `You can only upload up to ${maxPhotos} files at once.`,
                    type: 'error'
                });
                return;
            }

            const validationResults = files.map(file => ({
                file,
                ...validateFile(file)
            }));

            const invalidFiles = validationResults.filter(result => !result.valid);
            if (invalidFiles.length > 0) {
                const messages = invalidFiles.map(f => f.reason);
                setNotification({
                    message: messages.join('\n'),
                    type: 'error'
                });
                return;
            }

            const validFiles = validationResults.filter(result => result.valid).map(result => result.file);

            if (validFiles.length === 0) return;

            setSelectedFiles(validFiles);

            // Handle mobile uploads immediately
            if (isMobile) {
                try {
                    if (challengeMode && challengeId) {
                        await onUpload(validFiles[0], parseInt(challengeId));
                    } else {
                        await onUpload(validFiles);
                    }
                    // Clear states after successful upload
                    clearUploadStates();
                } catch (error) {
                    console.error('Upload error:', error);
                    setNotification({
                        message: 'Error uploading files. Please try again.',
                        type: 'error'
                    });
                }
            } else {
                // Desktop: Update parent's selected files
                if (onFileSelect) {
                    onFileSelect(validFiles);
                }
            }
        } catch (error) {
            console.error('File selection error:', error);
            setNotification({
                message: 'Error processing selected files. Please try again.',
                type: 'error'
            });
        }
    };

    const removeFile = (fileName) => {
        const updatedFiles = selectedFiles.filter(file => file.name !== fileName);
        setSelectedFiles(updatedFiles);
        if (onFileSelect) {
            onFileSelect(updatedFiles);
        }
    };

    const handleUploadClick = async () => {
        try {
            if (challengeMode) {
                if (!selectedFiles[0] || !challengeId) {
                    throw new Error('Missing required upload data');
                }
                await onUpload(selectedFiles[0], parseInt(challengeId));
            } else {
                await onUpload(selectedFiles);
            }
            // Clear states after successful upload
            clearUploadStates();
        } catch (error) {
            console.error('Upload click error:', error);
            setNotification({
                message: 'Error during upload. Please try again.',
                type: 'error'
            });
        }
    };



    const renderUploadLabel = () => {
        if (challengeMode) {
            if (currentUploads >= 3) {
                return (
                    <>
                        <div className="mb-2 text-wedding-purple-light">
                            <Lock size={32} />
                        </div>
                        <p className="text-wedding-purple-dark font-medium">
                            Upload Limit Reached
                        </p>
                        <p className="text-sm text-wedding-purple mt-1">
                            You have uploaded the maximum of 3 photos
                        </p>
                    </>
                );
            }
            if (isPrivate) {
                return (
                    <>
                        <div className="mb-2 text-wedding-purple">
                            <Lock size={32}/>
                        </div>
                        <p className="text-wedding-purple-dark font-medium">
                            Private Challenge
                        </p>
                        <p className="text-sm text-wedding-purple mt-1">
                            {isMobile ? 'Tap to add your private photo' : 'Click to add your private photo'}
                        </p>
                        <p className="text-xs text-wedding-purple-light mt-1">
                            Only you can see your submissions
                        </p>
                        <p className="text-xs text-wedding-purple-light">
                            {remainingUploads} {remainingUploads === 1 ? 'upload' : 'uploads'} remaining
                        </p>
                    </>
                );
            }

            if (isCompleted) {
                return (
                    <>
                        <div className="mb-2 text-wedding-green-dark">
                            <CheckCircle size={32} />
                        </div>
                        <p className="text-wedding-purple-dark font-medium">
                            Challenge Completed!
                        </p>
                        <p className="text-sm text-wedding-purple mt-1">
                            {isMobile ? 'Tap to upload another photo' : 'Click to upload another photo'}
                        </p>
                    </>
                );
            }

            return (
                <>
                    <div className="mb-2 text-wedding-purple">
                        <Upload size={32} />
                    </div>
                    <p className="text-wedding-purple-dark font-medium">
                        Select Photo for this Challenge
                    </p>
                    <p className="text-sm text-wedding-purple mt-1">
                        {isMobile ? 'Tap to select an image' : 'Click to select an image'}
                    </p>
                </>
            );
        }

        return (
            <>
                <Upload className="w-12 h-12 text-wedding-purple-light mb-2" />
                <p className="text-wedding-purple-dark">
                    {isMobile ? 'Tap to select photos and videos' : `Click to select up to ${maxPhotos} photos and videos`}
                    <br />
                    <span className="text-sm text-wedding-purple-light italic">
                        (Max 10MB per image)
                    </span>
                </p>
            </>
        );
    };

    const getUploadContainerClasses = () => {
        if (challengeMode) {
            if (isPrivate) {
                return "cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg transition-colors bg-wedding-purple-light/10 hover:bg-wedding-purple-light/20";
            }
            return `cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                isCompleted
                    ? 'bg-wedding-green-light/20 hover:bg-wedding-green-light/40'
                    : 'bg-wedding-accent-light hover:bg-wedding-green-light/20'
            }`;
        }
        return "cursor-pointer flex flex-col items-center justify-center";
    };

    return (
        <div className="space-y-4">
            <div className={challengeMode
                ? `border-2 border-dashed ${isPrivate ? 'border-wedding-purple' : 'border-wedding-green'} rounded-lg p-4 text-center`
                : "border-2 border-dashed border-wedding-purple-light/50 rounded-xl p-8 text-center bg-wedding-accent-light/50"
            }>
                <input
                    type="file"
                    accept={challengeMode ? "image/*" : "image/*,video/mp4,video/quicktime,video/x-msvideo"}
                    multiple={!challengeMode}
                    onChange={handleFileSelection}
                    className="hidden"
                    id={challengeMode ? `challenge-upload-${challengeId}` : "file-upload"}
                    disabled={loading || (challengeMode && currentUploads >= 3)}
                />
                <label
                    htmlFor={challengeMode ? `challenge-upload-${challengeId}` : "file-upload"}
                    className={getUploadContainerClasses()}
                >
                    {renderUploadLabel()}
                </label>
            </div>

            {!isMobile && selectedFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {selectedFiles.map(file => renderFilePreview(file))}
                    </div>

                    <button
                        onClick={handleUploadClick}
                        disabled={loading || selectedFiles.length === 0}
                        className="w-full bg-wedding-purple text-white p-2 rounded hover:bg-wedding-purple-dark transition duration-300 disabled:bg-wedding-purple-light/50"
                    >
                        {loading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;