import { CustomAPIError } from "errors/CustomAPIError"
import { StatusCodes } from "http-status-codes"
import { NextApiRequest, NextApiResponse } from "next"

const withErrorHandler = (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {

        try {
            await handler(req, res)
        }
        catch (e) {
            console.error("🚀 ~ file: errorHandler.ts ~ line 12 ~ return ~ e", e)
            if (e instanceof CustomAPIError) {
                res.status(e.statusCode).send({ message: e.message, errorCode: e.errorCode })
            }
            else res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'something went wrong' })
        }
    }
}
export default withErrorHandler