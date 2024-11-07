import React, { useState, useEffect } from 'react';
import { Upload, X, Camera, CheckCircle, Lock,  Video } from 'lucide-react';

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

    useEffect(() => {
        const checkMobile = () => {
            return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                deviceInfo.includes('Mobile') ||
                deviceInfo.includes('iPhone') ||
                deviceInfo.includes('Android');
        };
        setIsMobile(checkMobile());
    }, [deviceInfo]);
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

        if (!isImage && !isVideo) {
            return {
                valid: false,
                reason: 'File must be an image or video'
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

        // Validate video format
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

            // Validate each file
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

            // Handle mobile uploads
            if (isMobile && validFiles.length > 0) {
                try {
                    if (challengeMode && challengeId) {
                        if (!validFiles[0]) {
                            throw new Error('No valid file selected');
                        }
                        await onUpload(validFiles[0], parseInt(challengeId));
                    } else {
                        await onUpload(validFiles);
                    }
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
    const clearUploadStates = () => {
        setSelectedFiles([]);
    };
    const removeFile = (fileName) => {
        setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
        if (onFileSelect) {
            onFileSelect(selectedFiles.filter(file => file.name !== fileName));
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
            if (isPrivate) {
                return (
                    <>
                        <div className="mb-2 text-wedding-purple">
                            <Lock size={32} />
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
                    {isMobile ? 'Tap to select photos' : `Click to select up to ${maxPhotos} photos`}
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
                    accept="image/*,video/mp4,video/quicktime,video/x-msvideo"
                    multiple={!challengeMode}
                    onChange={handleFileSelection}
                    className="hidden"
                    id={challengeMode ? `challenge-upload-${challengeId}` : "file-upload"}
                    disabled={loading}
                />
                <label
                    htmlFor={challengeMode ? `challenge-upload-${challengeId}` : "file-upload"}
                    className="cursor-pointer flex flex-col items-center justify-center"
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
                        onClick={() => challengeMode ? onUpload(selectedFiles[0], challengeId) : onUpload(selectedFiles)}
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