import { Router } from "express";
import { accountUpdate, changePassword, getChannelProfile, getCurrentUser, getWatchHistory, loginUser, refreshAccessToken, registerUser, updateAvatar, updateCoverImg } from "../controllers/User.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router()

router.route('/register').post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImg',
        maxCount: 1
    }
]), registerUser)

router.route('/login').post(loginUser)


// secured routes

router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/update-account').patch(verifyJWT, accountUpdate)
router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateAvatar)
router.route('/coverImage').patch(verifyJWT, upload.single('coverImg'), updateCoverImg)
router.route('/channel/:username').get(verifyJWT, getChannelProfile)
router.route('/watch-history').get(verifyJWT, getWatchHistory)
export default router