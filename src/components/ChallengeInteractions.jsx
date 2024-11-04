import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trophy, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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

    const API_URL = 'https://engagement-photos-api.slyrix.com/api';

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
                    setError('Failed to load data');
                }
            }
        };

        fetchData();
        return () => {
            isSubscribed = false;
        };
    }, [photoId, currentUser]);

    useEffect(() => {
        const hasVotedForThis = votedPhotoId === parseInt(photoId);
        const hasVotedForOther = votedPhotoId && votedPhotoId !== parseInt(photoId);
        setHasVoted(hasVotedForThis);
        setHasVotedOther(hasVotedForOther);
        fetchVoteCount();
    }, [votedPhotoId, photoId]);

    const fetchVoteCount = async () => {
        try {
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote-status?userName=${currentUser}`
            );
            const data = await response.json();
            setVoteCount(data.voteCount);
        } catch (error) {
            console.error('Error fetching vote count:', error);
        }
    };

    const canVote = currentUser !== uploadedBy;

    const handleVote = async () => {
        if (!canVote || isLoading || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const response = await fetch(
                `${API_URL}/challenges/${challengeId}/photos/${photoId}/vote`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: currentUser })
                }
            );

            if (!response.ok) throw new Error('Vote action failed');

            const data = await response.json();
            setHasVoted(data.voted);
            setVoteCount(data.voteCount);

            if (onVoteChange) {
                await onVoteChange();
            }

            await fetchVoteCount();

        } catch (error) {
            console.error('Error handling vote:', error);
            setError('Failed to submit vote');
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
            await fetchSocialData();
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

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

            if (!response.ok) throw new Error('Failed to add comment');
            setNewComment('');
            await fetchSocialData();
        } catch (error) {
            setError('Failed to add comment');
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const CommentsModal = () => {
        useEffect(() => {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }, []);

        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={(e) => {
                    if (e.target === e.currentTarget) setShowComments(false);
                }}
            >
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    className="w-full max-w-lg bg-white rounded-lg max-h-[80vh] flex flex-col mx-4"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-wedding-purple" />
                            <h3 className="text-sm font-medium text-wedding-purple">Comments ({comments.length})</h3>
                        </div>
                        <button
                            onClick={() => setShowComments(false)}
                            className="p-1 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {comments.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-4">
                                No comments yet. Be the first to comment!
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-wedding-purple/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-medium text-wedding-purple">
                                            {comment.user_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {comment.user_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{comment.comment_text}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="border-t p-4">
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-4 py-2 text-sm border rounded-full focus:ring-2 focus:ring-wedding-purple focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isLoading}
                                className="p-2 rounded-full bg-wedding-purple text-white disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </motion.div>,
            document.body
        );
    };

    return (
        <div className="space-y-1">
            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-500 text-xs p-1.5 rounded-lg flex items-center justify-between"
                >
                    <span className="text-xs">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-700 hover:text-red-900"
                    >
                        <span className="text-xs">×</span>
                    </button>
                </motion.div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between p-1 bg-white/50 backdrop-blur-sm rounded-full shadow-sm">
                <div className="flex items-center gap-1">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={isLoading}
                    >
                        <Heart
                            className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                        />
                        <span className="text-xs text-gray-600">{likes}</span>
                    </button>

                    {/* Comments Button */}
                    <button
                        onClick={() => setShowComments(true)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <MessageCircle className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">{comments.length}</span>
                    </button>
                </div>

                {/* Vote Button */}
                {canVote ? (
                    <motion.button
                        onClick={handleVote}
                        disabled={isLoading || isSubmitting || hasVotedOther}
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full transition-colors ${
                            hasVotedOther
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : hasVoted
                                    ? 'bg-wedding-purple text-white'
                                    : 'hover:bg-wedding-purple/10 text-wedding-purple border border-wedding-purple'
                        } ${isSubmitting ? 'opacity-50' : ''}`}
                        whileTap={!hasVotedOther && !isSubmitting ? { scale: 0.95 } : {}}
                    >
                        <Trophy className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                        <span className="text-xs">
                            {isSubmitting ? '...' : hasVoted ? voteCount : `Vote (${voteCount})`}
                        </span>
                    </motion.button>
                ) : (
                    <div className="flex items-center gap-0.5 px-2 py-0.5">
                        <Trophy className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{voteCount}</span>
                    </div>
                )}
            </div>

            {/* Comments Modal */}
            <AnimatePresence>
                {showComments && <CommentsModal />}
            </AnimatePresence>
        </div>
    );
};

export default ChallengeInteractions;