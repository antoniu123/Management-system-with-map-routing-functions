import React from "react";
import {useMachine} from "@xstate/react";
import {Image, Button, Modal, Result, Spin, Row } from "antd";
import {assign, Machine} from "xstate";
import axios from "axios";
import {Truck} from "../../model/Truck";

interface ViewTruckProps {
    truckId: number
    visible: boolean
    onCancel: () => void
}

const ViewTruck: React.FC<ViewTruckProps> = ({truckId, visible, onCancel}) => {

    const [truckState, send] = useMachine(
        createTruckViewMachine(
            truckId
        )
    )

    return (
        <>
            {truckState.matches('loadingTruck') && (
                <div>
                    <Spin/>
                </div>
            )}

            {truckState.matches('loadTruckDone') && (
                <div>
                    <Modal visible={visible} onCancel={() => onCancel()} footer={null}>
                         <div>
                            <Row style={{width: '100%', justifyContent: 'center'}}>
                                <p>
                                    {truckState.context.truck.brand}
                                </p>
                            </Row>
                            <Row style={{width: '100%', justifyContent: 'center'}}>
                                <Image
                                        width="320px"
                                        height="180px"
                                        src={process.env.PUBLIC_URL + '/' + truckState.context.truck.image}
                                        alt={truckState.context.truck.image}
                                    />                               
                            </Row>
                         </div>
                    </Modal>
                </div>
            )}

            {truckState.matches('loadtruckRejected') && (
                <div>
                    <Modal visible={visible} onCancel={() => onCancel()} footer={null}>
                        <Result
                            status="error"
                            title="Loading failed"
                            extra={<Button size="large" type="primary" onClick={() => {
                                send({
                                    type: 'RETRY'
                                })
                            }}>Try Again</Button>}
                        />
                    </Modal>
                </div>
            )}
        </>
    )

}

export default ViewTruck

interface ViewTruckMachineContext {
    truck: Truck
}

interface ViewTruckMachineSchema {
    context: ViewTruckMachineContext
    states: {
        loadingTruck: {}
        loadTruckDone: {}
        loadTruckRejected: {}
    }
}

type ViewTruckMachineEvent = | { type: 'RETRY' } | { type: 'TOOGLE' }

const createTruckViewMachine = (truckId: number) =>
    Machine<ViewTruckMachineContext, ViewTruckMachineSchema, ViewTruckMachineEvent>(
        {
            id: 'view-truck-machine',
            context: {
                truck: {id: 0, brand: '', volume: 0, length: 0, width: 0, height: 0, weight: 0, emptyPrice: 0, fullPrice: 0}
            },
            initial: 'loadingTruck',
            states: {
                loadingTruck: {
                    invoke: {
                        id: 'loadingTruck',
                        src: 'loadTruck',
                        onDone: {
                            target: 'loadTruckDone',
                            actions: assign((context, event) => {
                                if (event.data.data)
                                    return {
                                        truck: event.data.data
                                    }
                                else
                                    return {
                                        truck: event.data
                                    }

                            })
                        },
                        onError: {
                            target: 'loadTruckRejected'
                        }
                    }
                },
                loadTruckDone: {
                    on: {
                        RETRY: {
                            target: 'loadingTruck'
                        }
                    }
                },
                loadTruckRejected: {
                    on: {
                        RETRY: {
                            target: 'loadingTruck'
                        }
                    }
                }
            }
        },
        {
            services: {
                loadTruck: () => getTruckById(truckId)
            }
        }
    )

function getTruckById(id: number): Promise<Truck | string> {
    if (id === undefined || id === null) {
        return Promise.reject("some error")
    } else if (id === 0) {
        const truck = {id: 0, brand: '', volume: 0, length: 0, width: 0, height: 0, weight: 0, emptyPrice: 0, fullPrice: 0} as Truck
        return Promise.resolve(truck)
    } else
        return axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks/${id}`)
}