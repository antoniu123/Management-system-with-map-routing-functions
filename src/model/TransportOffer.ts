import {User} from "./User";
import {Truck} from "./Truck";

export interface TransportOffer{
    id: number
    truck: Truck
    departureDate: Date
    departurePlace: string
    detail: string
}