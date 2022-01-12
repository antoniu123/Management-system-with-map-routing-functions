import React from "react";
import {useMachine} from "@xstate/react";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Result,
    Select,
    Spin,
    DatePicker,
    Row,
    Col,
    Card,
    notification
} from "antd";
import {assign, Machine} from "xstate";
import axios from "axios";
import {TransportOffer} from "../../model/TransportOffer";
import { Truck } from "../../model/Truck";
import moment from "moment";
import { getLocationFromAddress } from "../../shared/getLocationFromAddress";
import { Customer } from "../../model/Customer";
import {SmileOutlined} from "@ant-design/icons";


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

interface AddEditTransportOfferProps {
    offerId: number
    visible: boolean
    onSubmit: () => void
    onCancel: () => void
    onRefresh: () => void
}


const AddEditTransportOffer: React.FC<AddEditTransportOfferProps> = ({offerId, visible, onSubmit, onCancel, onRefresh}) => {

    const [form] = Form.useForm();


    const submit = () => {

        for (const truck of offerState.context.trucks){
            if(truck.id === form.getFieldValue("truckId")){
                offerState.context.offer.truck = truck
            }
        }

        for (const customer of offerState.context.customers){
                    if(customer.id === form.getFieldValue("customerId")){
                        offerState.context.offer.customer = customer
                    }
                }

        const myTransportOffer : TransportOffer = {
            ...offerState.context.offer,
            departureDate: form.getFieldValue("departureDate"),
            departurePlace: form.getFieldValue("departurePlace"),
            detail: form.getFieldValue("detail")
        }

        offerState.context.offer = myTransportOffer

        send({
            type: 'SAVE',
            payload: {offer: offerState.context.offer}
        })
    }

    const [offerState, send] = useMachine(
        createTransportOfferMachine(
            offerId,
            onOk,
            onError,
            onSubmit,
            onCancel,
            onRefresh
        )
    )

    const titleModal = () => {
            return offerId === 0 ? 'Offer details' : 'Offer details for id :' + offerId
        }


    return (
        <>
            {offerState.matches('loadingTransportOffer') && (
                <>
                    <Spin/>
                </>
            )}

            {offerState.matches('loadTransportOfferResolved') && (

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
                                   id: offerState.context.offer.id,
                                   truckId: offerState.context.offer.truck && offerState.context.offer.truck.id ? offerState.context.offer.truck.id : 0,
                                   customerId: offerState.context.offer.customer && offerState.context.offer.customer.id ? offerState.context.offer.customer.id : 0,
                                   departureDate: moment.utc(offerState.context.offer.departureDate),
                                   departurePlace: offerState.context.offer.departurePlace,
                                   details: offerState.context.offer.detail
                                }}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                                autoComplete="off"
                            >
                                <Card title="Information Related">
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={14}>
                                            <Form.Item
                                                label="Details"
                                                name="detail"
                                                rules={[{required: false, message: 'Please input details'}]}
                                            >
                                                <Input onChange={async (e) => {
                                                    e.preventDefault()
                                                    offerState.context.offer.detail = e.target.value
                                                    if (offerState.context.offer.detail) {
                                                        let trucksRecomended : Truck[] = offerState.context.trucks
                                                            .filter((truck)=> truck.tag ? truck.tag.includes(offerState.context.offer.detail) : false)
                                                        if (trucksRecomended.length > 0){
                                                            form.setFieldsValue({"truckId": trucksRecomended[0].id})
                                                            notification.open({
                                                                message: 'Recomandation Done',
                                                                description:
                                                                    'Truck was completed by sugestion from detail',
                                                                icon: <SmileOutlined style={{ color: '#108ee9' }} />,
                                                            });
                                                        }
                                                    }
                                                }}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={14}>
                                            <Form.Item
                                                name="truckId"
                                                label="Truck info"
                                                rules={[{ required: true, message: "Please select Truck info!"}]}
                                            >
                                                <Select

                                                >
                                                    {offerState.context.trucks.map((truck, index) => {
                                                    return (
                                                        <Option key={index} value={truck.id}>
                                                            {truck.brand}
                                                        </Option>
                                                    );
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={14}>
                                            <Form.Item
                                                label="Customer name"
                                                name="customerId"
                                                rules={[{required: true, message: 'Please input your name'}]}
                                            >
                                                 <Select

                                                >
                                                    {offerState.context.customers.map((customer, index) => {
                                                    return (
                                                        <Option key={index} value={customer.id}>
                                                            {customer.name}
                                                        </Option>
                                                    );
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={14}>
                                            <Form.Item
                                                name="departureDate"
                                                label="Departure Date"
                                                rules={[{ required: true, message: "Please select departure date!"}]}
                                            >
                                            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={14}>
                                            <Form.Item
                                                label="Address Start"
                                                name="departurePlace"
                                                rules={[{required: true, message: 'Please input start address'}]}
                                            >
                                                <Input onChange={async (e) => {
                                                    e.preventDefault()
                                                    offerState.context.offer.departurePlace = e.target.value
                                                    if (e.target.value.length>2) {
                                                        const startLocation : number[] = await getLocationFromAddress(offerState.context.offer.departurePlace)
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

                                </Card>
                            </Form>
                        </Modal>
            )}

            {offerState.matches('loadTransportOfferRejected') && (
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

export default AddEditTransportOffer



interface AddEditTransportOfferMachineContext {
    offer: TransportOffer,
    trucks: Truck[],
    customers: Customer[]
}

interface AddEditTransportOfferMachineSchema {
    context: AddEditTransportOfferMachineContext
    states: {
        loadingTransportOffer: {}
        loadTransportOfferResolved: {}
        loadTransportOfferRejected: {}
        savingTransportOffer: {}
    }
}

type AddEditTransportOfferMachineEvent = | { type: 'RETRY' } | { type: 'SAVE'; payload: { offer: TransportOffer } }

const createTransportOfferMachine = (offerId: number,
                            onOk: () => void,
                            onError: () => void,
                            onSubmit: () => void,
                            onCancel: () => void,
                            onRefresh: () => void) =>
    Machine<AddEditTransportOfferMachineContext, AddEditTransportOfferMachineSchema, AddEditTransportOfferMachineEvent>(
        {
            id: 'addedit-transportOffer-machine',
            context: {
                offer: {} as TransportOffer,
                trucks: [] as Truck[],
                customers: [] as Customer[]
            },
            initial: 'loadingTransportOffer',
            states: {
                loadingTransportOffer: {
                    invoke: {
                        id: 'loadingTransportOffer',
                        src: 'loadData',
                        onDone: {
                            target: 'loadTransportOfferResolved',
                            actions: assign((_, event) => {
                                if (event.data[0].data) { //edit flow
                                    return {
                                        offer: event.data[0].data,
                                        trucks: event.data[1].data,
                                        customers: event.data[2].data
                                    }
                                }
                                //add flow
                                return {
                                    offer: event.data[0],
                                    trucks: event.data[1].data,
                                    customers: event.data[2].data
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
                            target: 'loadingTransportOffer'
                        },
                        SAVE: {
                            target: 'savingTransportOffer'
                        }
                    }
                },
                loadTransportOfferRejected: {
                    on: {
                        RETRY: {
                            target: 'loadingTransportOffer'
                        }
                    }
                },
                savingTransportOffer: {
                    invoke: {
                        id: 'savingTransportOffer',
                        src: 'saveTransportOffer',
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
                    getOfferbyId(offerId),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks`),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/customers`)
                ]),
                saveTransportOffer: (id, event) => {
                    if (event.type === 'SAVE')
                        if (offerId !== 0)
                            return axios.patch(`http://${process.env.REACT_APP_SERVER_NAME}/offers/${offerId}`, event.payload.offer)
                        else
                            return axios.post(`http://${process.env.REACT_APP_SERVER_NAME}/offers`, event.payload.offer)
                    else
                        return Promise.resolve(() => {

                        })
                }
            }
        }
    )

    function getOfferbyId(id: number): Promise<TransportOffer | string> {
         if (id === undefined || id === null) {
             return Promise.reject("some error")
         } else if (id === 0) {
             const offer = {
                 id: 0,
                 customer:{
                    id: 0,
                    name: ''
                 },
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
                 },
                 departureDate: new Date(),
                 departurePlace: '',
                 detail: '',
             } as TransportOffer
             return Promise.resolve(offer)
         } else
             return axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/offers/${id}`)
     }