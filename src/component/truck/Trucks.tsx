import React, {useState} from "react";
import {Truck} from "../../model/Truck";
import {assign, Machine} from "xstate";
import axios from "axios";
import {useMachine} from "@xstate/react";
import {Alert, Button, Result, Spin, Table} from 'antd';
import ViewTruck from "./ViewTruck";
import AddEditTruck from "./AddEditTruck";

interface TruckProps {

}

const Trucks: React.FC<TruckProps> = () => {

    const [truckState, send] = useMachine(createTrucksMachine())
    const [truckId, setTruckId] = useState(0);
    const [addEditVisible, setAddEditVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);

    const refresh = () => {
        send({
            type: 'RETRY'
        })
    }

    const columns = [
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Marca',
            dataIndex: 'marca',
            key: 'marca',
        },
        {
            title: 'Volum',
            dataIndex: 'volum',
            key: 'volum',
        },
        {
            title: 'Greutate Tone',
            dataIndex: 'greutate_tone',
            key: 'greutate_tone',
        },
        {
            title: 'Edit',
            key: 'edit',
            render: (record: Truck) => (
                <Button type="primary" ghost onClick={
                    () => {
                        setTruckId(record.id)
                        setAddEditVisible(true)
                    }
                }> Edit </Button>
            )
        },
        {
            title: 'Delete',
            key: 'delete',
            render: (record: Truck) => (
                <Button danger onClick={
                    () => {
                        send({
                            type: 'DELETE', payload: {truckId: record.id}
                        })
                    }
                }> Delete </Button>
            )
        },
        {
            title: 'Detail',
            key: 'detail',
            render: (record: Truck) => (
                <Button onClick={() => {
                    setTruckId(record.id)
                    setDetailVisible(true)
                }
                }> Details </Button>
            )
        }
    ];
    return (
        <div>
            {truckState.matches('loadingtrucksData') && (
                <>
                    <Spin>
                        <Alert message="Please wait for loading" type="info"/>
                    </Spin>
                </>
            )}

            {truckState.matches('loadTrucksDataResolved') && (
                <>
                    <p className={"center_text"}>These are our truck options</p>
                    <Button type="primary" onClick={
                        () => {
                            setTruckId(0)
                            setAddEditVisible(true)
                        }
                    }>Add
                    </Button>
                    <Table dataSource={truckState.context.trucks} columns={columns}/>
                    <AddEditTruck key={truckId}
                                  truckId={truckId}
                                  visible={addEditVisible}
                                  onSubmit={() => setAddEditVisible(false)}
                                  onCancel={() => setAddEditVisible(false)}
                                  onRefresh={() => refresh()}
                    />
                    <ViewTruck key={truckId}
                               truckId={truckId}
                               visible={detailVisible}
                               onCancel={() => setDetailVisible(false)}
                    />
                </>
            )}

            {truckState.matches('loadtrucksDataRejected') && (
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
        </div>
    )

}

export default Trucks

interface TrucksMachineContext {
    trucks: Array<Truck>
}

interface TruckMachineSchema {
    context: TrucksMachineContext
    states: {
        loadingTrucksData: {}
        loadTrucksDataResolved: {}
        loadTrucksDataRejected: {}
        deletingTruckData: {}
    }
}

type TrucksMachineEvent = | { type: 'RETRY' } | { type: 'DELETE'; payload: { truckId: number } }

const createTrucksMachine = () => Machine<TrucksMachineContext, TruckMachineSchema, TrucksMachineEvent>(
    {
        id: 'trucks-machine',
        context: {
            trucks: []
        },
        initial: 'loadingTrucksData',
        on: {
            RETRY: 'loadingTrucksData'
        },
        states: {
            loadingTrucksData: {
                invoke: {
                    id: 'loadingTrucksData',
                    src: 'loadTruckData',
                    onDone: {
                        target: 'loadTrucksDataResolved',
                        actions: assign((context, event) => {
                            return {
                                trucks: event.data.data
                            }
                        })
                    },
                    onError: {
                        target: 'loadTrucksDataRejected'
                    }
                }
            },
            loadTrucksDataResolved: {
                on: {
                    RETRY: {
                        target: 'loadingTrucksData'
                    },
                    DELETE: {
                        target: 'deletingTruckData'
                    }
                }
            },
            loadTrucksDataRejected: {
                on: {
                    RETRY: {
                        target: 'loadingTrucksData'
                    }
                }
            },
            deletingTruckData: {
                invoke: {
                    id: 'deletingTruckData',
                    src: 'deleteTruckData',
                    onDone: {
                        target: 'loadingTrucksData'
                    },
                    onError: {
                        target: 'loadingTrucksData'
                    }
                }
            }
        }
    },
    {
        services: {
            loadTruckData: () => axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks`),
            deleteTruckData: (id, event) =>
                axios.delete(`http://${process.env.REACT_APP_SERVER_NAME}/trucks/${event.type !== 'RETRY' ? event.payload.truckId : 0}`)

        }
    }
)
