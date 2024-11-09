import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

// Simple in-memory cache for leaderboard data
const leaderboardCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds cache

const ChallengeLeaderboard = ({
                                  challengeId,
                                  challengeTitle,
                                  challengePhotos = [],
                                  guestName
                              }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasParticipated, setHasParticipated] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    // Check if user has participated
    useEffect(() => {
        const userParticipated = challengePhotos.some(photo => photo.uploadedBy === guestName);
        setHasParticipated(userParticipated);
    }, [challengePhotos, guestName]);

    // Cached fetch function
    const fetchLeaderboardWithCache = async () => {
        const cacheKey = `leaderboard-${challengeId}`;
        const cached = leaderboardCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setLeaderboard(cached.data);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/challenges/${challengeId}/leaderboard`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');

            const data = await response.json();

            // Cache the new data
            leaderboardCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            setLeaderboard(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching leaderboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch leaderboard data when component mounts and user has participated
    useEffect(() => {
        if (hasParticipated) {
            fetchLeaderboardWithCache();
        }
    }, [hasParticipated, challengeId]);

    // Loading skeleton component
    const LeaderboardSkeleton = () => (
        <div className="w-full mt-3 animate-pulse">
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-4 h-4 bg-wedding-purple/20 rounded-full"/>
                <div className="w-20 h-4 bg-wedding-purple/20 rounded-full"/>
            </div>
            <div className="flex justify-center items-end gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`bg-wedding-purple/10 rounded-lg ${
                            i === 2 ? 'w-20 h-20' : 'w-16 h-16'
                        }`}/>
                        <div className="w-12 h-3 bg-wedding-purple/10 rounded-full mt-2"/>
                    </div>
                ))}
            </div>
        </div>
    );

    // Don't render anything if user hasn't participated or there's no data
    if (!hasParticipated || (leaderboard.length === 0 && !isLoading)) {
        return null;
    }

    // Show loading skeleton while fetching data
    if (isLoading) {
        return <LeaderboardSkeleton />;
    }

    // Show error state if there's an error
    if (error) {
        return (
            <div className="text-center text-wedding-purple-light mt-3">
                <p>Unable to load leaderboard</p>
            </div>
        );
    }

    // Position info configuration
    const getPositionInfo = (index, rank) => {
        const positions = {
            1: {
                icon: <Trophy className="w-5 h-5 text-gray-500" />,
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-200',
                textColor: 'text-gray-700',
                size: 'w-16 h-16',
            },
            0: {
                icon: <Crown className="w-5 h-5 text-amber-500" />,
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                textColor: 'text-amber-700',
                size: 'w-20 h-20',
            },
            2: {
                icon: <Trophy className="w-5 h-5" style={{ color: '#bf8970' }}/>,
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                textColor: 'text-orange-700',
                size: 'w-16 h-16',
            }
        };

        return positions[index] || null;
    };

    const podiumOrder = [1, 0, 2];

    return (
        <div className="w-full mt-3">
            <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-wedding-purple" />
                <span className="text-sm font-medium text-wedding-purple">Top Photos</span>
            </div>

            <div className="flex justify-center items-end gap-4">
                {podiumOrder.map((position) => {
                    const photo = leaderboard[position];
                    if (!photo) return null;

                    const posInfo = getPositionInfo(position, photo.rank);

                    return (
                        <motion.div
                            key={photo.photo_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: position * 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${posInfo.bgColor} border-2 ${posInfo.borderColor} 
                                rounded-lg p-1 shadow-sm ${position === 0 ? '-mb-0' : ''}`}
                            >
                                <OptimizedImage
                                    src={`${API_URL}/uploads/${photo.filename}`}
                                    thumbnailPath={photo.thumbnailPath}
                                    alt={`Photo by ${photo.uploadedBy}`}
                                    className={`${posInfo.size} object-cover rounded-md`}
                                    mediaType={photo.mediaType || 'image'}
                                />
                                <div className="absolute -top-2 -right-2">
                                    {posInfo.icon}
                                </div>
                            </div>
                            <div className="mt-1 text-center">
                                <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                    {photo.uploadedBy}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {photo.vote_count} vote{photo.vote_count !== 1 ? 's' : ''}
                                </p>
                                {photo.rank > position + 1 && (
                                    <p className="text-[10px] text-wedding-purple">
                                        Tied for {photo.rank}#{position > 0 ? ' place' : ''}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {!leaderboard.find(entry => entry.uploadedBy === guestName) && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-center text-wedding-purple-light mt-3 italic"
                >
                    Share your photo for a chance to win! ✨
                </motion.p>
            )}
        </div>
    );
};

export default ChallengeLeaderboard;