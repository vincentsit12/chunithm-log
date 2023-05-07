import { CustomAPIError } from "errors/CustomAPIError"
import { StatusCodes } from "http-status-codes"
import { NextApiRequest, NextApiResponse } from "next"

const withErrorHandler = (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {

        try {
            await handler(req, res)
        }
        catch (e) {
            console.log("🚀 ~ file: errorHandler.ts ~ line 12 ~ return ~ e", e)
            if (e instanceof CustomAPIError) {
                res.status(e.statusCode).send(e.message)
            }
            else res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('something went wrong')
        }
    }
}
export default withErrorHandler