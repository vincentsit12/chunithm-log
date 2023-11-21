import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "./CustomAPIError";



export class BadRequestError extends CustomAPIError {
    declare statusCode: StatusCodes
    constructor(message: string, errorCode?: number) {
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
        this.errorCode = errorCode
    }
}

