import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../modals/user.js";
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and referesh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body || {}

    if ([username, email, fullName, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'All fields are required')
    }

    const isExist = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (isExist) {
        throw new ApiError(409, 'User with email or username already exists')
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path
    let coverImgLocalPath

    if (req.files && Array.isArray(req.files.coverImg) && req.files.coverImg.length > 0) {
        coverImgLocalPath = req.files.coverImg[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImg = await uploadOnCloudinary(coverImgLocalPath)


    if (!avatar) {
        throw new ApiError(400, 'Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url,
        coverImg: coverImg?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered successfully')
    )
})




const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, 'username or email is required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, 'User with email or username not exists')
    }


    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid user credentials')
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select('-refreshToken -password')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, 'User logged in successfully')
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, 'Unauthorised token')
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        console.log({ decodedToken });

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used')
        }

        const { refreshToken, accessToken } = await generateAccessTokenAndRefreshToken(user?._id)
        const option = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie('accessToken', accessToken, option)
            .cookie('refreshToken', refreshToken, option)
            .json(
                new ApiResponse(200, { refreshToken, accessToken }, 'Access token refreshed')
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')
    }

})

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current password and new password is required')
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid current password ')
    }

    user.password = newPassword

    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password changed successfully!')
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'))
})


const accountUpdate = asyncHandler(async (req, res) => {

    const { email, fullName } = req.body

    if (!email || !fullName) {
        throw new ApiError(400, 'All fields are required')
    }

    const isExist = await User.findOne({ email });

    if (isExist) {
        throw new ApiError(409, 'User with this email already exists')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullName
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Account updated successfully!'))
})


const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.url) {
        throw new ApiError(400, 'Error while uploading avatar')
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar updated successfully!'))
})

const updateCoverImg = asyncHandler(async (req, res) => {
    const coverImgLocalPath = req.file?.path

    if (!coverImgLocalPath) {
        throw new ApiError(400, 'Cover image  is required')
    }

    const coverImg = await uploadOnCloudinary(coverImgLocalPath)

    if (!coverImg?.url) {
        throw new ApiError(400, 'Error while uploading cover image')
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImg: coverImg?.url
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Cover image updated successfully!'))
})


const getChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, 'username is missing')
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers'
                },
                subscribedToCount: {
                    $size: '$subscribedTo'
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false
                    }

                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImg: 1,
                email: 1
            }
        }
    ])

    console.log('aggregate return type data', channel);

    if (!channel?.length) {
        throw new ApiError(400, 'channel does not exists')
    }
    res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], 'User channel fetched successfully!')
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(req?.user?._id))
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
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
                                        fullName: 1,
                                        avatar: 1,
                                        username: 1
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner'
                            }
                        }
                    }
                ]
            },
        }
    ])

    res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, 'Watch history fetched successfully!')
        )

})

export {
    registerUser, loginUser, refreshAccessToken, changePassword, getCurrentUser,
    accountUpdate, updateAvatar, updateCoverImg, getChannelProfile, getWatchHistory
}