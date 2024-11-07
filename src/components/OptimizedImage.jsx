import React, { useState, useEffect } from 'react';
import { ImageOff, Loader, Play } from 'lucide-react';

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
    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    const getThumbnailUrl = () => {
        if (thumbnailPath) {
            return `${API_URL}/thumbnails/${thumbnailPath}`;
        }
        return src;
    };

    useEffect(() => {
        setLoading(true);
        setError(false);
        setIsFullImageLoaded(false);

        // Start with thumbnail
        const thumbUrl = getThumbnailUrl();
        setCurrentSrc(thumbUrl);
        console.log('Loading media:', {
            type: mediaType,
            thumbnail: thumbUrl,
            fullSrc: src
        });

        // For images, preload the full resolution version
        if (mediaType === 'image') {
            const fullImage = new Image();
            fullImage.src = src;
            fullImage.onload = () => {
                setCurrentSrc(src);
                setIsFullImageLoaded(true);
                setLoading(false);
            };
            fullImage.onerror = () => {
                setError(true);
                setLoading(false);
            };
        } else {
            // For videos, just show the thumbnail
            setLoading(false);
        }
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
                        src={getThumbnailUrl()}
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
                            src={src}
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

            {/* Loading and Error states remain the same */}
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-wedding-accent-light/50">
                    <Loader className="w-6 h-6 text-wedding-purple animate-spin" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-wedding-accent-light/50">
                    <ImageOff className="w-8 h-8 text-wedding-purple-light mb-2" />
                    <p className="text-sm text-wedding-purple-light">Failed to load image</p>
                </div>
            )}
        </div>
    );
};

export default OptimizedImage;