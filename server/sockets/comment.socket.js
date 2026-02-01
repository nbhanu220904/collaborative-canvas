const Comment = require('../models/comment.model');
const logger = require('../utils/logger');

module.exports = (io, socket) => {
    // ADD COMMENT
    socket.on('add_comment', async (commentData) => {
        const roomId = socket.roomId;
        if (!roomId) return;

        try {
            const newComment = await Comment.add({ ...commentData, roomId });
            io.to(roomId).emit('comment_added', newComment);
            logger.info(`Comment added in ${roomId} by ${commentData.authorName}`);
        } catch (err) {
            logger.error('Failed to add comment:', err);
        }
    });

    // RESOLVE COMMENT
    socket.on('resolve_comment', async (commentId) => {
        const roomId = socket.roomId;
        if (!roomId || !commentId) return;

        try {
            await Comment.resolve(commentId);
            io.to(roomId).emit('comment_resolved', commentId);
            logger.info(`Comment resolved in ${roomId}: ${commentId}`);
        } catch (err) {
            logger.error('Failed to resolve comment:', err);
        }
    });
};
