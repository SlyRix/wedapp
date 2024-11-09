import React, { useState, useEffect, useRef } from 'react';
import { ImageOff, Loader, Play } from 'lucide-react';

// Simple in-memory cache
const imageCache = new Map();
const cacheDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

const OptimizedImage = ({
                            src,
                            alt,
                            className = '',
                            onClick,
                            thumbnailPath = null,
                            mediaType = 'image',
                            quality = 75
                        }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isFullImageLoaded, setIsFullImageLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState('');
    const [cacheStatus, setCacheStatus] = useState('');
    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    const checkCache = (url) => {
        const cached = imageCache.get(url);
        if (!cached) return null;

        // Check if cache has expired
        if (Date.now() - cached.timestamp > cacheDuration) {
            imageCache.delete(url);
            return null;
        }

        return cached.blob;
    };

    const cacheImage = (url, blob) => {
        imageCache.set(url, {
            blob,
            timestamp: Date.now()
        });
    };

    const loadImage = async (url) => {
        try {
            // First check cache
            const cachedImage = checkCache(url);
            if (cachedImage) {
                setCacheStatus('Cache hit');
                return URL.createObjectURL(cachedImage);
            }

            setCacheStatus('Cache miss');
            const response = await fetch(url);
            const blob = await response.blob();

            // Cache the image
            cacheImage(url, blob);

            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error loading image:', error);
            throw error;
        }
    };

    useEffect(() => {
        setLoading(true);
        setError(false);
        setIsFullImageLoaded(false);

        const thumbUrl = thumbnailPath ? `${API_URL}/thumbnails/${thumbnailPath}` : src;
        setCurrentSrc(thumbUrl);

        if (mediaType === 'image') {
            loadImage(src)
                .then(objectUrl => {
                    setCurrentSrc(objectUrl);
                    setIsFullImageLoaded(true);
                    setLoading(false);
                })
                .catch(() => {
                    setError(true);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }

        // Cleanup function
        return () => {
            if (currentSrc.startsWith('blob:')) {
                URL.revokeObjectURL(currentSrc);
            }
        };
    }, [src, thumbnailPath, mediaType]);

    const handleThumbnailLoad = () => {
        if (!isFullImageLoaded) {
            setLoading(false);
        }
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className={`relative ${className}`}>
            {!error && (
                <div className="relative w-full h-full">
                    {/* Thumbnail */}
                    <img
                        src={thumbnailPath ? `${API_URL}/thumbnails/${thumbnailPath}` : src}
                        alt={alt}
                        onLoad={handleThumbnailLoad}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                            loading ? 'opacity-0' : 'opacity-100'
                        } ${mediaType === 'image' && isFullImageLoaded ? 'opacity-0' : 'opacity-100'}`}
                        loading="lazy"
                    />

                    {/* Full resolution image (only for images) */}
                    {mediaType === 'image' && (
                        <img
                            src={currentSrc}
                            alt={alt}
                            onClick={onClick}
                            onError={handleError}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                isFullImageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                        />
                    )}

                    {/* Play button overlay for videos */}
                    {mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading state */}
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-wedding-accent-light/50">
                    <Loader className="w-6 h-6 text-wedding-purple animate-spin" />
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-wedding-accent-light/50">
                    <ImageOff className="w-8 h-8 text-wedding-purple-light mb-2" />
                    <p className="text-sm text-wedding-purple-light">Failed to load image</p>
                </div>
            )}

            {/* Cache status indicator (can be removed in production) */}
            {process.env.NODE_ENV === 'development' && cacheStatus && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {cacheStatus}
                </div>
            )}
        </div>
    );
};

export default OptimizedImage;