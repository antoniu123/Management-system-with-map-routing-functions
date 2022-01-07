import {Truck} from "./Truck";
import {Customer} from "./Customer";

export interface TransportOffer{
    id: number
    customer: Customer
    truck: Truck
    departureDate: Date
    departurePlace: string
    detail: string
}