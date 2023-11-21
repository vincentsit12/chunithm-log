import { StatusCodes } from "http-status-codes"

export class CustomAPIError extends Error {
    declare statusCode: StatusCodes
    declare errorCode?: number
    constructor(message: string) {
        super(message)
    }
}

