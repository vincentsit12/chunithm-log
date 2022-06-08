import axios from "axios";
import { Rating } from "types";


const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
    timeout: 10000,
});


instance.interceptors.response.use(
    function (response) {
        // Do something with response data
        return response;
    },
    function (error) {
        if (error.response?.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);

export function signUp(username: string, password: string) {
    return instance.post(`/user/signup`, {
        username, password
    })
}

export function getRatingList() {
    return instance.get<Rating[]>(`/record/rating`)
}