import {StorageType} from "./StorageType";

export interface Storage {
    id: number
    weight: number
    volume: number
    storageType: StorageType
}