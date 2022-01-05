import {UserType} from "./UserType";
import {Customer} from "./Customer";

export interface User {
    id: number
    username: string
    password: string
    userType: UserType
    customers: Customer[]
}