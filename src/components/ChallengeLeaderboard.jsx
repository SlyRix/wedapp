import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = 'http://slyrix.com:3001/api';

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
            setLeaderboard(data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasParticipated || leaderboard.length === 0) {
        return null;
    }

    const getPositionInfo = (position) => {
        switch (position) {
            case 0:
                return {
                    icon: <Crown className="w-5 h-5 text-amber-500" />,
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    textColor: 'text-amber-700',
                    size: 'w-20 h-20',
                    label: '1st'
                };
            case 1:
                return {
                    icon: <Trophy className="w-5 h-5 text-gray-500" />,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-700',
                    size: 'w-16 h-16',
                    label: '2nd'
                };
            case 2:
                return {
                    icon: <Trophy className="w-5 h-5 text-orange-500" />,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-700',
                    size: 'w-16 h-16',
                    label: '3rd'
                };
            default:
                return {
                    icon: null,
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-600',
                    size: 'w-16 h-16',
                    label: ''
                };
        }
    };

    return (
        <div className="w-full mt-3">
            {/* Title */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-wedding-purple" />
                <span className="text-sm font-medium text-wedding-purple">Top Photos</span>
            </div>

            {/* Leaderboard Row */}
            <div className="flex justify-center items-end gap-2">
                {/* Second Place */}
                {leaderboard[1] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center"
                    >
                        <div className={`relative ${getPositionInfo(1).bgColor} border-2 ${getPositionInfo(1).borderColor} rounded-lg p-1 shadow-sm`}>
                            <img
                                src={`${API_URL}/uploads/${leaderboard[1].filename}`}
                                alt={`Photo by ${leaderboard[1].uploadedBy}`}
                                className={`${getPositionInfo(1).size} object-cover rounded-md`}
                            />
                            <div className="absolute -top-2 -right-2">
                                {getPositionInfo(1).icon}
                            </div>
                        </div>
                        <div className="mt-1 text-center">
                            <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                {leaderboard[1].uploadedBy}
                            </p>
                            <p className="text-[10px] text-gray-500">{leaderboard[1].vote_count} votes</p>
                        </div>
                    </motion.div>
                )}

                {/* First Place */}
                {leaderboard[0] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center -mb-1"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    y: [0, -4, 0],
                                    rotate: [0, -3, 3, -3, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                                className="absolute -top-3 left-1/2 -translate-x-1/2"
                            >
                                {getPositionInfo(0).icon}
                            </motion.div>
                            <div className={`relative ${getPositionInfo(0).bgColor} border-2 ${getPositionInfo(0).borderColor} rounded-lg p-1 shadow-md mt-2`}>
                                <img
                                    src={`${API_URL}/uploads/${leaderboard[0].filename}`}
                                    alt={`Photo by ${leaderboard[0].uploadedBy}`}
                                    className={`${getPositionInfo(0).size} object-cover rounded-md`}
                                />
                            </div>
                        </div>
                        <div className="mt-1 text-center">
                            <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                {leaderboard[0].uploadedBy}
                            </p>
                            <p className="text-[10px] text-gray-500">{leaderboard[0].vote_count} votes</p>
                        </div>
                    </motion.div>
                )}

                {/* Third Place */}
                {leaderboard[2] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center"
                    >
                        <div className={`relative ${getPositionInfo(2).bgColor} border-2 ${getPositionInfo(2).borderColor} rounded-lg p-1 shadow-sm`}>
                            <img
                                src={`${API_URL}/uploads/${leaderboard[2].filename}`}
                                alt={`Photo by ${leaderboard[2].uploadedBy}`}
                                className={`${getPositionInfo(2).size} object-cover rounded-md`}
                            />
                            <div className="absolute -top-2 -right-2">
                                {getPositionInfo(2).icon}
                            </div>
                        </div>
                        <div className="mt-1 text-center">
                            <p className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                {leaderboard[2].uploadedBy}
                            </p>
                            <p className="text-[10px] text-gray-500">{leaderboard[2].vote_count} votes</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Motivational Message */}
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