import { StatusCodes } from "http-status-codes"

export class CustomAPIError extends Error {
    declare statusCode : StatusCodes
    constructor(message: string) {
        super(message)
    }
}

