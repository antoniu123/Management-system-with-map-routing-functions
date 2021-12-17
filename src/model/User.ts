import {UserType} from "./UserType";

export interface User {
    id: number
    username: string
    password: string
    userType: UserType
}