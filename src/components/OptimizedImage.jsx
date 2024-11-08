import React, { useState, useEffect } from 'react';
import { ImageOff, Loader } from 'lucide-react';

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
    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    // Debug logging
    useEffect(() => {
        console.log('OptimizedImage props:', {
            src,
            thumbnailPath,
            mediaType
        });
    }, [src, thumbnailPath, mediaType]);

    const thumbnailUrl = thumbnailPath ? `${API_URL}/thumbnails/${thumbnailPath}` : null;
    const fullImageUrl = src;

    useEffect(() => {
        if (!thumbnailUrl && !fullImageUrl) {
            setError(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(false);
        setIsFullImageLoaded(false);

        // Load thumbnail first if available
        if (thumbnailUrl) {
            console.log('Loading thumbnail:', thumbnailUrl);
            const thumbnailImage = new Image();
            thumbnailImage.onload = () => {
                setLoading(false);
                // Now load the full image
                const fullImage = new Image();
                fullImage.onload = () => {
                    setIsFullImageLoaded(true);
                };
                fullImage.onerror = () => {
                    console.error('Error loading full image:', fullImageUrl);
                };
                fullImage.src = fullImageUrl;
            };
            thumbnailImage.onerror = () => {
                console.error('Error loading thumbnail:', thumbnailUrl);
                // Fall back to loading full image directly
                const fullImage = new Image();
                fullImage.onload = () => {
                    setLoading(false);
                    setIsFullImageLoaded(true);
                };
                fullImage.onerror = () => {
                    setError(true);
                    setLoading(false);
                };
                fullImage.src = fullImageUrl;
            };
            thumbnailImage.src = thumbnailUrl;
        } else {
            // No thumbnail, load full image directly
            const fullImage = new Image();
            fullImage.onload = () => {
                setLoading(false);
                setIsFullImageLoaded(true);
            };
            fullImage.onerror = () => {
                setError(true);
                setLoading(false);
            };
            fullImage.src = fullImageUrl;
        }
    }, [thumbnailUrl, fullImageUrl]);

    return (
        <div className={`relative ${className}`}>
            {thumbnailUrl && !error && (
                <img
                    src={thumbnailUrl}
                    alt={alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isFullImageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                />
            )}

            {!error && (
                <img
                    src={fullImageUrl}
                    alt={alt}
                    onClick={onClick}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isFullImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                />
            )}

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