import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.js'
import { addComment, deleteComment, getAllComment, getCommentById, updateComment } from '../controllers/Comment.js'

const router = Router()

router.use(verifyJWT)
router.route('/:videoId').get(getAllComment)
router.route('/add').post(addComment)
router.route('/get/:commentId').get(getCommentById)
router.route('/edit/:commentId').patch(updateComment)
router.route('/delete/:commentId').delete(deleteComment)

export default router