import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../modals/video.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { User } from "../modals/user.js";

const getAllVideo = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10 } = req.query
    if (!userId) {   // future discuss about all present video
        throw new ApiError(400, 'userId required')
    }

    const pageNum = parseInt(page, 10)
    const pageLimit = parseInt(limit, 10)
    const skip = (pageNum - 1) * pageLimit

    const totalVideos = await Video.countDocuments({ owner: userId })

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('owner', 'username email')

    res.status(200)
        .json(
            new ApiResponse(200,
                {
                    videos,
                    total: totalVideos,
                    page: pageNum,
                    totalPages: Math.ceil(totalVideos / pageLimit)
                },
                'Video fetched successfully!')
        )
})

const uploadVideo = asyncHandler(async (req, res) => {
    const { description, title } = req.body

    if (!description || !title) {
        throw new ApiError(400, 'All fields are required')
    }

    const videoFileLocalPath = req?.files?.videoFile[0]?.path
    const thumbnailLocalPath = req?.files?.thumbnail[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, 'Video file is required')
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, 'Thumbnail is required')
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video) {
        throw new ApiError(401, 'Video file is required')
    }
    if (!thumbnail) {
        throw new ApiError(401, 'Thumbnail is required')
    }

    const createVideo = await Video.create({
        description,
        title,
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        duration: video?.duration,
        owner: req?.user._id
    })

    const getCreatedUser = await Video.findById(createVideo._id)
    console.log({ getCreatedUser });


    if (!getCreatedUser) {
        throw new ApiError(500, 'Something went wrong while uploading video')
    }
    return res.status(200)
        .json(
            new ApiResponse(200, getCreatedUser, 'Video created successfully!')
        )
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req?.user?._id

    if (!videoId) {
        throw new ApiError(400, 'videoId is required')
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(401, "User not found");
    }
    const alreadyWatched = user.watchHistory.some(id => id.toString() === videoId);

    let updateVideo = video

    if (!alreadyWatched) {
        user.watchHistory.push(videoId)
        await user.save()
        updateVideo = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } },
            { new: true }
        );
    }

    return res.status(200)
        .json(
            new ApiResponse(200, { data: updateVideo }, 'video fetched successfully')
        )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!videoId) {
        throw new ApiError(401, 'videoId is required')
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video does not exist')
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, 'Unauthrised Request')
    }

    if (!title || !description) {
        throw new ApiError(401, 'title and description is required')
    }

    const thumbnailLocalPath = req?.file?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(401, 'thumbnail is required')
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError(500, 'Something went wrong while uploading thumbnail.')
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail?.url
            },
        },
        { new: true }
    )

    return res.status(200).
        json(new ApiResponse(200, updateVideo, 'Video updated successfully'))
})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, 'videoId is required')
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }

    console.log('video=========>', video);



    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, 'Unauthrised Request')
    }

    await Video.findByIdAndDelete(videoId)

    res.status(200)
        .json(new ApiResponse(200, null, 'Video deleted successfully'))


})

export { getAllVideo, uploadVideo, getVideoById, updateVideo, deleteVideo }

// testing
// only update video owner
// only delete video owner