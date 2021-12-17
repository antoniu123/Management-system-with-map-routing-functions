import {Dropdown, Menu} from "antd";
import React, {useState} from "react";
import {DownOutlined} from "@ant-design/icons";
import {UserContext} from "../App";

interface UserDetailProps {
    show: boolean
    onLogout: () => void
}

const UserDetail: React.VFC<UserDetailProps> = ({show, onLogout}) => {

    const userContext = React.useContext(UserContext)

    const [visible, setVisible] = useState(show)

    const handleMenuClick = (e: any) => {
        if (e.key === '3') {
            setVisible(false);
        }
    };

    const handleVisibleChange = (flag: boolean) => {
        setVisible(flag);
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item key="1">{userContext?.user.username} - {userContext?.user.userType.name}</Menu.Item>
            <Menu.Item key="2" onClick={onLogout}> Logout </Menu.Item>
            <Menu.Item key="3">Close</Menu.Item>
        </Menu>
    );

    return (
        <>
            <Dropdown
                overlay={menu}
                onVisibleChange={handleVisibleChange}
                visible={visible}
            >
                <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                    Hover me <DownOutlined/>
                </a>
            </Dropdown>
        </>
    )
}
export default UserDetail