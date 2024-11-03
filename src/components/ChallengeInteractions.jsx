import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Trophy, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash'; // Add this import

const ChallengeInteractions = ({
                                   photoId,
                                   currentUser,
                                   challengeId,
                                   uploadedBy,
                                   onVoteChange,
                                   votedPhotoId
                               }) => {

    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [hasVotedOther, setHasVotedOther] = useState(false);
    const [voteCount, setVoteCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = 'http://slyrix.com:3001/api';

    useEffect(() => {
        let isSubscribed = true;

        const fetchData = async () => {
            try {
                const [likesRes, commentsRes] = await Promise.all([
                    fetch(`${API_URL}/photos/${photoId}/likes?userName=${currentUser}`),
                    fetch(`${API_URL}/photos/${photoId}/comments`)
                ]);

                if (!isSubscribed) return;

                const likesData = await likesRes.json();
                const commentsData = await commentsRes.json();

                setLikes(likesData.likes);
                setIsLiked(likesData.hasLiked);
                setComments(commentsData || []);
            } catch (error) {
                console.error('Error fetching social data:', error);
                if (isSubscribed) {
                    setError('Failed to load data. Please try again.');
                }
            }
        };

        fetchData();
        return () => {
            isSubscribed = false;
        };
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
    const checkChallengeVoteStatus = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/vote-status?userName=${currentUser}`
            );
            const data = await response.json();

            // Update local state based on vote status
            setHasVoted(data.userVotedPhotoId === parseInt(photoId));
            setHasVotedOther(data.userVotedPhotoId && data.userVotedPhotoId !== parseInt(photoId));
        } catch (error) {
            console.error('Error checking vote status:', error);
            setError('Failed to check vote status.');
        }
    }, [challengeId, currentUser, photoId]);
    const getPhotoVoteCount = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote-status?userName=${currentUser}`
            );
            const data = await response.json();
            setVoteCount(data.voteCount);
        } catch (error) {
            console.error('Error getting vote count:', error);
        }
    }, [challengeId, photoId, currentUser]);

    const debouncedCheckVoteStatus = useCallback(
        debounce(async () => {
            try {
                const response = await fetch(
                    `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote-status?userName=${currentUser}`
                );
                const data = await response.json();
                setHasVoted(data.hasVoted);
                setVoteCount(data.voteCount);
                setHasVotedOther(data.userVotedPhotoId && data.userVotedPhotoId !== parseInt(photoId));
            } catch (error) {
                console.error('Error checking vote status:', error);
                setError('Failed to check vote status.');
            }
        }, 300),
        [challengeId, photoId, currentUser]
    );

    useEffect(() => {
        debouncedCheckVoteStatus();
        return () => debouncedCheckVoteStatus.cancel();
    }, [debouncedCheckVoteStatus]);
    useEffect(() => {
        checkChallengeVoteStatus();
        getPhotoVoteCount();
    }, [checkChallengeVoteStatus, getPhotoVoteCount]);
    useEffect(() => {
        const hasVotedForThis = votedPhotoId === parseInt(photoId);
        const hasVotedForOther = votedPhotoId && votedPhotoId !== parseInt(photoId);

        setHasVoted(hasVotedForThis);
        setHasVotedOther(hasVotedForOther);
    }, [votedPhotoId, photoId]);

    const checkVoteStatus = async () => {
        try {
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote-status?userName=${currentUser}`
            );
            const data = await response.json();

            setHasVoted(data.userVotedPhotoId === parseInt(photoId));
            setHasVotedOther(data.userVotedPhotoId && data.userVotedPhotoId !== parseInt(photoId));
            setVoteCount(data.voteCount);
        } catch (error) {
            console.error('Error checking vote status:', error);
            setError('Failed to check vote status.');
        }
    };
    const canVote = currentUser !== uploadedBy;

    const handleVote = async () => {
        if (!canVote || isLoading || isSubmitting) return;

        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_URL}/challenges/${challengeId}/photos/${photoId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: currentUser })
            });

            if (!response.ok) throw new Error('Vote action failed');

            // Call onVoteChange to update all photos in the challenge
            if (onVoteChange) {
                await onVoteChange();
            }

        } catch (error) {
            console.error('Error handling vote:', error);
            setError('Failed to submit vote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleLike = async () => {
        try {
            const response = await fetch(`${API_URL}/photos/${photoId}/likes`, {
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
        const trimmedComment = newComment.trim();
        if (!trimmedComment || isLoading || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const response = await fetch(`${API_URL}/photos/${photoId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: currentUser,
                    commentText: trimmedComment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            setNewComment('');
            await fetchSocialData();
        } catch (error) {
            setError('Failed to add comment. Please try again.');
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-500 text-xs p-2 rounded-lg flex items-center justify-between"
                >
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-700 hover:text-red-900"
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between p-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm">
                <div className="flex items-center gap-3">
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
                </div>

                {/* Vote Button */}
                {canVote ? (
                    <motion.button
                        onClick={handleVote}
                        disabled={isLoading || isSubmitting || hasVotedOther}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                            hasVotedOther
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // Disabled style when voted for another photo
                                : hasVoted
                                    ? 'bg-wedding-purple text-white' // Active vote style
                                    : 'hover:bg-wedding-purple/10 text-wedding-purple border border-wedding-purple' // Can vote style
                        } ${isSubmitting ? 'opacity-50' : ''}`}
                        whileTap={!hasVotedOther && !isSubmitting ? { scale: 0.95 } : {}}
                    >
                        <Trophy className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-medium">
      {isSubmitting
          ? 'Updating...'
          : hasVoted
              ? `Your vote (${voteCount})`
              : hasVotedOther
                  ? `Voted for another photo`
                  : `Vote (${voteCount})`}
    </span>
                    </motion.button>
                ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">{voteCount} votes</span>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        className="overflow-hidden rounded-lg bg-white/50 backdrop-blur-sm"
                    >
                        {/* Comments List */}
                        <div className="max-h-40 overflow-y-auto p-3 space-y-2">
                        {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-wedding-purple/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-wedding-purple">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-700">
                                            {comment.user_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {comment.comment_text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-gray-500 text-center">No comments yet</p>
                            )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleAddComment} className="p-2 border-t border-gray-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 text-xs px-3 py-1.5 rounded-full border-none bg-white/50 focus:ring-1 focus:ring-wedding-purple"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isLoading}
                                    className="p-1.5 rounded-full bg-wedding-purple text-white disabled:opacity-50"
                                >
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChallengeInteractions;