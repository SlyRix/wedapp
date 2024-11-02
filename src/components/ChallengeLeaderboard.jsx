import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = 'http://slyrix.com:3001/api';

const ChallengeLeaderboard = ({
                                  challengeId,
                                  challengeTitle
                              }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [challengeId]);

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

    const getPositionStyle = (position) => {
        switch (position) {
            case 0: return 'text-yellow-500';  // Gold
            case 1: return 'text-gray-400';    // Silver
            case 2: return 'text-amber-700';   // Bronze
            default: return 'text-wedding-purple-light';
        }
    };

    const getPositionIcon = (position) => {
        switch (position) {
            case 0: return <Crown className="w-6 h-6" />;
            case 1: return <Trophy className="w-6 h-6" />;
            case 2: return <Medal className="w-6 h-6" />;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <p className="text-wedding-purple-light">Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-wedding-purple-light/20 p-6">
            <h3 className="text-xl font-medium text-wedding-purple-dark mb-6">
                {challengeTitle} - Top Photos
            </h3>

            <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                    <motion.div
                        key={entry.photo_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-lg bg-wedding-accent-light"
                    >
                        <div className={`flex items-center justify-center w-8 h-8 ${getPositionStyle(index)}`}>
                            {getPositionIcon(index) || (index + 1)}
                        </div>

                        <div className="flex-1">
                            <p className="font-medium text-wedding-purple-dark">
                                {entry.uploadedBy}
                            </p>
                            <p className="text-sm text-wedding-purple-light">
                                {entry.vote_count} votes
                            </p>
                        </div>

                        <img
                            src={`${API_URL}/uploads/${entry.filename}`}
                            alt={`Photo by ${entry.uploadedBy}`}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    </motion.div>
                ))}

                {leaderboard.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-wedding-purple-light">
                            No votes yet. Be the first to vote!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengeLeaderboard;