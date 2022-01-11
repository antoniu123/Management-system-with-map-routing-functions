import React from "react";
import {useMachine} from "@xstate/react";
import {Button, Form, Input, message, Modal, Result, Select, Spin, DatePicker, Row, Col, Card} from "antd";
import {assign, Machine} from "xstate";
import axios from "axios";
import {TransportRequest} from "../../model/TransportRequest";
import { Storage } from "../../model/Storage";
import moment from "moment";
import {getLocationFromAddress} from "../../shared/getLocationFromAddress";

const { Option } = Select;

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

interface AddEditTransportRequestProps {
    requestId: number
    visible: boolean
    onSubmit: () => void
    onCancel: () => void
    onRefresh: () => void
}

const AddEditTransportRequest: React.FC<AddEditTransportRequestProps> = ({requestId, visible, onSubmit, onCancel, onRefresh}) => {
    const [form] = Form.useForm();

    const submit = () => {
        for (const storage of requestState.context.storages) {
            if(storage.id === form.getFieldValue("storageId")) {
                requestState.context.request.storage = storage
            }
        }

        const myTransportRequest : TransportRequest = {
            ...requestState.context.request,
            maxDepartureDate: form.getFieldValue("maxDepartureDate"),
            maxArriveDate: form.getFieldValue("maxArriveDate"),
            leavingPlace: form.getFieldValue("leavingPlace"),
            arrivingPlace: form.getFieldValue("arrivingPlace"),
            detail: form.getFieldValue("detail"),
        }

        requestState.context.request = myTransportRequest

        send({
            type: 'SAVE',
            payload: {request: requestState.context.request}
        })
    }

    const [requestState, send] = useMachine(
        createTransportRequestMachine(
            requestId,
            onOk,
            onError,
            onSubmit,
            onCancel,
            onRefresh
        )
    )

    const titleModal = () => {
        return requestId === 0 ? 'Request details' : 'Request details for id :' + requestId
    }

    return (
        <>
            {requestState.matches('loadingTransportRequest') && (
                <>
                    <Spin/>
                </>
            )}
            {requestState.matches('loadTransportRequestResolved') && (
                <Modal title={titleModal()}
                    visible={visible}
                    onOk={submit}
                    onCancel={onCancel}
                    width={800}
                >
                    <Form
                        name="basic"
                        form={form}
                        labelCol={{span: 8}}
                        wrapperCol={{span: 16}}
                        initialValues={{
                            id: requestState.context.request.id,
                            //customerId: requestState.context.request.user && requestState.context.request.user.id ? requestState.context.request.user.id : 0,
                            storageId: requestState.context.request.storage && requestState.context.request.storage.id ? requestState.context.request.storage.id: 0,
                            maxDepartureDate: moment.utc(requestState.context.request.maxDepartureDate),
                            maxArriveDate: moment.utc(requestState.context.request.maxArriveDate),
                            leavingPlace: requestState.context.request.leavingPlace,
                            arrivingPlace: requestState.context.request.arrivingPlace
                        }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <Card title="Information related">
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                                    <Form.Item
                                        label="Storage"
                                        name="storageId"
                                        rules={[{required: true, message: 'Please input the storage!'}]}
                                    >
                                        <Select>
                                            {requestState.context.storages.map((storage, index) => {
                                                return (
                                                    <Option key={index} value={storage.id}>
                                                        {storage.storageType.name}
                                                    </Option>
                                                );
                                            })}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={13}>
                                    <Form.Item
                                        name="maxDepartureDate"
                                        label="Departure date"
                                        rules={[{required: true, message: 'Please input the departure date!'}]}
                                    >
                                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={13}>
                                    <Form.Item
                                        name="maxArriveDate"
                                        label="Arriving date"
                                        rules={[{required: true, message: 'Please input the arriving date!'}]}
                                    >
                                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                    <Form.Item
                                        label="Leaving place"
                                        name="leavingPlace"
                                        rules={[{required: true, message: 'Please input leaving address'}]}
                                    >
                                        <Input onChange={async (e) => {
                                            e.preventDefault()
                                            requestState.context.request.leavingPlace = e.target.value
                                            if (e.target.value.length>2) {
                                                const startLocation : number[] = await getLocationFromAddress(requestState.context.request.leavingPlace)
                                                form.setFieldsValue({"locationStart": {x: startLocation[0],
                                                        y: startLocation[1]}
                                                })
                                                form.setFieldsValue({"xStart": startLocation[0]})
                                                form.setFieldsValue({"yStart": startLocation[1]})
                                            }
                                        }}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                    <Form.Item
                                        label="Arriving place"
                                        name="arrivingPlace"
                                        rules={[{required: true, message: 'Please input arriving address'}]}
                                    >
                                        <Input onChange={async (e) => {
                                            e.preventDefault()
                                            requestState.context.request.arrivingPlace = e.target.value
                                            if (e.target.value.length>2) {
                                                const startLocation : number[] = await getLocationFromAddress(requestState.context.request.arrivingPlace)
                                                form.setFieldsValue({"locationStart": {x: startLocation[0],
                                                        y: startLocation[1]}
                                                })
                                                form.setFieldsValue({"xStart": startLocation[0]})
                                                form.setFieldsValue({"yStart": startLocation[1]})
                                            }
                                        }}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                    <Form.Item
                                        label="Details"
                                        name="detail"
                                        rules={[{required: false, message: 'Please input start address'}]}
                                    >
                                        <Input onChange={async (e) => {
                                            e.preventDefault()
                                            requestState.context.request.detail = e.target.value
                                        }}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Form>
                </Modal>
            )}
            {requestState.matches('loadTransportRejected') && (
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

export default AddEditTransportRequest

interface AddEditTransportRequestMachineContext {
    request: TransportRequest,
    storages: Storage[],
}

interface AddEditTransportRequestMachineSchema {
    context: AddEditTransportRequestMachineContext
    states: {
        loadingTransportRequest: {}
        loadTransportRequestResolved: {}
        loadTransportRequestRejected: {}
        savingTransportRequest: {}
    }
}

type AddEditTransportRequestMachineEvent = | { type: 'RETRY' } | { type: 'SAVE'; payload: { request: TransportRequest } }

const createTransportRequestMachine = (requestId: number,
                                     onOk: () => void,
                                     onError: () => void,
                                     onSubmit: () => void,
                                     onCancel: () => void,
                                     onRefresh: () => void) =>
    Machine<AddEditTransportRequestMachineContext, AddEditTransportRequestMachineSchema, AddEditTransportRequestMachineEvent>(
        {
            id: 'addedit-transportRequest-machine',
            context: {
                request: {} as TransportRequest,
                storages: [] as Storage[],
                //customers: [] as Customer[],
            },
            initial: 'loadingTransportRequest',
            states: {
                loadingTransportRequest: {
                    invoke: {
                        id: 'loadingTransportRequest',
                        src: 'loadData',
                        onDone: {
                            target: 'loadTransportRequestResolved',
                            actions: assign((_, event) => {
                                if (event.data[0].data) { //edit flow
                                    return {
                                        request: event.data[0].data,
                                        storages: event.data[1].data,
                                        //customers: event.data[2].data
                                    }
                                }
                                //add flow
                                return {
                                    request: event.data[0],
                                    storages: event.data[1].data,
                                    //customers: event.data[2].data
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
                            target: 'loadingTransportRequest'
                        },
                        SAVE: {
                            target: 'savingTransportRequest'
                        }
                    }
                },
                loadTransportRequestRejected: {
                    on: {
                        RETRY: {
                            target: 'loadingTransportRequest'
                        }
                    }
                },
                savingTransportRequest: {
                    invoke: {
                        id: 'savingTransportRequest',
                        src: 'saveTransportRequest',
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
                loadData: () => Promise.all([
                    getRequestbyId(requestId),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/storages`),
                    //axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/customers`)
                ]),
                saveTransportRequest: (id, event) => {
                    if (event.type === 'SAVE')
                        if (requestId !== 0)
                            return axios.patch(`http://${process.env.REACT_APP_SERVER_NAME}/requests/${requestId}`, event.payload.request)
                        else
                            return axios.post(`http://${process.env.REACT_APP_SERVER_NAME}/requests`, event.payload.request)
                    else
                        return Promise.resolve(() => {

                        })
                }
            }
        }
    )

function getRequestbyId(id_req: number): Promise<TransportRequest | string> {
    if (id_req === undefined || id_req === null) {
        return Promise.reject("some error")
    } else if (id_req === 0) {
        const request = {
            id: 0,
            storage: {
                id: 0,
                weight: 0,
                volume: 0,
                storageType: {
                    id: 0,
                    name: ''
                }
            },
            maxDepartureDate: new Date(),
            maxArriveDate: new Date(),
            leavingPlace: '',
            arrivingPlace: '',
            detail: '',
        } as TransportRequest
        return Promise.resolve(request)
    } else
        return axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/requests/${id_req}`)
}