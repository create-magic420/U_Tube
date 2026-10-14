import mongoose, { Aggregate } from "mongoose";
import { Like } from "../modals/like.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pipeline } from "stream";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const isExist = await Like.findOne({ video: videoId, likedBy: req.user._id })
    let isLike
    if (isExist) {
        await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id })
        isLike = false
    } else {
        await Like.create(
            {
                video: videoId,
                likedBy: req.user._id
            }
        )
        isLike = true
    }

    const totalLike = await Like.countDocuments({ video: videoId })

    return res.status(200)
        .json(
            new ApiResponse(200, { isLike, totalLike }, "Like toggle successfully")
        )
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    const isExist = await Like.findOne({ comment: commentId, likedBy: req.user._id })
    let isLike
    if (isExist) {
        await Like.findOneAndDelete({ comment: commentId, likedBy: req.user._id })
        isLike = false
    } else {
        await Like.create(
            {
                comment: commentId,
                likedBy: req.user._id
            }
        )
        isLike = true
    }

    const totalLike = await Like.countDocuments({ comment: commentId })

    return res.status(200)
        .json(
            new ApiResponse(200, { isLike, totalLike }, "Successfull")
        )
})

const getLikedVideo = asyncHandler(async (req, res) => {

    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(String(userId))
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'video',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first:
                                    '$owner'
                            }
                        }
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                            owner: 1
                        }
                    }
                ]

            }
        },
        // working as rest operator, video is aray [{}] change into {} and also remove empty array, means deleted video
        {
            $unwind: '$video'
        },
        {
            $replaceRoot: {
                newRoot: '$video'
            }
        },
        {
            $sort: { createdAt: -1 }
        }

    ])

    return res.status(200)
        .json(new ApiResponse(200, likedVideos, 'Liked videos fetched successfully'))

})

