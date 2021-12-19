import { Table } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";

const Storages: React.VFC = () => {

    const [storage, setStorage] = useState<any>(null)

    const textUrl = `http://${process.env.REACT_APP_SERVER_NAME}/storageTypes`
    
    useEffect(() => {
        const getText = async () => {
            const result = await axios.get(textUrl)
            .then(response => response)
            .catch(err => {
                console.error(err)
                return err
            })
            setStorage(result.data)
        };

        getText()
    },[textUrl]);

    const columns = [
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        }
    ]    

    return (
        <>
         <Table dataSource={storage} columns={columns}/>
        </>  
    )      
}    

export default Storages