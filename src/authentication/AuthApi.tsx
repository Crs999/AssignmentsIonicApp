import axios from "axios";
import {baseUrl, config, withLogs} from '../core';

const loginUrl=`http://${baseUrl}/api/auth/login`;

export interface AuthProps{
    token:string;
}

export const login:(username?:string, password?:string)=> Promise<AuthProps> =((username, password) => {
    let res = axios.post(loginUrl, {username, password}, config);
    return withLogs(res, 'login');
})