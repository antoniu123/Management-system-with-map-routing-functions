import React from "react";
import {useMachine} from "@xstate/react";
import {Button, Form, Input, message, Modal, Result, Spin,} from "antd";
import {assign, Machine} from "xstate";
import axios from "axios";
import {Truck} from "../../model/Truck";

const onOk = () => {
    message.success('saving done', 2)
}

const onError = () => {
    message.error('error at save', 2)
}

const onFinish = (values: any) => {
    console.log('Success:', values);
};

const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
};

interface AddEditTruckProps {
    truckId: number
    visible: boolean
    onSubmit: () => void
    onCancel: () => void
    onRefresh: () => void
}

const AddEditTruck: React.FC<AddEditTruckProps> = ({truckId, visible, onSubmit, onCancel, onRefresh}) => {

    const [truckState, send] = useMachine(
        createTruckMachine(
            truckId,
            onOk,
            onError,
            onSubmit,
            onCancel,
            onRefresh
        )
    )

    const titleModal = () => {
        return truckId === 0 ? 'Truck details' : 'Truck details for ' + truckState.context.truck.id
    }

    return (
        <>
            {truckState.matches('loadingTruck') && (
                <>
                    <Spin/>
                </>
            )}

            {truckState.matches('loadTruckResolved') && (
                <>
                    <div>
                        <Modal title={titleModal()}
                               visible={visible}
                               onOk={() => {
                                   send({
                                           type: 'SAVE',
                                           payload: {truck: truckState.context.truck}
                                       }
                                   )
                                   onSubmit()
                               }
                               }
                               onCancel={onCancel}

                        >
                            <Form
                                name="basic"
                                labelCol={{span: 8}}
                                wrapperCol={{span: 16}}
                                initialValues={{
                                    marca: truckState.context.truck.brand,
                                    volum: truckState.context.truck.volume,
                                    length_m: truckState.context.truck.length,
                                    width_m: truckState.context.truck.width,
                                    height_m: truckState.context.truck.height,
                                    weight_tone: truckState.context.truck.weight,
                                    pret_gol: truckState.context.truck.emptyPrice,
                                    pret_plin: truckState.context.truck.fullPrice
                                }}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                                autoComplete="off"
                            >
                                <Form.Item
                                    label="Brand"
                                    name="marca"
                                    rules={[{required: true, message: 'Please input marca'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.brand = e.target.value
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Volume"
                                    name="volum"
                                    rules={[{required: true, message: 'Please input volum'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.volume = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Length(m)"
                                    name="length"
                                    rules={[{required: true, message: 'Please input length'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.length = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Width(m)"
                                    name="width"
                                    rules={[{required: true, message: 'Please input width'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.width = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Height(m)"
                                    name="height"
                                    rules={[{required: true, message: 'Please input height'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.height = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Weight(m)"
                                    name="weight"
                                    rules={[{required: true, message: 'Please input weight'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.weight = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Price(EUR)"
                                    name="emptyPrice"
                                    rules={[{required: true, message: 'Please input kerb price'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.emptyPrice = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                                <Form.Item
                                    label="Price full(EUR)"
                                    name="fullPrice"
                                    rules={[{required: true, message: 'Please input full price'}]}
                                >
                                    <Input onChange={(e) => {
                                        e.preventDefault()
                                        truckState.context.truck.fullPrice = Number(e.target.value)
                                    }}/>
                                </Form.Item>

                            </Form>

                        </Modal>
                    </div>
                </>
            )}

            {truckState.matches('loadTruckRejected') && (
                <>
                    <Result
                        status="error"
                        title="Loading failed"
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

export default AddEditTruck

interface AddEditTruckMachineContext {
    truck: Truck
}

interface AddEditTruckMachineSchema {
    context: AddEditTruckMachineContext
    states: {
        loadingTruck: {}
        loadTruckResolved: {}
        loadTruckRejected: {}
        savingTruck: {}
    }
}

type AddEditTruckMachineEvent = | { type: 'RETRY' } | { type: 'SAVE'; payload: { truck: Truck } }

const createTruckMachine = (truckId: number,
                            onOk: () => void,
                            onError: () => void,
                            onSubmit: () => void,
                            onCancel: () => void,
                            onRefresh: () => void) =>
    Machine<AddEditTruckMachineContext, AddEditTruckMachineSchema, AddEditTruckMachineEvent>(
        {
            id: 'addedit-truck-machine',
            context: {
                truck: {
                    id: 0,
                    brand: '',
                    volume: 0,
                    length: 0,
                    width: 0,
                    height: 0,
                    weight: 0,
                    emptyPrice: 0,
                    fullPrice: 0
                }
            },
            initial: 'loadingTruck',
            states: {
                loadingTruck: {
                    invoke: {
                        id: 'loadingTruck',
                        src: 'loadTruck',
                        onDone: {
                            target: 'loadTruckResolved',
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
                loadTruckResolved: {
                    on: {
                        RETRY: {
                            target: 'loadingTruck'
                        },
                        SAVE: {
                            target: 'savingTruck'
                        }
                    }
                },
                loadTruckRejected: {
                    on: {
                        RETRY: {
                            target: 'loadingTruck'
                        }
                    }
                },
                savingTruck: {
                    invoke: {
                        id: 'savingTruck',
                        src: 'saveTruck',
                        onDone: {
                            actions: 'callOk'
                        },
                        onError: {
                            actions: 'callError'
                        }
                    }
                }
            }
        },
        {
            actions: {
                callOk: () => {
                    onOk()
                    onSubmit()
                    onRefresh()
                },
                callError: () => {
                    onError()
                    onCancel()
                    onRefresh()
                }
            },
            services: {
                loadTruck: () => getTruckById(truckId),
                saveTruck: (id, event) => {
                    if (event.type === 'SAVE')
                        if (truckId !== 0)
                            return axios.patch(`http://${process.env.REACT_APP_SERVER_NAME}/trucks/${truckId}`, event.payload.truck)
                        else
                            return axios.post(`http://${process.env.REACT_APP_SERVER_NAME}/trucks`, event.payload.truck)
                    else
                        return Promise.resolve(() => {

                        })
                }
            }
        }
    )

function getTruckById(id: number): Promise<Truck | string> {
    if (id === undefined || id === null) {
        return Promise.reject("some error")
    } else if (id === 0) {
        const truck = {
            id: 0,
            brand: '',
            volume: 0,
            length: 0,
            width: 0,
            height: 0,
            weight: 0,
            emptyPrice: 0,
            fullPrice: 0
        }
        return Promise.resolve(truck)
    } else
        return axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks/${id}`)
}