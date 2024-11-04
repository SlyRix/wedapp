import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = 'https://engagement-photos-api.slyrix.com/api';

const ChallengeLeaderboard = ({
                                  challengeId,
                                  challengeTitle,
                                  challengePhotos = [],
                                  guestName
                              }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasParticipated, setHasParticipated] = useState(false);

    useEffect(() => {
        const userParticipated = challengePhotos.some(photo => photo.uploadedBy === guestName);
        setHasParticipated(userParticipated);

        if (userParticipated) {
            fetchLeaderboard();
        }
    }, [challengeId, challengePhotos, guestName]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${API_URL}/challenges/${challengeId}/leaderboard`);
            const data = await response.json();
            setLeaderboard(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasParticipated || leaderboard.length === 0) {
        return null;
    }

    const getPositionInfo = (index, rank) => {
        // Map array index to display position while preserving rank for styling
        switch (index) {
            case 1: // Second position
                return {
                    icon: <Trophy className="w-5 h-5 text-gray-500" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-700',
                    size: 'w-16 h-16',
                    label: rank
                };
            case 0: // First position
                return {
                    icon: <Crown className="w-5 h-5 text-amber-500" />,
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    textColor: 'text-amber-700',
                    size: 'w-20 h-20',
                    label: rank
                };
            case 2: // Third position
                return {
                    icon: <Trophy className="w-5 h-5" style={{ color: '#bf8970' }}/>,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-700',
                    size: 'w-16 h-16',
                    label: rank
                };
            default:
                return null;
        }
    };

    // Group photos by rank
    const photosByRank = leaderboard.reduce((acc, photo) => {
        if (!acc[photo.rank]) {
            acc[photo.rank] = [];
        }
        acc[photo.rank].push(photo);
        return acc;
    }, {});

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
                                rounded-lg p-1 shadow-sm ${position === 0 ? '-mb-0' : ''}`}>
                                <img
                                    src={`${API_URL}/uploads/${photo.filename}`}
                                    alt={`Photo by ${photo.uploadedBy}`}
                                    className={`${posInfo.size} object-cover rounded-md`}
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