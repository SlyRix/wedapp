import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Enhanced Delete Confirmation Modal with loading states and error handling
const DeleteConfirmModal = ({ onClose, onConfirm, isLoading, error }) => {
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
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-wedding-purple-dark">
                        Confirm Delete
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <p className="text-wedding-purple mb-6">
                    Are you sure you want to delete this photo? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg border border-wedding-purple-light/30 text-wedding-purple hover:bg-wedding-purple-light/10 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Delete Button Component
const DeleteButton = ({ onDelete, className = '' }) => {
    return (
        <button
            onClick={onDelete}
            className={`p-2 rounded-full bg-black/50 hover:bg-black/70 shadow-lg transition-all duration-300 ${className}`}
        >
            <Trash2 className="w-4 h-4 text-white" />
        </button>
    );
};

// Hook to manage delete functionality
const useDeletePhoto = (API_URL, guestName, onPhotoDeleted) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [photoToDelete, setPhotoToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = (e, photo) => {
        e.stopPropagation(); // Prevent opening the photo modal
        setPhotoToDelete(photo);
        setShowDeleteConfirm(true);
        setError(null);
    };

    const handleClose = () => {
        setShowDeleteConfirm(false);
        setPhotoToDelete(null);
        setError(null);
    };

    const deletePhoto = async () => {
        if (!photoToDelete) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/photos/${photoToDelete.id}?userName=${encodeURIComponent(guestName)}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Failed to delete photo');
            }

            // Call the success callback
            if (onPhotoDeleted) {
                await onPhotoDeleted();
            }

            handleClose();
        } catch (error) {
            console.error('Error deleting photo:', error);
            setError(
                error.message || 'An error occurred while deleting the photo. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        photoToDelete,
        showDeleteConfirm,
        handleDeleteClick,
        handleClose,
        deletePhoto
    };
};

// Usage example in App.jsx:
const ExampleUsage = () => {
    const {
        isLoading,
        error,
        showDeleteConfirm,
        handleDeleteClick,
        handleClose,
        deletePhoto
    } = useDeletePhoto(API_URL, guestName, fetchPhotos);

    return (
        <>
            {/* In your photo grid/list */}
            <div className="absolute top-2 right-2 z-10">
                <DeleteButton
                    onDelete={(e) => handleDeleteClick(e, photo)}
                />
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <DeleteConfirmModal
                        onClose={handleClose}
                        onConfirm={deletePhoto}
                        isLoading={isLoading}
                        error={error}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export { DeleteButton, DeleteConfirmModal, useDeletePhoto };