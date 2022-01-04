import { Customer } from "./Customer";
import { LocationPoint } from "./LocationPoint";
import { Truck } from "./Truck";
import { Storage } from "./Storage";

export interface Shipment {
    id: number
    truck: Truck
    customer: Customer
    storage: Storage
    dateStart: Date
    addressStart: string
    locationStart?: LocationPoint
    dateStop: Date
    addressStop: string
    locationStop?: LocationPoint
    distance?: number
    price?: number
}