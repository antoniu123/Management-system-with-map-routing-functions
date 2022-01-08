import React, {useState} from "react";
import {assign, Machine} from "xstate";
import axios from "axios";
import {useMachine} from "@xstate/react";
import {Alert, Button, Modal, Result, Spin, Table} from 'antd';
import { Shipment } from "../../model/Shipment";
import MapRoute from "../map/MapRoute";
import { LocationPoint } from "../../model/LocationPoint"
import AddEditShipment from "./AddEditShipment"
import moment from "moment";
import { AimOutlined, CarOutlined } from "@ant-design/icons";
import { ColumnProps } from "antd/lib/table";
import {UserContext} from "../../App";


const Shipments: React.FC = () => {

    const userContext = React.useContext(UserContext)
    const [shipmentState, send] = useMachine(createShipmentsMachine())
    const [shipmentId, setShipmentId] = useState(0);
    const [addEditVisible, setAddEditVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [mapProps, setMapProps] = useState({start: [0,0] as number[],
                                              end: [0,0] as number[], 
                                              startName: '', 
                                              endName: '',
                                              distance: 250,
                                              truckPosition: false,
                                              startDate: ''})
    const customersIds = userContext?.user.customers.map(s=>s.id)
    const shipmentList: Shipment[] = shipmentState.context.shipments
        .filter((s) => {
            if (userContext?.user.userType.name === 'ADMIN') {
                return true
            }
            if (userContext?.user.userType.name === 'TRANSPORTATOR') {
                return customersIds ? customersIds.includes(s.customer.id) : false
            }
            if (userContext?.user.userType.name === 'EXPEDITOR') {
                return customersIds ? customersIds.includes(s.customer.id) : false
            }
            return false
        })


    const refresh = () => {
        send({
            type: 'RETRY'
        })
    }

    const filterData = (data?: Array<Shipment>) => (formatter: any) => {
       if (!data) {
           return []
       }

       return data.map((item:Shipment) => item ? {
                                                   text: formatter(item),
                                                   value: formatter(item)
                                                 } 
                                               : {
                                                   text: '',
                                                   value: ''
                                                 }
        ).filter((o,i,arr)=> arr.findIndex((t)=> t.text === o.text) === i)
    }

    const shipments = [ ...(shipmentState.context.shipments ?? []) ]

    const columns: ColumnProps<Shipment>[] = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Map',
            key: 'id',
            render: (record: Shipment) => (
                <Button disabled={ !record.locationStart|| !record.locationStop } 
                    onClick={() => {
                        setShipmentId(record.id)
                        if (record.locationStart && record.locationStop){
                            setMapProps({
                                start: [record.locationStart.x, record.locationStart.y],
                                end: [record.locationStop.x, record.locationStop.y],
                                startName: record.addressStart,
                                endName: record.addressStop,
                                distance: record.distance ? record.distance : 250,
                                truckPosition: isOnTheWay(record),
                                startDate: isOnTheWay(record) ? record.dateStart.toString() : ''
                            })
                        }                    
                        setDetailVisible(true)
                    }
                }> 
                 {isOnTheWay(record) ? <CarOutlined/> : <AimOutlined/>}
                {isOnTheWay(record) ? `Truck Position` : `Route Detail`} 
                </Button>
            )
        },
        {
            title: 'Truck',
            dataIndex: ["truck","brand"],
            key: 'truck.id',
            sorter: (a:Shipment, b:Shipment) => a.truck.brand.localeCompare(b.truck.brand),
            filters: filterData(shipments)((s:Shipment) => s.truck.brand),
            onFilter: (value, record) => record.truck.brand === value
        },
        {
            title: 'Customer',
            dataIndex: ["customer","name"],
            key: 'customer.id',
            sorter: (a:Shipment, b:Shipment) => a.customer.name.localeCompare(b.customer.name),
            filters: filterData(shipments)((s:Shipment) => s.customer.name),
            onFilter: (value, record) => record.customer.name === value
        },
        {
            title: 'Storage',
            dataIndex: ["storage","storageType","name"],
            key: 'storage.id',
            width: 100
        },
        {
            title: 'Starting Date',
            dataIndex: 'dateStart',
            key: 'dateStart',
            ellipsis: true,
            width: 200
        },
        {
            title: 'Starting Address',
            dataIndex: 'addressStart',
            key: 'addressStart',
            ellipsis: true,
            width: 400
        },
        {
            title: 'Starting Long/Lat',
            dataIndex: "locationStart",
            key: 'locationStart',
            render: (value: LocationPoint, row: Shipment, index: number) =>{
            return value.x+'\r'+value.y
            },
            width: 200
        },
        {
            title: 'Arriving Date Limit',
            dataIndex: 'dateStop',
            key: 'dateStop',
            ellipsis: true,
            width: 200
        },
        {
            title: 'Stopping Address',
            dataIndex: 'addressStop',
            key: 'addressStop',
            ellipsis: true,
            width: 400
        },
        {
            title: 'Stopping Long/Lat',
            dataIndex: ["locationStop"],
            key: 'locationStop',
            render: (value: LocationPoint, row: Shipment, index: number) =>{
               return value.x+'\r'+value.y
            }
        },
        {
            title: 'Distance',
            dataIndex: 'distance',
            key: 'distance'
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price'
        },
        {
            title: 'Edit',
            key: 'edit',
            render: (record: Shipment) => (
                <Button type="primary" onClick={
                    () => {
                        setShipmentId(record.id)
                        setAddEditVisible(true)
                    }
                } 
                disabled={isOnTheWay(record) || userContext?.user.userType.name !== 'ADMIN'}
                > Edit</Button>
            )
        }
    ];
    return (
        <>
            {shipmentState.matches('loadingShipmentsData') && (
                <>
                    <Spin>
                        <Alert message="Please wait for loading" type="info"/>
                    </Spin>
                </>
            )}

            {shipmentState.matches('loadShipmentsDataResolved') && (
                <>
                    <p className={"center_text"}>These are shipments options</p>
                    <Button type="primary" onClick={
                        () => {
                            setShipmentId(0)
                            setAddEditVisible(true)
                        }
                    } disabled={userContext?.user.userType.name !== 'ADMIN'} >Add
                    </Button>
                    <Table scroll={{ x: true }} dataSource={shipmentList} columns={columns} />
                    {addEditVisible && 
                        <AddEditShipment key={shipmentId}
                                    shipmentId={shipmentId}
                                    visible={addEditVisible}
                                    onSubmit={() => setAddEditVisible(false)}
                                    onCancel={() => setAddEditVisible(false)}
                                    onRefresh={() => refresh()}
                        />
                    }
                   
                    
                    <Modal visible={detailVisible} footer={null} closable={true} onCancel={()=>setDetailVisible(false)} width={1200}>
                        
                        <MapRoute 
                          centerLongitude={(mapProps.start[0] + mapProps.end[0])/2} 
                          centerLatitude={(mapProps.start[1] + mapProps.end[1])/2} 
                          start={{x: mapProps.start[0], y: mapProps.start[1] }} 
                          end={{x: mapProps.end[0], y: mapProps.end[1] }} 
                          startName={mapProps.startName}
                          endName={mapProps.endName}
                          zoom={(7.5-(mapProps.distance/1000))}
                          truckPosition={mapProps.truckPosition}
                          startDate={mapProps.startDate}
                          />
                    </Modal>
                </>
            )}

            {shipmentState.matches('loadShipmentsDataRejected') && (
                <>
                    <Result
                        status="error"
                        title="Loading failed"
                        //description="Please check and modify the following information before resubmitting."
                        extra={<Button size="large" type="primary" onClick={() => {
                            send({
                                type: 'RETRY'
                            })
                        }}>Try Again</Button>}
                    />
                </>
            )}
        </>
    )

}

