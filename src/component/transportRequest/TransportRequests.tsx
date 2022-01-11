import React, {useState} from "react"
import {assign, Machine} from "xstate"
import axios from "axios"
import {useMachine} from "@xstate/react"
import {Alert, Button, Result, Spin, Table} from 'antd';
import {TransportRequest} from "../../model/TransportRequest"
import {ColumnProps} from "antd/lib/table"
import AddEditTransportRequest from "./AddEditTransportRequest"
import {UserContext} from "../../App"

const TransportRequests: React.FC = () => {
    const userContext = React.useContext(UserContext)
    const [requestState, send] = useMachine(createTransportRequestMachine())
    const[requestId, setRequestId] = useState(0);
    const [addEditVisible, setAddEditVisible] = useState(false)

    const refresh = () => {
        send({
            type: 'RETRY'
        })
    }

    const columns: ColumnProps<TransportRequest>[] = [
          {
              title: '#',
              dataIndex: 'id',
              key: 'id',
          },
          {
              title: 'Storage',
              dataIndex: ["storage", "storageType", "name"],
              key: 'storage.id',
          },
          {
              title: 'Max departure date',
              dataIndex: 'maxDepartureDate',
              key: 'maxDepartureDate',
              ellipsis:true,
              width: 200,
          },
          {
              title: 'Max arrive date',
              dataIndex: 'maxArriveDate',
              key: 'maxArriveDate',
              ellipsis: true,
              width: 200,
          },
          {
              title: 'Leaving place',
              dataIndex: 'leavingPlace',
              key: 'leavingPlace',
              ellipsis: true,
              width: 400,
          },
          {
              title: 'Arriving place',
              dataIndex: 'arrivingPlace',
              key: 'arrivingPlace',
              ellipsis: true,
              width: 400,
          },
          {
              title: 'Details',
              dataIndex: 'detail',
              key: 'detail',
              ellipsis: true,
              width:200
          },
          {
              title: 'Edit',
              key: 'edit',
              render: (record: TransportRequest) => (
                  <Button type="primary" onClick={
                      () => {
                          setRequestId(record.id)
                          setAddEditVisible(true)
                      }} disabled = {userContext?.user.userType.name !== 'EXPEDITOR'}
                          >Edit</Button>
              )
          },
        {
            title: 'Delete',
            key: 'delete',
            render: (record: TransportRequest) => (
                <Button danger onClick={
                    () => {
                        send({
                            type: 'DELETE', payload: {requestId: record.id}
                        })
                    }} disabled={ userContext?.user.userType.name !== 'EXPEDITOR'} > Delete
                </Button>
            )
        }
      ];

    return (
        <>
            {requestState.matches('loadingTransportRequestData') && (
                <Spin>
                    <Alert message="Please wait for loading" type="info" />
                </Spin>
            )}

            {requestState.matches('loadTransportRequestResolved') && (
                <>
                    <p className={"center_text"}>These are requests options</p>
                    <Button type="primary" onClick={
                        () => {
                            setRequestId(0)
                            setAddEditVisible(true)
                        }
                    } disabled={userContext?.user.userType.name !== 'EXPEDITOR'}>Add
                    </Button>
                    <Table scroll={{ x: true }} dataSource={requestState.context.transportRequests} columns={columns} />
                    {addEditVisible &&
                        <AddEditTransportRequest key={requestId}
                                                 requestId={requestId}
                                                 visible={addEditVisible}
                                                 onSubmit={() => setAddEditVisible(false)}
                                                 onCancel={() => setAddEditVisible(false)}
                                                 onRefresh={() => refresh()}
                        />
                    }
                </>
            )}
            {requestState.matches('loadTransportRequestRejected') && (
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

export default TransportRequests

interface TransportRequestMachineContext {
    transportRequests: Array<TransportRequest>
}

interface TransportRequestMachineSchema {
    context: TransportRequestMachineContext
    states: {
        loadingTransportRequestData: {}
        loadTransportRequestResolved: {}
        loadTransportRequestRejected: {}
        deletingTransportRequestData: {}
    }
}

type TransportRequestMachineEvent = | {type: 'RETRY'} | {type: 'DELETE'; payload: { requestId: number} }

const createTransportRequestMachine = () => Machine<TransportRequestMachineContext, TransportRequestMachineSchema, TransportRequestMachineEvent>(
    {
        id: 'transportRequests-machine',
        context: {
            transportRequests: []
        },
        initial: 'loadingTransportRequestData',
        on: {
            RETRY: 'loadingTransportRequestData'
        },
        states: {
            loadingTransportRequestData: {
                invoke: {
                    id: 'loadingTransportRequestData',
                    src: 'loadTransportRequestData',
                    onDone: {
                        target: 'loadTransportRequestResolved',
                        actions: assign((context, event) => {
                            return {
                                transportRequests: event.data.data
                            }
                        })
                    },
                    onError: {
                        target: 'loadTransportRequestRejected'
                    }
                }
            },
            loadTransportRequestResolved: {
                on: {
                    RETRY: {
                        target: 'loadingTransportRequestData'
                    },
                    DELETE: {
                        target: 'deletingTransportRequestData'
                    }
                }
            },
            loadTransportRequestRejected: {
                on: {
                    RETRY: {
                        target: 'loadingTransportRequestData'
                    }
                }
            },
            deletingTransportRequestData: {
                invoke: {
                    id: 'deletingTransportRequestData',
                    src: 'deleteTransportRequestData',
                    onDone: {
                        target: 'loadingTransportRequestData'
                    },
                    onError: {
                        target: 'loadingTransportRequestData'
                    }
                }
            }
        }
    },
    {
        services: {
            loadTransportRequestData: () => axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/requests`),
            deleteTransportRequestData: (id, event) =>
                axios.delete(`http://${process.env.REACT_APP_SERVER_NAME}/requests/${event.type !== 'RETRY' ? event.payload.requestId : 0}`)
        }
    }
)