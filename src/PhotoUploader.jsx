import React, { useState, useEffect } from 'react';
import { Upload, X, Camera, CheckCircle, Lock } from 'lucide-react';

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
                           challengePhotos = []
                       }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
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

    const handleFileSelection = async (e) => {
        const files = Array.from(e.target.files);

        if (challengeMode && files.length > 1) {
            setNotification({
                message: 'Please select only one photo for the challenge',
                type: 'error'
            });
            return;
        }

        if (!challengeMode && files.length > maxPhotos) {
            setNotification({
                message: `You can only upload up to ${maxPhotos} photos at once.`,
                type: 'error'
            });
            return;
        }

        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isUnder10MB = file.size <= 10 * 1024 * 1024;
            return isImage && isUnder10MB;
        });

        if (validFiles.length !== files.length) {
            setNotification({
                message: 'Some files were skipped. Only images under 10MB are allowed.',
                type: 'error'
            });
        }

        if (validFiles.length === 0) {
            return;
        }

        const initialProgress = {};
        validFiles.forEach(file => {
            initialProgress[file.name] = 0;
        });

        setUploadProgress(initialProgress);
        setSelectedFiles(validFiles);

        // If on mobile, trigger upload immediately
        if (isMobile && validFiles.length > 0) {
            try {
                if (challengeMode) {
                    await onUpload(validFiles[0], challengeId);
                } else {
                    await onUpload(validFiles);
                }
                // Clear states after successful upload
                setSelectedFiles([]);
                setUploadProgress({});
            } catch (error) {
                console.error('Upload error:', error);
                setNotification({
                    message: 'Error uploading photos. Please try again.',
                    type: 'error'
                });
            }
        } else {
            // For desktop, update the parent's selected files
            if (onFileSelect) {
                onFileSelect(validFiles);
            }
        }
    };

    const removeFile = (fileName) => {
        setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
        setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileName];
            return updated;
        });
        if (onFileSelect) {
            onFileSelect(selectedFiles.filter(file => file.name !== fileName));
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
                    accept="image/*"
                    multiple={!challengeMode}
                    onChange={handleFileSelection}
                    className="hidden"
                    id={challengeMode ? `challenge-upload-${challengeId}` : "file-upload"}
                    disabled={loading}
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
                    <div className="max-h-60 overflow-y-auto">
                        {selectedFiles.map((file) => (
                            <div key={file.name} className="flex items-center justify-between bg-wedding-green-light/30 p-2 rounded">
                                <div className="flex-1">
                                    <p className="text-sm truncate text-wedding-purple-dark">{file.name}</p>
                                    <div className="w-full bg-wedding-green-light rounded-full h-2">
                                        <div
                                            className="bg-wedding-purple h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress[file.name] || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="ml-2 text-wedding-purple hover:text-wedding-purple-dark"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => challengeMode ? onUpload(selectedFiles[0], challengeId) : onUpload(selectedFiles)}
                        disabled={loading}
                        className="w-full bg-wedding-purple text-white p-2 rounded hover:bg-wedding-purple-dark transition duration-300 disabled:bg-wedding-purple-light/50"
                    >
                        {loading ? 'Uploading...' : `Upload ${challengeMode ? 'Photo' : `${selectedFiles.length} Photos`}`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;