export default Shipments

interface ShipmentMachineContext {
    shipments: Array<Shipment>
}

interface ShipmentMachineSchema {
    context: ShipmentMachineContext
    states: {
        loadingShipmentsData: {}
        loadShipmentsDataResolved: {}
        loadShipmentsDataRejected: {}
    }
}

type ShipmentMachineEvent = | { type: 'RETRY' }

const createShipmentsMachine = () => Machine<ShipmentMachineContext, ShipmentMachineSchema, ShipmentMachineEvent>(
    {
        id: 'shipments-machine',
        context: {
            shipments: []
        },
        initial: 'loadingShipmentsData',
        on: {
            RETRY: 'loadingShipmentsData'
        },
        states: {
            loadingShipmentsData: {
                invoke: {
                    id: 'loadingShipmentsData',
                    src: 'loadShipmentsData',
                    onDone: {
                        target: 'loadShipmentsDataResolved',
                        actions: assign((context, event) => {
                            return {
                                shipments: event.data.data
                            }
                        })
                    },
                    onError: {
                        target: 'loadShipmentsDataRejected'
                    }
                }
            },
            loadShipmentsDataResolved: {
                on: {
                    RETRY: {
                        target: 'loadingShipmentsData'
                    }
                }
            },
            loadShipmentsDataRejected: {
                on: {
                    RETRY: {
                        target: 'loadingShipmentsData'
                    }
                }
            }
        }
    },
    {
        services: {
            loadShipmentsData: () => axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/shipments`)
        }
    }
)
function isOnTheWay(record: Shipment) {
    const currentDate: Date = moment.utc(new Date()).toDate()
    const startDate : Date = new Date(record.dateStart)
    const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
    const newStartDate = new Date(startDate.getTime() + userTimezoneOffset);
    const endDate : Date = new Date(record.dateStop)
    const newEndDate = new Date(endDate.getTime() + userTimezoneOffset);
    return currentDate > newStartDate && currentDate < newEndDate;
}

