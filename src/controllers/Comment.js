import { Comment } from "../modals/comment.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!videoId) {
        throw new ApiError(400, 'videoId is required')
    }

    const pageNum = parseInt(page, 10)
    const pageLimit = parseInt(limit, 10)
    const skip = (pageNum - 1) * pageLimit
    const totalComment = await Comment.countDocuments({ video: videoId })

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('owner', 'username fullName avatar')

    return res.status(200)
        .json(
            new ApiResponse(200, {
                comments,
                total: totalComment,
                page: pageNum,
                totalPages: Math.ceil(totalComment / pageLimit)


            }, 'commennt fetch successfully')
        )

})

const addComment = asyncHandler(async (req, res) => {
    const { content, videoId } = req.body
    if (!content || !videoId) {
        throw new ApiError(400, 'content and video required')
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req?.user?._id
    })

    return res.status(200)
        .json(
            new ApiResponse(200, comment, 'Comment added successfully')
        )

})

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const { content } = req.body
    if (!content || !commentId) {
        throw new ApiError(400, 'content and commentId required')
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, 'Comment not found')
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized request')
    }

    comment.content = content

    await comment.save()

    return res.status(200)
        .json(
            new ApiResponse(200, comment, 'Comment updated successfully')
        )
})

const getCommentById = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, 'commentId is required')
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, 'Comment not found')
    }
    return res.status(200)
        .json(
            new ApiResponse(200, comment, 'Comment fetched successfully')
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, 'commentId required')
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, 'Comment not found')
    }
    console.log('comment.owner.equals(req.user._id)=====>', comment.owner.equals(req.user._id));

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, 'Unauthorized request')
    }

    await Comment.findByIdAndDelete(commentId)

    res.status(200)
        .json(
            new ApiResponse(200, null, 'Comment deleted successfully')
        )
})

export { getAllComment, addComment, updateComment, deleteComment, getCommentById }