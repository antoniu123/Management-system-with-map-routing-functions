import React from 'react';
import './css/App.css';
import {Button, Form, Input, Layout, Menu, message, Modal, Result, Spin} from "antd";
import {Link, Route, Switch, useHistory, withRouter} from "react-router-dom";
import Sider from "antd/es/layout/Sider";
import {LaptopOutlined, NotificationOutlined, UserOutlined} from "@ant-design/icons";
import SubMenu from 'antd/lib/menu/SubMenu';
import Home from "./component/Home";
import SearchAddress from "./component/map/SearchAddress";
import Trucks from "./component/truck/Trucks";
import {User} from "./model/User";
import {assign, Machine} from "xstate";
import axios from "axios";
import {default as bcrypt} from 'bcryptjs'
import {useMachine} from "@xstate/react"
import StorageTypes from "./component/storage/StorageTypes";
import UserDetail from "./shared/UserDetail";
import Shipments from "./component/shipment/Shipments";
import TransportOffers from "./component/transportOffer/TransportOffers"
import TransportRequests from "./component/transportRequest/TransportRequests";
import Geocode from "./component/map/Geocode";
import {Shipment} from "./model/Shipment";

const {Header, Content} = Layout

interface UserContextInterface {
    user: User
}

export const UserContext = React.createContext<UserContextInterface | null>(null)

const App: React.VFC = () => {
    const history = useHistory()
    const [appState, send] = useMachine(createLoginMachine())

    const onLogout = () => {
        send({
            type: 'LOGOUT'
        })
        history.push('/')
    }

    const onSubmit = (values: any) => {
        send({
            type: 'LOGIN',
            payload: {
                username: values.username,
                password: values.password
            }
        })
    }

    const customersIds : number[] = appState.context.user.customers.map(s=>s.id)

    const shipmentsAddresses: string[] = appState.context.shipments.filter((s)=>customersIds.includes(s.customer.id)).map(s => s.addressStop)

    const shipmentsTrucks: string[] = appState.context.shipments.filter((s)=>customersIds.includes(s.customer.id)).map(s => s.addressStart)

    return (
        <div>

            {appState.matches('loginDisplayed') && (
                <Modal visible={true} footer={null} title={"Login"}
                       closable={false}
                >
                    <Form
                        name="basic"
                        labelCol={{span: 8}}
                        wrapperCol={{span: 16}}
                        initialValues={{
                            username: '',
                            password: ''
                        }}
                        autoComplete="off"
                        onFinish={onSubmit}
                    >
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[{required: true, message: 'Please input username'}]}
                        >
                            <Input onChange={(e) => {
                                e.preventDefault()
                                appState.context.user.username = e.target.value
                            }}/>
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{required: true, message: 'Please input password!'}]}
                        >
                            <Input onChange={(e) => {
                                e.preventDefault()
                                appState.context.user.password = e.target.value
                            }} type={"password"}/>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            )}

            {appState.matches('tryLogin') && (
                <Spin/>
            )}

            {appState.matches('loginError') && (
                <Result status="403"
                        title='Invalid username/password'
                        subTitle='Please try to log again. If Problem persis contact administrator'
                        extra={
                            <Button type="primary" onClick={() => {
                                send({
                                    type: 'RETRY'
                                })
                            }}>
                                Try Login Again
                            </Button>
                        }>
                </Result>
            )}

            {appState.matches('loginFinished') && (
                <UserContext.Provider value = {
                    {user: appState.context.user ? appState.context.user : {} as User}
                }>
                <Layout>
                    <Header className="header">
                        <div className="logo"/>
                        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
                            <Menu.Item key="1">
                                <Link to="/">Home</Link>
                            </Menu.Item>
                            <Menu.Item key="2">
                                <Link to="/search">Search</Link>
                            </Menu.Item>
                            <Menu.Item key="3">
                                <UserOutlined />
                                <UserDetail show={true} onLogout={onLogout}/>
                            </Menu.Item>
                        </Menu>
                    </Header>
                    <Layout>
                        <Sider width={200} className="site-layout-background">
                            <Menu
                                mode="inline"
                                defaultSelectedKeys={['1']}
                                defaultOpenKeys={['sub1']}
                                style={{height: '100%', borderRight: 0}}
                            >
                                { appState.context.user.userType.name === 'ADMIN' ?
                                <SubMenu key="sub1" icon={<NotificationOutlined />} title="Administrator">
                                    <Menu.Item key="1"><Link to="/trucks">Trucks</Link></Menu.Item>
                                    <Menu.Item key="2"><Link to="/storageTypes">Storage Types</Link></Menu.Item>
                                    <Menu.Item key="3"><Link to="/shipments">Shipments</Link></Menu.Item>
                                </SubMenu> :
                                    null }
                                { appState.context.user.userType.name === 'TRANSPORTATOR' ?
                                <SubMenu key="sub2" icon={<LaptopOutlined />} title="Details">
                                    <Menu.Item key="4"><Link to="/myTrucks">My Trucks</Link></Menu.Item>
                                    <Menu.Item key="5"><Link to="/offers">My Offers</Link></Menu.Item>
                                    <Menu.Item key="6"><Link to="/requests">Requests</Link></Menu.Item>
                                    <Menu.Item key="7"><Link to="/myShipments">My Shipments</Link></Menu.Item>
                                </SubMenu> : null
                                }

                                { appState.context.user.userType.name === 'EXPEDITOR' ?
                                    <SubMenu key="sub3" icon={<LaptopOutlined />} title="Details">
                                        <Menu.Item key="8"><Link to="/myPlaces">My Places</Link></Menu.Item>
                                        <Menu.Item key="9"><Link to="/requests">My Requests</Link></Menu.Item>
                                        <Menu.Item key="10"><Link to="/offers">Offers</Link></Menu.Item>
                                        <Menu.Item key="11"><Link to="/myShipments">My Shipments</Link></Menu.Item>
                                    </SubMenu> : null
                                }
                            </Menu>
                        </Sider>
                        <Layout style={{padding: '0 24px 24px', height: '800px'}}>
                            <Content
                                className="site-layout-background"
                                style={{
                                    padding: 20,
                                    margin: 0,
                                    minHeight: 10
                                }}
                            >
                                <Switch>
                                    <Route path={'/'} exact component={() => <Home />} />
                                    <Route path={'/search'} exact component={() => <SearchAddress />} />
                                    <Route path={'/trucks'} exact component={() => <Trucks />} />
                                    <Route path={'/storageTypes'} exact component={() => <StorageTypes />} />
                                    <Route path={'/shipments'} exact component={() => <Shipments />} />
                                    <Route path={'/myShipments'} exact component={() => <Shipments />} />
                                    <Route path={'/offers'} exact component={() => <TransportOffers />} />
                                    <Route path={'/requests'} exact component={() => <TransportRequests />} />
                                    <Route path={'/myPlaces'} exact component={() => <Geocode
                                        centerX={26.09} centerY={44.43} zoom={6}
                                        addresses={shipmentsAddresses}
                                    />} />
                                    <Route path={'/myTrucks'} exact component={() => <Geocode
                                        centerX={26.09} centerY={44.43} zoom={6}
                                        addresses={shipmentsTrucks}
                                    />} />

                                </Switch>
                            </Content>

                        </Layout>
                    </Layout>
                </Layout>
                </UserContext.Provider>
            )}

            {appState.matches('tryLogout') && (
                <Spin/>
            )}
        </div>
    );
}

