import React, { useState } from 'react';
import { ImageOff, Loader } from 'lucide-react';

const OptimizedImage = ({
                            src,
                            alt,
                            className = '',
                            onClick,
                            quality = 75
                        }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Main Image */}
            {!error && (
                <img
                    src={src}
                    alt={alt}
                    onClick={onClick}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`transition-opacity duration-300 ${
                        loading ? 'opacity-0' : 'opacity-100'
                    } ${className}`}
                    loading="lazy"
                />
            )}

            {/* Loading State */}
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-wedding-accent-light/50">
                    <Loader className="w-6 h-6 text-wedding-purple animate-spin" />
                </div>
            )}

            {/* Error State */}
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