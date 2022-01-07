import React from "react";
import {useMachine} from "@xstate/react";
import {Button, Card, Col, DatePicker, Form, Input, message, Modal, Result, Row, Select, Spin} from "antd";
import {assign, Machine} from "xstate";
import axios from "axios";
import {Shipment} from "../../model/Shipment";
import {Customer} from "../../model/Customer";
import {Truck} from "../../model/Truck";
import {Storage} from "../../model/Storage";
import {getLocationFromAddress} from "../../shared/getLocationFromAddress";
import moment from "moment";
import {getDistanceBetweenPoints} from "../../shared/getDistanceBetweenPoints";

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

interface AddShipmentFromOfferProps {
    truck: Truck
    customer: Customer
    departureDate: Date
    departurePlace: string
    visible: boolean
    onSubmit: () => void
    onCancel: () => void
    onRefresh: () => void
}

const AddShipmentFromOffer: React.FC<AddShipmentFromOfferProps> = ({
 truck,
 customer,
 departureDate,
 departurePlace,
 visible,
 onSubmit,
 onCancel,
 onRefresh}) => {

    const [form] = Form.useForm();


    const submit = () => {        

        for (const truck of shipmentState.context.trucks){
            if(truck.id === form.getFieldValue("truckId")){
                shipmentState.context.shipment.truck = truck
            }
        }

        for (const customer of shipmentState.context.customers){
            if(customer.id === form.getFieldValue("customerId")){
                shipmentState.context.shipment.customer = customer
            }
        }

        for (const storage of shipmentState.context.storages){
            if(storage.id === form.getFieldValue("storageId")){
                shipmentState.context.shipment.storage = storage
            }
        }

        shipmentState.context.shipment = {
            ...shipmentState.context.shipment,
            dateStart: form.getFieldValue("dateStart"),
            addressStart: form.getFieldValue("addressStart"),
            locationStart: form.getFieldValue("locationStart"),
            dateStop: form.getFieldValue("dateStop"),
            addressStop: form.getFieldValue("addressStop"),
            locationStop: form.getFieldValue("locationStop"),
            distance: form.getFieldValue("distance"),
            price: form.getFieldValue("price")
        }
    
        send({
            type: 'SAVE',
            payload: {shipment: shipmentState.context.shipment}
        })
    }

    const [shipmentState, send] = useMachine(
        createShipmentFromOfferMachine(
            onOk,
            onError,
            onSubmit,
            onCancel,
            onRefresh
        )
    )

    const titleModal = () => {
        return 'Shipment details'
    }

    return (
        <>
            {shipmentState.matches('loadingShipment') && (
                <>
                    <Spin/>
                </>
            )}

            {shipmentState.matches('loadShipmentResolved') && (

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
                                   id: 0,
                                   truckId: truck.id,
                                   customerId: customer.id,
                                   storageId: shipmentState.context.shipment.storage && shipmentState.context.shipment.storage.id ? shipmentState.context.shipment.storage.id : 0,
                                   dateStart: moment.utc(departureDate),
                                   addressStart: departurePlace,
                                   locationStart: shipmentState.context.shipment.locationStart,
                                   xStart: shipmentState.context.shipment.locationStart?.x,
                                   yStart: shipmentState.context.shipment.locationStart?.y,
                                   dateStop: moment.utc(shipmentState.context.shipment.dateStop),
                                   addressStop: shipmentState.context.shipment.addressStop,
                                   locationStop: shipmentState.context.shipment.locationStop,
                                   xStop: shipmentState.context.shipment.locationStop?.x,
                                   yStop: shipmentState.context.shipment.locationStart?.y,
                                   distance: shipmentState.context.shipment.distance,
                                   price: shipmentState.context.shipment.price
                                }}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                                autoComplete="off"
                            >
                                <Card title="Information Related">
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                                            <Form.Item
                                                name="truckId"
                                                label="Truck info"
                                                rules={[{ required: true, message: "Please select Truck info!"}]}  
                                            >
                                                <Select
                                                
                                                >
                                                    {shipmentState.context.trucks.map((truck, index) => {
                                                    return (
                                                        <Option key={index} value={truck.id}>
                                                            {truck.brand}
                                                        </Option>
                                                    );
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={2} sm={5} md={7} lg={10} xl={14}>
                                            <Form.Item
                                                name="customerId"
                                                label="Customer info"
                                                rules={[{ required: true, message: "Please select customer info!"}]}  
                                            >
                                                <Select
                                                    
                                                >
                                                    {shipmentState.context.customers.map((customer, index) => {
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
                                        <Col xs={2} sm={4} md={8} lg={20} xl={35}>
                                            <Form.Item
                                                name="storageId"
                                                label="Storage info"
                                                rules={[{ required: true, message: "Please select storage info!"}]}  
                                            >
                                                <Select
                                                    // onChange={(e:any) => {
                                                    //     if (e.target && e.target.value)
                                                    //         setStorageId(e.target.value)
                                                    // }}
                                                >
                                                    {shipmentState.context.storages.map((storage, index) => {
                                                    return (
                                                        <Option key={index} value={storage.id}>
                                                            weight:{storage.weight} - volume:{storage.volume} - type:{storage.storageType.name}
                                                        </Option>
                                                    );
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                                <Card title="Address Geocoding Distance Price Info">
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item
                                                label="Date Start"
                                                name="dateStart"
                                                rules={[{required: true, message: 'Please input starting date'}]}
                                            >
                                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item
                                                label="Address Start"
                                                name="addressStart"
                                                rules={[{required: true, message: 'Please input start address'}]}
                                            >
                                                <Input onChange={async (e) => {
                                                    e.preventDefault()
                                                    shipmentState.context.shipment.addressStart = e.target.value
                                                    if (e.target.value.length>2) {
                                                        const startLocation : number[] = await getLocationFromAddress(shipmentState.context.shipment.addressStart)
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

                                    <Form.Item 
                                        label="Location Start"
                                        name="locationStart"
                                        hidden
                                    >
                                        <Input disabled={true}/>
                                    </Form.Item>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                label="Longitude Start"
                                                name="xStart"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                label="Latitude Start"
                                                name="yStart"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item
                                                label="Date Stop"
                                                name="dateStop"
                                                rules={[
                                                    {required: true, message: 'Please input arriving date limit'}
                                                    ,({ getFieldValue }) => ({
                                                      validator(_, value) {
                                                        if (!value || moment(getFieldValue('dateStart')).isBefore(moment(value))) {
                                                          return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Arriving date must be greater than starting date!'));
                                                      },
                                                    }),
                                                ]}
                                            >
                                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                                            </Form.Item>
                                        </Col>
                                    </Row>        
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item
                                                label="Address Stop"
                                                name="addressStop"
                                                rules={[{required: true, message: 'Please input stop address'}]}
                                            >
                                                <Input onChange={async (e) => {
                                                    e.preventDefault()
                                                    shipmentState.context.shipment.addressStop = e.target.value
                                                    if (e.target.value.length>2) {
                                                        const stopLocation : number[] = await getLocationFromAddress(shipmentState.context.shipment.addressStop)
                                                        form.setFieldsValue({"locationStop": {x: stopLocation[0], 
                                                                                            y: stopLocation[1]}
                                                                            })
                                                        form.setFieldsValue({"xStop": stopLocation[0]})
                                                        form.setFieldsValue({"yStop": stopLocation[1]}) 
                                                        const distance = await getDistanceBetweenPoints(
                                                            form.getFieldValue("locationStart"), form.getFieldValue("locationStop")) 
                                                        let myTruck : Truck = {} as Truck
                                                        for (const truck of shipmentState.context.trucks){
                                                            if(truck.id === form.getFieldValue("truckId")){
                                                                myTruck = truck
                                                            }
                                                        }
                                                        form.setFieldsValue({"distance": Number(distance)}) 
                                                        form.setFieldsValue({"price": Math.round(myTruck.fullPrice * Number(distance))} )
                                                    }              
                                                }}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>        

                                    <Form.Item 
                                        label="Location Stop"
                                        name="locationStop"
                                        hidden
                                    >
                                        <Input disabled={true} />
                                    </Form.Item>

                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                label="Longitude Stop"
                                                name="xStop"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                label="Latitude Stop"
                                                name="yStop"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>    
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                    label="Distance"
                                                    name="distance"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>    
                                    </Row>
                                    <Row>
                                        <Col xs={2} sm={4} md={6} lg={8} xl={12}>
                                            <Form.Item 
                                                    label="Price"
                                                    name="price"
                                            >
                                                <Input disabled={true} />
                                            </Form.Item>
                                        </Col>    
                                    </Row>
                                </Card>
                            </Form>

                        </Modal>
            )}

            {shipmentState.matches('loadShipmentRejected') && (
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

export default AddShipmentFromOffer

interface AddShipmentFromOfferMachineContext {
    shipment: Shipment
    trucks: Truck[],
    customers: Customer[],
    storages: Storage[]
}

interface AddShipmentFromOfferMachineSchema {
    context: AddShipmentFromOfferMachineContext
    states: {
        loadingShipment: {}
        loadShipmentResolved: {}
        loadShipmentRejected: {}
        savingShipment: {}
    }
}

type AddShipmentFromOfferMachineEvent = | { type: 'RETRY' } | { type: 'SAVE'; payload: { shipment: Shipment } }

const createShipmentFromOfferMachine = (
                            onOk: () => void,
                            onError: () => void,
                            onSubmit: () => void,
                            onCancel: () => void,
                            onRefresh: () => void) =>
    Machine<AddShipmentFromOfferMachineContext, AddShipmentFromOfferMachineSchema, AddShipmentFromOfferMachineEvent>(
        {
            id: 'addedit-shipment-machine',
            context: {
                shipment: {} as Shipment,
                trucks: [] as Truck[],
                customers: [] as Customer[],
                storages: [] as Storage[]
            },
            initial: 'loadingShipment',
            states: {
                loadingShipment: {
                    invoke: {
                        id: 'loadingShipment',
                        src: 'loadData',
                        onDone: {
                            target: 'loadShipmentResolved',
                            actions: assign((_, event) => {
                                //add flow
                                return {
                                    shipment: event.data[0],
                                    trucks: event.data[1].data,
                                    customers: event.data[2].data,
                                    storages: event.data[3].data
                                }    

                            })
                        },
                        onError: {
                            target: 'loadShipmentRejected'
                        }
                    }
                },
                loadShipmentResolved: {
                    on: {
                        RETRY: {
                            target: 'loadingShipment'
                        },
                        SAVE: {
                            target: 'savingShipment'
                        }
                    }
                },
                loadShipmentRejected: {
                    on: {
                        RETRY: {
                            target: 'loadingShipment'
                        }
                    }
                },
                savingShipment: {
                    invoke: {
                        id: 'savingShipment',
                        src: 'saveShipment',
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
                    getShipment(),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/trucks`),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/customers`),
                    axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/storages`)
                ]),
                saveShipment: (id, event) => {
                    if (event.type === 'SAVE')
                         return axios.post(`http://${process.env.REACT_APP_SERVER_NAME}/shipments`, event.payload.shipment)
                    else
                        return Promise.resolve(() => {})
                }
            }
        }
    )

function getShipment(): Promise<Shipment | string> {
        const shipment = {
            id: 0,
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
            customer: {id:0, name: ''} as Customer,
            storage: { id: 0,
                weight: 0,
                volume: 0,
                storageType: { id: 0, name: ''}
            },
            dateStart: new Date(),
            addressStart: '',
            locationStart: undefined,
            dateStop: new Date(),
            addressStop: '',
            locationStop: undefined
        } as Shipment
        return Promise.resolve(shipment)
}