import React, {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { AssignmentProperties } from './AssignmentProperties';
import {createAssignment, getAllAssignments, newWebSocket, syncLocalUpdates, updateAssignment} from './assignmentApi';
import { AuthContext } from '../authentication';
import {Plugins} from "@capacitor/core";
import {useNetwork} from "./AssignmentList";

const {Storage}=Plugins
const log = getLogger('ItemProvider');

type SaveAssignmentFunction = (item: AssignmentProperties) => Promise<any>;

export interface AssignmentState {
  assignments?: AssignmentProperties[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveAssignment?: SaveAssignmentFunction,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: AssignmentState = {
  fetching: false,
  saving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer: (state: AssignmentState, action: ActionProps) => AssignmentState =
    (state, { type, payload }) => {
      switch (type) {
        case FETCH_ITEMS_STARTED:
          return { ...state, fetching: true, fetchingError: null };
        case FETCH_ITEMS_SUCCEEDED:
          return { ...state, assignments: payload.items, fetching: false };
        case FETCH_ITEMS_FAILED:
          return { ...state, fetchingError: payload.error, fetching: false };
        case SAVE_ITEM_STARTED:
          return { ...state, savingError: null, saving: true };
        case SAVE_ITEM_SUCCEEDED:
          const items = [...(state.assignments || [])];
          const item = payload.item;
          const index = items.findIndex(it => it._id === item._id);
          if (index === -1) {
            items.splice(0, 0, item);
          } else {
            items[index] = item;
          }
          return { ...state, assignments: items, saving: false };
        case SAVE_ITEM_FAILED:
          return { ...state, savingError: payload.error, saving: false };
        default:
          return state;
      }
    };

export const AssignmentContext = React.createContext<AssignmentState>(initialState);

interface AssignmentProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const AssignmentProvider: React.FC<AssignmentProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { assignments, fetching, fetchingError, saving, savingError } = state;
  const {networkStatus}=useNetwork();
  // const [localModifications, setLocalModifications]=useState(false);
  useEffect(getAssignmentsEffect, [token]);
  useEffect(wsEffect, [token]);
  const saveAssignment = useCallback<SaveAssignmentFunction>(saveAssignmentCallback, [token]);
  const value = { assignments, fetching, fetchingError, saving, savingError, saveAssignment };
  log('returns');
  return (
      <AssignmentContext.Provider value={value}>
        {children}
      </AssignmentContext.Provider>
  );

  async function syncLocalModifications() {
    let localAssigns = await Storage.keys()
        .then(function (localStorageData) {
          for(let i=0;i<localStorageData.keys.length;i++)
            if(localStorageData.keys[i].valueOf().includes('assignments'))
              return Storage.get({key:localStorageData.keys[i]});

        });

      let resp=await syncLocalUpdates(token,JSON.parse(localAssigns?.value || "[]"));
      console.log(resp)
      if(resp.valueOf())
        await Storage.set({key: `isModified`, value: `false`})
      else console.log("Eroare la sincronizare :(((((")
  }

  function getAssignmentsEffect() {
    let canceled = false;
    fetchAssignments();
    return () => {
      canceled = true;
    }

    async function fetchAssignments() {
      if (!token?.trim()) {
        return;
      }
      if(!networkStatus.connected){
        await getLocalData();
      }else{
        try {
          let isModified=await Storage.get({key: "isModified"});
          if( isModified && isModified.value==="true") await syncLocalModifications();
          log('fetchAssignments started');
          dispatch({ type: FETCH_ITEMS_STARTED });
          const items = await getAllAssignments(token);
          log('fetchAssignments succeeded');
          if (!canceled) {
            dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: {items } });
          }
        } catch (error) {
          await getLocalData();
        }
      }
    }
  }


  async function getLocalData(){
    let localAssignments = await Storage.keys()
        .then(function (localStorageData) {
          for(let i=0;i<localStorageData.keys.length;i++)
            if(localStorageData.keys[i].valueOf().includes('assignments'))
              return Storage.get({key:localStorageData.keys[i]});

        });
    dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {items:JSON.parse(localAssignments?.value || '{}')}})
  }


  async function saveAssignmentCallback(assignment: AssignmentProperties) {
    try {
      log('saveItem started');
      dispatch({type: SAVE_ITEM_STARTED});
      const savedItem = await (assignment._id ? updateAssignment(token, assignment) : createAssignment(token, assignment));
      log('saveItem succeeded');
      dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: savedItem}});
    } catch (error) {
      await saveLocalData(assignment);
    }
  }

  async function saveLocalData(assignment:AssignmentProperties){
    alert("Data will be stored in the local storage!")
    let localAssignments = await Storage.keys()
        .then(function (localStorageData) {
          for(let i=0;i<localStorageData.keys.length;i++)
            if(localStorageData.keys[i].valueOf().includes('assignments'))
              return Storage.get({key:localStorageData.keys[i]});

        });
    let assignments=JSON.parse(localAssignments?.value || '[]');
    if (assignment._id) {
      for(let i=0;i<assignments.length;i++)
        if(assignments[i]._id===assignment._id) {
          assignments[i] = assignment;
          break;
        }
      await Storage.set({
        key: `assignments`,
        value: JSON.stringify(assignments)
      });
    } else {
      assignment._id='_' + Math.random().toString(36).substr(2, 9);
      assignments?.push(assignment)
      console.log(assignments)
      await Storage.set({
        key: `assignments`,
        value: JSON.stringify(assignments)
      });
    }

    await Storage.set({key: `isModified`, value: `true`})
    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: assignment}});
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, message => {
        if (canceled) {
          return;
        }
        const { type, payload: item } = message;
        log(`ws message, item ${type}`);
        if (type === 'created' || type === 'updated') {
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
        }
      });
    }
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
    }
  }
};
