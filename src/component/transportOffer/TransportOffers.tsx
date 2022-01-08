import React, {useState} from "react"
import {assign, Machine} from "xstate"
import axios from "axios"
import {useMachine} from "@xstate/react"
import {Alert, Button, Result, Spin, Table} from 'antd';
import { TransportOffer } from "../../model/TransportOffer"
import { ColumnProps } from "antd/lib/table"
import AddEditTransportOffer from "./AddEditTransportOffer"
import {UserContext} from "../../App"
import AddShipmentFromOffer from "./AddShipmentFromOffer"
import {Truck} from "../../model/Truck"
import {Customer} from "../../model/Customer"
import {PaperClipOutlined} from "@ant-design/icons";


const TransportOffers: React.FC = () => {
    const userContext = React.useContext(UserContext)
    const [offerState, send] = useMachine(createTransportOfferMachine())
    const [offerId, setOfferId] = useState(0);
    const [addEditVisible, setAddEditVisible] = useState(false)
    const [mapProps, setMapProps] = useState({truck: {} as Truck,
        customer: {} as Customer,
        departureDate: new Date(),
        departurePlace: ''})
    const [addShipmentVisible, setAddShipmentVisible] = useState(false)

    const refresh = () => {
            send({
                type: 'RETRY'
            })
    }

    function deleteOffer(offerId: number) {
        send ( {type: 'DELETE', payload: { offerId: offerId } })
    }

    const columns: ColumnProps<TransportOffer>[] = [
            {
                title: '#',
                dataIndex: 'id',
                key: 'id',
            },
            {
                title: 'Customer',
                dataIndex: ["customer","name"],
                key: 'customer.id'
            },
            {
                title: 'Truck',
                dataIndex: ["truck","brand"],
                key: 'truck.id',
            },
            {
                title: 'Departure Date',
                dataIndex: 'departureDate',
                key: 'departureDate',
                ellipsis: true,
                width: 200
            },
            {
                title: 'Departure Place',
                dataIndex: 'departurePlace',
                key: 'departurePlace',
                ellipsis: true,
                width: 400
            },
             {
                title: 'Details',
                dataIndex: 'detail',
                key: 'detail',
                ellipsis: true,
                width: 200
            },
            {
                    title: 'Edit',
                    key: 'edit',
                    render: (record: TransportOffer) => (
                        <Button type="primary" onClick={
                            () => {
                                setOfferId(record.id)
                                setAddEditVisible(true)
                            }}
                            disabled = { userContext?.user.userType.name !== 'TRANSPORTATOR'}
                        > Edit</Button>
                    )
            },
            {
                title: 'Delete',
                key: 'delete',
                render: (record: TransportOffer) => (
                    <Button danger onClick={
                        () => {
                            send({
                                type: 'DELETE', payload: {offerId: record.id}
                            })
                        }}
                        disabled = { userContext?.user.userType.name !== 'TRANSPORTATOR'} > Delete </Button>
                )
            },
            {
                title: 'Shipment',
                key: 'create',
                render: (record: TransportOffer) => (
                    <Button type="primary" shape="round" icon={<PaperClipOutlined />} onClick={
                        () => {
                            setOfferId(record.id)
                            setMapProps({
                                truck: record.truck,
                                customer: record.customer,
                                departureDate: record.departureDate,
                                departurePlace: record.departurePlace
                            })
                            setAddShipmentVisible(true)
                            deleteOffer(offerId)
                        }} disabled = { userContext?.user.userType.name === 'TRANSPORTATOR'} > Create Shipment </Button>
                )
            }
    ];



    return (
            <>
                {offerState.matches('loadingTransportOfferData') && (
                    <>
                        <Spin>
                            <Alert message="Please wait for loading" type="info"/>
                        </Spin>
                    </>
                )}

                {offerState.matches('loadTransportOfferResolved') && (
                                <>
                                    <p className={"center_text"}>These are offers options</p>
                                    <Button type="primary" onClick={
                                        () => {
                                            setOfferId(0)
                                            setAddEditVisible(true)
                                        }
                                    } disabled = { userContext?.user.userType.name !== 'TRANSPORTATOR'} >Add
                                    </Button>
                                    <Table scroll={{ x: true }} dataSource={offerState.context.transportOffers} columns={columns} />
                                    {addEditVisible &&
                                        <AddEditTransportOffer key={offerId}
                                                    offerId={offerId}
                                                    visible={addEditVisible}
                                                    onSubmit={() => setAddEditVisible(false)}
                                                    onCancel={() => setAddEditVisible(false)}
                                                    onRefresh={() => refresh()}
                                        />
                                    }
                                    {addShipmentVisible &&
                                    <AddShipmentFromOffer key={offerId}
                                                          offerId={offerId}
                                                     visible={addShipmentVisible}
                                                     onSubmit={() => setAddShipmentVisible(false)}
                                                     onCancel={() => setAddShipmentVisible(false)}
                                                     onRefresh={() => refresh()}
                                                      customer={mapProps.customer}
                                                      departureDate={mapProps.departureDate}
                                                      departurePlace={mapProps.departurePlace}
                                                      truck={mapProps.truck}
                                    />
                                    }
                                </>
                )}

                {offerState.matches('loadTransportOfferRejected') && (
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
export default TransportOffers

interface TransportOfferMachineContext {
    transportOffers: Array<TransportOffer>
}

interface TransportOfferMachineSchema {
    context: TransportOfferMachineContext
    states: {
        loadingTransportOfferData: {}
        loadTransportOfferResolved: {}
        loadTransportOfferRejected: {}
        deletingTransportOfferData: {}
    }
}

type TransportOfferMachineEvent = | { type: 'RETRY' } | { type: 'DELETE'; payload: { offerId: number } }

const createTransportOfferMachine = () => Machine<TransportOfferMachineContext, TransportOfferMachineSchema, TransportOfferMachineEvent>(
    {
        id: 'transportOffers-machine',
        context: {
            transportOffers: []
        },
        initial: 'loadingTransportOfferData',
        on: {
            RETRY: 'loadingTransportOfferData'
        },
        states: {
            loadingTransportOfferData: {
                invoke: {
                    id: 'loadingTransportOfferData',
                    src: 'loadTransportOfferData',
                    onDone: {
                        target: 'loadTransportOfferResolved',
                        actions: assign((context, event) => {
                            return {
                                transportOffers: event.data.data
                            }
                        })
                    },
                    onError: {
                        target: 'loadTransportOfferRejected'
                    }
                }
            },
            loadTransportOfferResolved: {
                on: {
                    RETRY: {
                        target: 'loadingTransportOfferData'
                    },
                    DELETE: {
                        target: 'deletingTransportOfferData'
                    }
                }
            },
            loadTransportOfferRejected: {
                on: {
                    RETRY: {
                        target: 'loadingTransportOfferData'
                    }
                }
            },
            deletingTransportOfferData: {
                invoke: {
                    id: 'deletingTransportOfferData',
                    src: 'deleteTransportOfferData',
                    onDone: {
                        target: 'loadingTransportOfferData'
                    },
                    onError: {
                        target: 'loadingTransportOfferData'
                    }
                }
            }
        }
    },
    {
        services: {
            loadTransportOfferData: () => axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/offers`),
            deleteTransportOfferData: (id, event) =>
                axios.delete(`http://${process.env.REACT_APP_SERVER_NAME}/offers/${event.type !== 'RETRY' ? event.payload.offerId : 0}`)
        }
    }
)