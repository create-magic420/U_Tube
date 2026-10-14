import mongoose, { Schema } from "mongoose";

const likesSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: 'Video'
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

export const Like = mongoose.model('Like', likesSchema)