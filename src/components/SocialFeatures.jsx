import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Smile, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://slyrix.com:3001/api';

const SocialFeatures = ({
                            photoId,
                            currentUser,
                            challengeId = null // Add this prop for challenge photos
                        }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [stats, setStats] = useState({
        likes: 0,
        comments: [],
        votes: 0
    });
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial stats
    useEffect(() => {
        fetchPhotoStats();
    }, [photoId]);

    const fetchPhotoStats = async () => {
        try {
            const response = await fetch(`${API_URL}/photos/${photoId}/likes?userName=${currentUser}`);
            const data = await response.json();
            setStats({
                likes: data.likes,
                comments: [], // Fetch comments separately
                votes: 0 // Fetch votes separately
            });
            setIsLiked(data.hasLiked);
        } catch (error) {
            console.error('Error fetching photo stats:', error);
        }
    };

    const handleLike = async () => {
        try {
            const response = await fetch(`${API_URL}/photos/${photoId}/likes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userName: currentUser })
            });
            const data = await response.json();
            setIsLiked(data.liked);
            fetchPhotoStats(); // Refresh stats
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/photos/${photoId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: currentUser,
                    commentText: newComment
                })
            });
            await response.json();
            setNewComment('');
            fetchPhotoStats(); // Refresh stats
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-wedding-purple-light/20">
            {/* Interaction Bar */}
            <div className="flex items-center justify-between p-4 border-b border-wedding-purple-light/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-2 transition-colors"
                        disabled={isLoading}
                    >
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`${isLiked ? 'text-red-500' : 'text-wedding-purple-light'}`}
                        >
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                        </motion.div>
                        <span className="text-sm text-wedding-purple">
                            {stats.likes}
                        </span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 text-wedding-purple-light hover:text-wedding-purple transition-colors"
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm">{stats.comments.length}</span>
                    </button>

                    {challengeId && (
                        <div className="flex items-center gap-2 text-wedding-purple">
                            <span className="text-sm">Votes:</span>
                            <span className="font-medium">{stats.votes}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Comment List */}
                        <div className="max-h-60 overflow-y-auto p-4 space-y-4">
                            {stats.comments.map((comment) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-wedding-purple-light/20 flex items-center justify-center">
                                        <span className="text-wedding-purple text-sm">
                                            {comment.user_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-wedding-accent-light rounded-lg p-3">
                                            <p className="text-sm font-medium text-wedding-purple-dark">
                                                {comment.user_name}
                                            </p>
                                            <p className="text-sm text-wedding-purple">
                                                {comment.comment_text}
                                            </p>
                                        </div>
                                        <p className="text-xs text-wedding-purple-light mt-1">
                                            {new Date(comment.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleAddComment} className="p-4 border-t border-wedding-purple-light/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-wedding-accent-light rounded-full px-4 py-2 text-sm border-none focus:ring-2 focus:ring-wedding-purple"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isLoading}
                                    className="bg-wedding-purple text-white rounded-full p-2 hover:bg-wedding-purple-dark transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialFeatures;