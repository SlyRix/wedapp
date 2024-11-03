import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SocialFeatures = ({
                            photoId,
                            currentUser,
                            challengeId,
                            uploadedBy,
                            onVoteChange
                        }) => {
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

    useEffect(() => {
        fetchSocialData();
        checkVoteStatus();
    }, [photoId, currentUser]);

    const fetchSocialData = async () => {
        try {
            const [likesRes, commentsRes] = await Promise.all([
                fetch(`${API_URL}/photos/${photoId}/likes?userName=${currentUser}`),
                fetch(`${API_URL}/photos/${photoId}/comments`)
            ]);

            const likesData = await likesRes.json();
            const commentsData = await commentsRes.json();

            setLikes(likesData.likes);
            setIsLiked(likesData.hasLiked);
            setComments(commentsData || []);
        } catch (error) {
            console.error('Error fetching social data:', error);
        }
    };

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

    const canVote = currentUser !== uploadedBy;

    const handleVote = async () => {
        if (!canVote || isLoading) return;

        try {
            setIsLoading(true);
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: currentUser })
                }
            );
            const data = await response.json();
            setHasVoted(data.voted);
            checkVoteStatus();
            if (onVoteChange) onVoteChange();
        } catch (error) {
            console.error('Error handling vote:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            const response = await fetch(`${API_URL}/photos/${photoId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: currentUser })
            });
            const data = await response.json();
            setIsLiked(data.liked);
            fetchSocialData();
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isLoading) return;

        try {
            setIsLoading(true);
            await fetch(`${API_URL}/photos/${photoId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: currentUser,
                    commentText: newComment
                })
            });
            setNewComment('');
            fetchSocialData();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 px-2 py-1 bg-white/50 backdrop-blur-sm rounded-full shadow-sm">
            {/* Like Button */}
            <button
                onClick={handleLike}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isLoading}
            >
                <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                />
                <span className="text-xs text-gray-600">{likes}</span>
            </button>

            {/* Comments Button */}
            <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
            >
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">{comments.length}</span>
            </button>

            {/* Vote Button - Only show if user can vote */}
            {canVote && (
                <motion.button
                    onClick={handleVote}
                    disabled={isLoading || hasVoted}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                        hasVoted
                            ? 'bg-wedding-purple text-white'
                            : 'hover:bg-wedding-purple/10 text-wedding-purple'
                    }`}
                    whileTap={{ scale: 0.95 }}
                >
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs">{voteCount}</span>
                </motion.button>
            )}

            {/* Vote Count (when user can't vote) */}
            {!canVote && (
                <div className="flex items-center gap-1 px-2 py-1">
                    <Trophy className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{voteCount}</span>
                </div>
            )}
        </div>
    );
};

export default SocialFeatures;