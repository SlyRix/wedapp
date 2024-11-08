import React, { useState, useMemo,useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, User, Grid, List, X, ChevronLeft, ChevronRight, Lock, Trophy, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import MediaModal from "./MediaModal.jsx";

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
        type: 'all',        // This will now handle general vs challenge photos
        privacy: 'all',
        challenge: 'all',   // This will handle specific challenges
        isOpen: false
    });

    const API_URL = 'https://engagement-photos-api.slyrix.com/api';
    const [sortBy, setSortBy] = useState('newest');

    const filterOptions = useMemo(() => {
        const challengeTitles = [...new Set(photos
            .filter(photo => photo.challengeId)
            .map(photo => photo.challengeTitle || `Challenge #${photo.challengeId}`))];

        return {
            dates: [...new Set(photos.map(photo =>
                new Date(photo.uploadDate || photo.createdAt).toLocaleDateString()))],
            uploaders: [...new Set(photos.map(photo => photo.uploadedBy))],
            photoTypes: [
                { value: 'all', label: 'All Photos' },
                { value: 'general', label: 'General Photos' },
                { value: 'challenge', label: 'Challenge Photos' }
            ],
            challenges: challengeTitles,
            privacy: ['All', 'Private Only', 'Public Only']
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

                // Enhanced type matching
                const matchesType = filters.type === 'all' ||
                    (filters.type === 'general' && !photo.challengeId) ||
                    (filters.type === 'challenge' && photo.challengeId);

                // Privacy matching
                const matchesPrivacy = filters.privacy === 'all' ||
                    (filters.privacy === 'Private Only' && photo.isPrivate) ||
                    (filters.privacy === 'Public Only' && !photo.isPrivate);

                // Challenge matching (only apply if viewing challenge photos)
                const matchesChallenge = filters.type !== 'general' && (
                    filters.challenge === 'all' ||
                    (photo.challengeTitle === filters.challenge) ||
                    (photo.challengeId && `Challenge #${photo.challengeId}` === filters.challenge)
                );

                return matchesSearch && matchesDate && matchesUploader &&
                    matchesType && matchesPrivacy &&
                    (filters.type === 'general' || matchesChallenge);
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

    // Filters Panel Component
    const FiltersPanel = () => (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            {/* Photo Type Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-wedding-purple-dark flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Photo Type
                </label>
                <select
                    value={filters.type}
                    onChange={(e) => {
                        setFilters(prev => ({
                            ...prev,
                            type: e.target.value,
                            // Reset challenge filter when switching to general photos
                            challenge: e.target.value === 'general' ? 'all' : prev.challenge
                        }));
                    }}
                    className="w-full p-2 rounded-lg border border-wedding-purple-light/30 text-sm"
                >
                    {filterOptions.photoTypes.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Challenge Filter - Only show when viewing challenge photos */}
            {filters.type !== 'general' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-wedding-purple-dark flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Challenge
                    </label>
                    <select
                        value={filters.challenge}
                        onChange={(e) => setFilters(prev => ({ ...prev, challenge: e.target.value }))}
                        className="w-full p-2 rounded-lg border border-wedding-purple-light/30 text-sm"
                    >
                        <option value="all">All Challenges</option>
                        {filterOptions.challenges.map(challenge => (
                            <option key={challenge} value={challenge}>{challenge}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Privacy Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-wedding-purple-dark flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Privacy
                </label>
                <select
                    value={filters.privacy}
                    onChange={(e) => setFilters(prev => ({ ...prev, privacy: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-wedding-purple-light/30 text-sm"
                >
                    <option value="all">All Photos</option>
                    <option value="Private Only">Private Only</option>
                    <option value="Public Only">Public Only</option>
                </select>
            </div>

            {/* Uploader Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-wedding-purple-dark flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Uploader
                </label>
                <select
                    value={filters.uploader}
                    onChange={(e) => setFilters(prev => ({ ...prev, uploader: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-wedding-purple-light/30 text-sm"
                >
                    <option value="all">All Uploaders</option>
                    {filterOptions.uploaders.map(uploader => (
                        <option key={uploader} value={uploader}>{uploader}</option>
                    ))}
                </select>
            </div>
        </div>
    );

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
            {filters.isOpen && <FiltersPanel />}

            {/* Photos Grid/List View with improved type indicators */}
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
                        <div className="relative">
                            <img
                                src={`${API_URL}/uploads/${photo.filename}`}
                                alt={`Uploaded by ${photo.uploadedBy}`}
                                className={viewMode === 'grid'
                                    ? "w-full aspect-square object-cover cursor-pointer"
                                    : "w-24 h-24 object-cover cursor-pointer"
                                }
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                {photo.isPrivate && (
                                    <div className="bg-black/50 p-1 rounded-full">
                                        <Lock className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                {photo.challengeId && (
                                    <div className="bg-wedding-purple/50 p-1 rounded-full">
                                        <Trophy className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-3">
                            <p className="font-medium text-wedding-purple-dark">
                                {photo.uploadedBy}
                            </p>
                            <p className="text-xs text-wedding-purple-light">
                                {new Date(photo.uploadDate || photo.createdAt).toLocaleString()}
                            </p>
                            {viewMode === 'list' && (
                                <div className="mt-1 space-y-1">
                                    <p className="text-sm text-wedding-purple">
                                        {photo.challengeTitle || 'General Photo'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {photo.isPrivate && (
                                            <span className="inline-flex items-center gap-1 text-xs text-wedding-purple-light">
                                                <Lock className="w-3 h-3" />
                                                Private
                                            </span>
                                        )}
                                        {photo.challengeId && (
                                            <span className="inline-flex items-center gap-1 text-xs text-wedding-purple">
                                                <Trophy className="w-3 h-3" />
                                                Challenge
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <MediaModal
                        src={selectedImage}
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