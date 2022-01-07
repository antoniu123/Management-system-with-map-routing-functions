import React, {useState} from "react";
import {assign, Machine} from "xstate";
import axios from "axios";
import {useMachine} from "@xstate/react";
import {Alert, Button, Modal, Result, Spin, Table} from 'antd';
import { TransportOffer } from "../../model/TransportOffer";
import moment from "moment";
import { ColumnProps } from "antd/lib/table";
import AddEditTransportOffer from "./AddEditTransportOffer"
import {UserContext} from "./../../App"


interface TransportOffersProps {

}

const TransportOffers: React.FC<TransportOffersProps> = () => {
    const userContext = React.useContext(UserContext)
    const [offerState, send] = useMachine(createTransportOfferMachine())
    const [offerId, setOfferId] = useState(0);
    const [addEditVisible, setAddEditVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);

    const refresh = () => {
            send({
                type: 'RETRY'
            })
        }
    const transportOffers = [ ...(offerState.context.transportOffers ?? []) ]

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
                               // {userContext?.user.username === 'TRANSPORTATOR' ?
                                setAddEditVisible(true)
                                // : setAddEditVisible(false)
                               // }
                            }
                        }
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
                        }
                    }> Delete </Button>
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
                                    }>Add
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