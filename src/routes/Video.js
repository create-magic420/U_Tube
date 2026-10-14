import { Router } from "express";
import { deleteVideo, getAllVideo, getVideoById, updateVideo, uploadVideo } from "../controllers/Video.js";
import { verifyJWT } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";

const router = Router()

router.route('/').get(verifyJWT, getAllVideo)
router.route('/upload').post(verifyJWT, upload.fields([
    {
        name: 'videoFile',
        maxCount: 1
    },
    {
        name: 'thumbnail',
        maxCount: 1
    }
]), uploadVideo)

router.route('/:videoId').get(verifyJWT, getVideoById)
router.route('/:videoId').patch(verifyJWT, upload.single('thumbnail'), updateVideo)
router.route('/:videoId').delete(verifyJWT, deleteVideo)

export default router