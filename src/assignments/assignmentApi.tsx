import axios from 'axios';
import { authConfig, baseUrl, getLogger, withLogs } from '../core';
import { AssignmentProperties } from './AssignmentProperties';
import {Storage} from "@capacitor/core";

const assignmentUrl = `http://${baseUrl}/api/assignment`;

export const getAllAssignments: (token: string) => Promise<AssignmentProperties[]> = token => {
  let res = axios.get(assignmentUrl, authConfig(token));
  res.then(async function (res) {
    await Storage.set({
            key: `assignments`,
            value: JSON.stringify(res.data)
          });
  })
  return withLogs(res, 'getAssignments');
}

export const createAssignment: (token: string, item: AssignmentProperties) => Promise<AssignmentProperties[]> = (token, item) => {
  return withLogs(axios.post(assignmentUrl, item, authConfig(token)), 'createItem');
}

export const updateAssignment: (token: string, item: AssignmentProperties) => Promise<AssignmentProperties[]> = (token, item) => {
  console.log(item)
  return withLogs(axios.put(`${assignmentUrl}/${item._id}`, item, authConfig(token)), 'updateItem');
}


export const syncLocalUpdates:(token:string,assignments:AssignmentProperties[])=>Promise<Boolean>=(token,assignments)=>{
  console.log(assignments)
  return withLogs(axios.post(`${assignmentUrl}/sync`,assignments,authConfig(token)), 'syncLocalUpdates');
}

interface MessageData {
  type: string;
  payload: AssignmentProperties;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}`);
  ws.onopen = () => {
    log('web socket onopen');
    ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}