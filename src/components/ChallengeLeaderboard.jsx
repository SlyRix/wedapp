import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';

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

    const getMedalColor = (position) => {
        switch (position) {
            case 0: return 'bg-amber-100 border-amber-400 shadow-amber-200';
            case 1: return 'bg-gray-100 border-gray-400 shadow-gray-200';
            case 2: return 'bg-orange-100 border-orange-400 shadow-orange-200';
            default: return 'bg-gray-100 border-gray-300 shadow-gray-200';
        }
    };

    const getTrophy = (position) => {
        switch (position) {
            case 0: return <Crown className="w-12 h-12 text-amber-500" />;
            case 1: return <Trophy className="w-12 h-12 text-gray-500" />;
            case 2: return <Medal className="w-12 h-12 text-orange-700" />;
            default: return null;
        }
    };

    const getPlaceBadgeStyle = (position) => {
        switch (position) {
            case 0: return 'bg-amber-500 text-white';
            case 1: return 'bg-gray-500 text-white';
            case 2: return 'bg-orange-700 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="w-full py-8">
            <h3 className="text-xl font-medium text-wedding-purple-dark text-center mb-6">
                Challenge Leaders
            </h3>
            <div className="flex justify-center items-end gap-6 min-h-[300px]">
                {/* Second Place */}
                {leaderboard[1] && (
                    <div className="flex flex-col items-center relative">
                        {getTrophy(1)}
                        <div className={`w-48 h-56 ${getMedalColor(1)} border-2 rounded-xl mt-4 flex flex-col items-center p-4 shadow-lg transition-transform hover:scale-105 relative`}>
                            <div className={`${getPlaceBadgeStyle(1)} px-4 py-1 rounded-full text-sm absolute -top-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap`}>
                                2nd Place
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end">
                                <img
                                    src={`${API_URL}/uploads/${leaderboard[1].filename}`}
                                    alt={`Photo by ${leaderboard[1].uploadedBy}`}
                                    className="w-32 h-32 object-cover rounded-lg mb-3 shadow-md"
                                />
                                <p className="text-base font-medium text-gray-700 truncate w-full text-center">
                                    {leaderboard[1].uploadedBy}
                                </p>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {leaderboard[1].vote_count} votes
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* First Place */}
                {leaderboard[0] && (
                    <div className="flex flex-col items-center -mt-8 relative">
                        {getTrophy(0)}
                        <div className={`w-56 h-64 ${getMedalColor(0)} border-2 rounded-xl mt-4 flex flex-col items-center p-4 shadow-lg transition-transform hover:scale-105 relative`}>
                            <div className={`${getPlaceBadgeStyle(0)} px-4 py-1 rounded-full text-sm absolute -top-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap`}>
                                1st Place
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end">
                                <img
                                    src={`${API_URL}/uploads/${leaderboard[0].filename}`}
                                    alt={`Photo by ${leaderboard[0].uploadedBy}`}
                                    className="w-40 h-40 object-cover rounded-lg mb-3 shadow-md"
                                />
                                <p className="text-lg font-medium text-gray-700 truncate w-full text-center">
                                    {leaderboard[0].uploadedBy}
                                </p>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {leaderboard[0].vote_count} votes
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Third Place */}
                {leaderboard[2] && (
                    <div className="flex flex-col items-center relative">
                        {getTrophy(2)}
                        <div className={`w-48 h-48 ${getMedalColor(2)} border-2 rounded-xl mt-4 flex flex-col items-center p-4 shadow-lg transition-transform hover:scale-105 relative`}>
                            <div className={`${getPlaceBadgeStyle(2)} px-4 py-1 rounded-full text-sm absolute -top-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap`}>
                                3rd Place
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-end">
                                <img
                                    src={`${API_URL}/uploads/${leaderboard[2].filename}`}
                                    alt={`Photo by ${leaderboard[2].uploadedBy}`}
                                    className="w-28 h-28 object-cover rounded-lg mb-3 shadow-md"
                                />
                                <p className="text-base font-medium text-gray-700 truncate w-full text-center">
                                    {leaderboard[2].uploadedBy}
                                </p>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    {leaderboard[2].vote_count} votes
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengeLeaderboard;