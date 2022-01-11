import {User} from "./User";
import {Storage} from "./Storage";

export interface TransportRequest{
    id: number
    user: User
    storage: Storage
    maxDepartureDate: Date
    maxArriveDate: Date
    leavingPlace: string
    arrivingPlace: string
    detail: string
}