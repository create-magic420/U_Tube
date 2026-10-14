const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {

            const statusCode = (error.code && error.code >= 100 && error.code < 600)
                ? error.code
                : 500;
            res.status(statusCode || 500).json({
                success: false,
                message: error.message
            })
        }
    }
}
export { asyncHandler }