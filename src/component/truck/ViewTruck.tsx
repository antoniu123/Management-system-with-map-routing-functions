import React from "react";
import {useMachine} from "@xstate/react";
import {Button, Modal, Result, Spin,} from "antd";
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
                <>
                    <Spin/>
                </>
            )}

            {truckState.matches('loadTruckDone') && (
                <>
                    <Modal visible={visible} onCancel={() => onCancel()} footer={null}>
                         <div>
                             {truckState.context.truck.marca}
                         </div>
                    </Modal>
                </>
            )}

            {truckState.matches('loadtruckRejected') && (
                <>
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
                </>
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
                truck: {id: 0, marca: '', volum: 0, lungime_m: 0, latime_m: 0, inaltime_m: 0, greutate_tone: 0, pret_gol: 0}
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
        const truck = {id: 0, marca: '', volum: 0, lungime_m: 0, latime_m: 0, inaltime_m: 0, greutate_tone: 0, pret_gol: 0} as Truck
        return Promise.resolve(truck)
    } else
        return axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks/${id}`)
}