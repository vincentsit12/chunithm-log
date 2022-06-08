import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "./CustomAPIError";



export class UnauthenticatedError extends CustomAPIError {
    declare statusCode: StatusCodes
    constructor(message: string) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

