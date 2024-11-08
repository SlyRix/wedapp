import React, { createContext, useContext, useState } from 'react';
import { Loader } from 'lucide-react';

const LoadingContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useLoading = () => useContext(LoadingContext);

// eslint-disable-next-line react/prop-types
export function LoadingProvider({ children }) {
    const [loadingStates, setLoadingStates] = useState({
        generalPhotos: true,
        challengePhotos: {},
        leaderboards: {}
    });

    const setLoadingState = (key, value, challengeId = null) => {
        setLoadingStates(prev => {
            if (challengeId !== null) {
                return {
                    ...prev,
                    [key]: {
                        ...prev[key],
                        [challengeId]: value
                    }
                };
            }
            return {
                ...prev,
                [key]: value
            };
        });
    };

    const LoadingIndicator = ({ size = "default", text = "Loading..." }) => {
        const sizeClasses = {
            small: "w-4 h-4",
            default: "w-6 h-6",
            large: "w-8 h-8"
        };

        return (
            <div className="flex flex-col items-center justify-center p-4">
                <Loader className={`${sizeClasses[size]} text-wedding-purple animate-spin`} />
                <p className="text-wedding-purple-light text-sm mt-2">{text}</p>
            </div>
        );
    };

    const PhotoSkeleton = () => (
        <div className="aspect-square bg-wedding-purple-light/10 rounded-lg animate-pulse">
            <div className="h-full w-full bg-gradient-to-br from-wedding-purple-light/5 to-wedding-purple-light/20" />
        </div>
    );

    const LeaderboardSkeleton = () => (
        <div className="space-y-4 p-4">
            <div className="h-8 w-32 bg-wedding-purple-light/10 rounded-full animate-pulse mx-auto" />
            <div className="flex justify-center gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-20 h-20 bg-wedding-purple-light/10 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );

    const value = {
        loadingStates,
        setLoadingState,
        LoadingIndicator,
        PhotoSkeleton,
        LeaderboardSkeleton
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
        </LoadingContext.Provider>
    );
}

export function usePhotoLoading(challengeId = null) {
    const { loadingStates, setLoadingState } = useLoading();

    const fetchPhotosWithLoading = async (fetchFunction) => {
        const loadingKey = challengeId ? 'challengePhotos' : 'generalPhotos';

        try {
            setLoadingState(loadingKey, true, challengeId);
            await fetchFunction();
        } finally {
            setLoadingState(loadingKey, false, challengeId);
        }
    };

    return {
        isLoading: challengeId
            ? loadingStates.challengePhotos[challengeId]
            : loadingStates.generalPhotos,
        fetchPhotosWithLoading
    };
}
