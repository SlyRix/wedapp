import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const MediaModal = ({ src, onClose, photos, onNavigate }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const minSwipeDistance = 50;
    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    const currentIndex = photos?.length ? photos.findIndex(
        photo => `${API_URL}/uploads/${photo.filename}` === src
    ) : -1;

    const currentPhoto = currentIndex >= 0 ? photos[currentIndex] : null;
    const isVideo = currentPhoto?.mediaType === 'video';

    // Reset video state when src changes
    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
            setIsMuted(true);
        }
    }, [src, isVideo]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleVideoPlay = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleVideoMute = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handlePrev = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex > 0 && !isAnimating && photos?.length) {
            setIsAnimating(true);
            onNavigate(`${API_URL}/uploads/${photos[currentIndex - 1].filename}`);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const handleNext = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex < (photos?.length ?? 0) - 1 && !isAnimating) {
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

        if (isLeftSwipe && currentIndex < (photos?.length ?? 0) - 1) {
            handleNext();
        }
        if (isRightSwipe && currentIndex > 0) {
            handlePrev();
        }
    };

    // Handle video end
    const handleVideoEnd = () => {
        setIsPlaying(false);
    };

    if (!src) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="relative w-full h-full flex items-center justify-center p-4"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {isVideo ? (
                    <div className="relative">
                        <motion.video
                            ref={videoRef}
                            key={src}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            src={src}
                            className="max-w-[90vw] max-h-[90vh] rounded-lg"
                            onClick={e => e.stopPropagation()}
                            playsInline
                            muted={isMuted}
                            onEnded={handleVideoEnd}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full flex items-center gap-4">
                            <button
                                onClick={handleVideoPlay}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={handleVideoMute}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <motion.img
                        key={src}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        src={src}
                        alt="Full size"
                        className="max-w-[90vw] max-h-[90vh] object-contain select-none rounded-lg"
                        onClick={e => e.stopPropagation()}
                        draggable={false}
                    />
                )}

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

export default MediaModal;
