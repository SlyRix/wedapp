import React, { useState, useEffect } from 'react';
import { Heart, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://slyrix.com:3001/api';

const VotingSystem = ({
                          photoId,
                          challengeId,
                          currentUser
                      }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkVoteStatus();
    }, [photoId, challengeId]);

    const checkVoteStatus = async () => {
        try {
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote-status?userName=${currentUser}`
            );
            const data = await response.json();
            setHasVoted(data.hasVoted);
            setVoteCount(data.voteCount);
        } catch (error) {
            console.error('Error checking vote status:', error);
        }
    };

    const handleVote = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userName: currentUser })
                }
            );
            const data = await response.json();
            setHasVoted(data.voted);
            checkVoteStatus(); // Refresh vote count
        } catch (error) {
            console.error('Error handling vote:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleVote}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    hasVoted
                        ? 'bg-wedding-purple text-white'
                        : 'bg-white text-wedding-purple border border-wedding-purple hover:bg-wedding-purple hover:text-white'
                }`}
            >
                <Trophy className="w-4 h-4" />
                <span>Vote</span>
            </motion.button>
            <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${
                    hasVoted ? 'text-red-500 fill-current' : 'text-wedding-purple-light'
                }`} />
                <span className="text-wedding-purple font-medium">{voteCount}</span>
            </div>
        </div>
    );
};

export default VotingSystem;