import {User} from "./User";
import {Truck} from "./Truck";

export interface TransportOffer{
    id: number
    user: User
    truck: Truck
    departureDate: Date
    departurePlace: String
    detail: String
}