export default withRouter(App)

interface LoginMachineContext {
    user: User,
    shipments: Shipment[]
}

interface LoginMachineSchema {
    context: LoginMachineContext
    states: {
        loginDisplayed: {}
        tryLogin: {}
        loginFinished: {}
        loginError: {}
        tryLogout: {}
    }
}

type LoginMachineEvent =
    | { type: 'RETRY' }
    | { type: 'LOGIN'; payload: { username: string, password: string } }
    | { type: 'LOGOUT' }

const createLoginMachine = () =>
    Machine<LoginMachineContext, LoginMachineSchema, LoginMachineEvent>(
        {
            id: 'login-machine',
            context: {
                user: {
                    id: 0,
                    username: '',
                    password: '',
                    userType: {
                        id: 0,
                        name: ''
                    },
                    customers: []
                },
                shipments: []
            },
            initial: 'loginDisplayed',
            states: {
                loginDisplayed: {
                    on: {
                        LOGIN: {
                            target: 'tryLogin'
                        }
                    }
                },
                tryLogin: {
                    invoke: {
                        id: 'tryLogin',
                        src: 'login',
                        onDone: {
                            target: 'loginFinished',
                            actions: assign((context, event) => {
                                // console.log("User = ", event && event.data ? event.data : "nimic")
                                if (event.data && event.data[0]) {
                                    return {
                                        user: event.data[0][0],
                                        shipments: event.data[1].data
                                    }
                                } else
                                    return {
                                        user: {id: 0, username: '', password: '', userType: {id: 0, name: ''}},
                                        shipments: []
                                    }
                            })
                        },
                        onError: {
                            target: 'loginError'
                        }
                    }
                },
                loginError: {
                    on: {
                        RETRY: {
                            target: 'loginDisplayed'
                        }
                    }
                },
                loginFinished: {
                    on: {
                        LOGOUT: {
                            target: 'tryLogout'
                        }
                    }
                },
                tryLogout: {
                    always: {
                        target: 'loginDisplayed',
                        actions: assign((context, event) => {
                            return {
                                user: {
                                    id: 0,
                                    username: '',
                                    password: '',
                                    userType: {
                                        id: 0,
                                        name: ''
                                    },
                                    customers: []
                                },
                                shipments: []
                            }
                        })
                    }
                }
            }

        },
        {
            services: {
                login: (id, event) => {
                    let username = ''
                    let password = ''
                    if (event.type === 'LOGIN') {
                        username = event.payload.username
                        password = event.payload.password
                    }
                    const url = `http://localhost:8080/users?username=${username}`
                    return async () =>
                        Promise.all ([axios
                            .get(url)
                            .then((ret) => {
                                if (ret.data.length > 0 && bcrypt.compareSync(password, ret.data[0].password)) {
                                    message.info("login succesfull", 2)
                                    return Promise.resolve(ret.data)
                                } else {
                                    message.warning("login failed", 2)
                                    return Promise.reject("unauthorized")
                                }
                            })
                            .catch((err) =>
                                Promise.reject(err)
                            ),
                            axios.get(`http://${process.env.REACT_APP_SERVER_NAME}/shipments`)
                            ])
                }
            }
        }
    )