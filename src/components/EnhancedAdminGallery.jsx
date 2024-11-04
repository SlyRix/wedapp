import React, { useState, useMemo,useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, User, Grid, List, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const ImageModal = ({ image, onClose, photos, onNavigate }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const minSwipeDistance = 50;
    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    const currentIndex = photos.findIndex(
        photo => `${API_URL}/uploads/${photo.filename}` === image
    );

    useEffect(() => {
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handlePrev = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex > 0 && !isAnimating) {
            setIsAnimating(true);
            onNavigate(`${API_URL}/uploads/${photos[currentIndex - 1].filename}`);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const handleNext = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex < photos.length - 1 && !isAnimating) {
            setIsAnimating(true);
            onNavigate(`${API_URL}/uploads/${photos[currentIndex + 1].filename}`);
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

        if (isLeftSwipe && currentIndex < photos.length - 1) {
            handleNext();
        }
        if (isRightSwipe && currentIndex > 0) {
            handlePrev();
        }
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-black/90 z-[9999] flex items-center justify-center"
            onClick={onClose}
            style={{ position: 'fixed', top: 0, left: 0 }}
        >
            <div
                className="relative w-full h-full flex items-center justify-center p-4"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <motion.img
                    key={image}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    src={image}
                    alt="Full size"
                    className="max-w-[90vw] max-h-[90vh] object-contain select-none"
                    onClick={e => e.stopPropagation()}
                    draggable={false}
                />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="absolute top-1/2 left-4 right-4 flex justify-between items-center pointer-events-none">
                    {currentIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:text-gray-300 transition-colors"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                    )}
                    {currentIndex < photos.length - 1 && (
                        <button
                            onClick={handleNext}
                            className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:text-gray-300 transition-colors"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    )}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {photos.length}
                </div>
            </div>
        </motion.div>,
        document.body
    );
};

const EnhancedAdminGallery = ({ photos }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [filters, setFilters] = useState({
        date: 'all',
        uploader: 'all',
        type: 'all',
        isOpen: false
    });

    const API_URL = 'https://engagement-photos-api.slyrix.com/api';
    const [sortBy, setSortBy] = useState('newest');

    const filterOptions = useMemo(() => {
        return {
            dates: [...new Set(photos.map(photo =>
                new Date(photo.uploadDate || photo.createdAt).toLocaleDateString()))],
            uploaders: [...new Set(photos.map(photo => photo.uploadedBy))],
            types: [...new Set(photos.map(photo =>
                photo.uploadType || (photo.challengeId ? 'Challenge' : 'General')))]
        };
    }, [photos]);

    const filteredPhotos = useMemo(() => {
        return photos
            .filter(photo => {
                const matchesSearch = photo.uploadedBy.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const matchesDate = filters.date === 'all' ||
                    new Date(photo.uploadDate || photo.createdAt).toLocaleDateString() === filters.date;
                const matchesUploader = filters.uploader === 'all' ||
                    photo.uploadedBy === filters.uploader;
                const matchesType = filters.type === 'all' ||
                    (photo.uploadType || (photo.challengeId ? 'Challenge' : 'General')) === filters.type;

                return matchesSearch && matchesDate && matchesUploader && matchesType;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') {
                    return new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt);
                } else if (sortBy === 'oldest') {
                    return new Date(a.uploadDate || a.createdAt) - new Date(b.uploadDate || b.createdAt);
                }
                return 0;
            });
    }, [photos, searchTerm, filters, sortBy]);

    const handleImageClick = (photo) => {
        setSelectedImage(`${API_URL}/uploads/${photo.filename}`);
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wedding-purple-light w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by guest name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-wedding-purple-light/30 focus:ring-2 focus:ring-wedding-purple focus:border-transparent"
                    />
                </div>

                <button
                    onClick={() => setFilters(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-wedding-purple text-white hover:bg-wedding-purple-dark transition-colors"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                </button>

                <div className="flex gap-2 p-1 bg-wedding-accent-light rounded-full">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-full transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-wedding-purple text-white'
                                : 'text-wedding-purple hover:bg-wedding-purple-light/20'
                        }`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-full transition-colors ${
                            viewMode === 'list'
                                ? 'bg-wedding-purple text-white'
                                : 'text-wedding-purple hover:bg-wedding-purple-light/20'
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {filters.isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    {/* Filter options remain the same */}
                </div>
            )}

            {/* Photos Grid/List View */}
            <div className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                : "space-y-4"
            }>
                {filteredPhotos.map((photo) => (
                    <div
                        key={photo.id}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                            viewMode === 'list' ? 'flex items-center gap-4' : ''
                        }`}
                        onClick={() => handleImageClick(photo)}
                    >
                        <img
                            src={`${API_URL}/uploads/${photo.filename}`}
                            alt={`Uploaded by ${photo.uploadedBy}`}
                            className={viewMode === 'grid'
                                ? "w-full aspect-square object-cover cursor-pointer"
                                : "w-24 h-24 object-cover cursor-pointer"
                            }
                        />
                        <div className="p-3">
                            <p className="font-medium text-wedding-purple-dark">
                                {photo.uploadedBy}
                            </p>
                            <p className="text-xs text-wedding-purple-light">
                                {new Date(photo.uploadDate || photo.createdAt).toLocaleString()}
                            </p>
                            {viewMode === 'list' && (
                                <p className="text-sm text-wedding-purple mt-1">
                                    {photo.uploadType || (photo.challengeId ? `Challenge #${photo.challengeId}` : 'General Upload')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <ImageModal
                        image={selectedImage}
                        photos={filteredPhotos}
                        onClose={() => setSelectedImage(null)}
                        onNavigate={setSelectedImage}
                    />
                )}
            </AnimatePresence>

            {/* Empty State */}
            {filteredPhotos.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-wedding-purple-light">No photos match your filters</p>
                </div>
            )}
        </div>
    );
};

export default EnhancedAdminGallery;