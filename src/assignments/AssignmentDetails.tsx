import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem, IonIcon, IonChip,
  IonToast, IonText,
  IonFab, IonFabButton
} from '@ionic/react';
import { getLogger } from '../core';
import {AssignmentContext, conflicts} from './AssignmentProvider';
import { RouteComponentProps } from 'react-router';
import { AssignmentProperties } from './AssignmentProperties';
import {add, checkmark, cloud, cloudOffline, save, server, trash} from "ionicons/icons";
import {Network, NetworkStatus, Storage} from "@capacitor/core";


const log = getLogger('AssignmentDetails');

interface DetailedAssignmentProperties extends RouteComponentProps<{
  id?: string;
}> {}


const initialNetworkState = {
  connected: false,
  connectionType: 'unknown',
}

export const useNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState(initialNetworkState)
  useEffect(() => {
    const handler = Network.addListener('networkStatusChange', handleNetworkStatusChange);
    Network.getStatus().then(handleNetworkStatusChange);
    let canceled = false;
    return () => {
      canceled = true;
      //foarte important sa nu facem memory leaks - consuma resurse aiurea
      handler.remove(); //la useEfect se exec functia din el o singura data si are sansa sa returneze o alta functie care sa se distruga atunci cand componenta Home este distrusa
    }

    function handleNetworkStatusChange(status: NetworkStatus) {
      console.log('useNetwork - status change', status);
      if (!canceled) {
        setNetworkStatus(status);
      }
    }
  }, [])
  return { networkStatus };
};

const AssignmentDetails: React.FC<DetailedAssignmentProperties> = ({ history, match }) => {
  const { assignments, saving, savingError,saveAssignment, resolveConflict } = useContext(AssignmentContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [version, setVersion] = useState(-1);
  const [pupilID] = useState('');
  const [item, setItem] = useState<AssignmentProperties>();
  const {networkStatus}=useNetwork();
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const assignment = assignments?.find(it => it._id === routeId);
    setItem(assignment);
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description)
      setDate(assignment.date)
      setVersion(assignment.version);
    }
  }, [match.params.id, assignments]);
  const handleSave = () => {
    const editedAssignment = item ?
        { ...item, title, description, pupilID,date, version} : { title: title, description: description,date:date, pupilID: pupilID, version:version };
    saveAssignment && saveAssignment(editedAssignment).then(() => history.push("/assignments"));
  };


  const keepDataOnServer=async ()=>{
      let serverItem=conflicts.find(c=>c._id===item?._id);
      let locals=await Storage.get({key:"assignments"})
      let localItems=JSON.parse(locals.value||"[]");
      if(serverItem)
        for(let i=0;i<localItems.length;i++)
          if(localItems[i]._id===serverItem._id) {
            localItems[i] = serverItem;
            conflicts.splice(conflicts.indexOf(serverItem),1)
            await Storage.set({key:`conflictingData`, value:JSON.stringify(conflicts)})
            await Storage.set({key:`assignments`, value:JSON.stringify(localItems)})
            history.push("/assignments")
            history.go(0)
            break;
          }
  }

  const changeDataOnServer=async ()=> {
    console.log("YUP")
    console.log(item + " " + resolveConflict)
    const myAssignment = item ?
        {...item, title, description, pupilID, date, version} : {
          title: title,
          description: description,
          date: date,
          pupilID: pupilID,
          version: version
        };
    resolveConflict && resolveConflict(myAssignment).then(async () => {
      let serverItem = conflicts.find(c => c._id === item?._id);
      if (serverItem) {
        conflicts.splice(conflicts.indexOf(serverItem), 1)
        await Storage.set({key: `conflictingData`, value: JSON.stringify(conflicts)})
      }
      history.push("/assignments")
      history.go(0)
    })
  }

  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Assignment details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
          <IonChip class={"netChip"}>
            {networkStatus.connected && <IonIcon icon={cloud}/>}
            {!networkStatus.connected && <IonIcon icon={cloudOffline}/>}
            <IonLabel>{networkStatus.connectionType}</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>Title:</IonLabel>
          <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')}/>
        </IonItem>

        <IonItem>
          <IonLabel>Content:</IonLabel>
          <IonInput value={description } onIonChange={e => setDescription(e.detail.value || '')}/>
        </IonItem>
        <IonItem>
          <IonLabel>Date:</IonLabel>
          <IonInput value={date} onIonChange={e => setDate(e.detail.value || '')}/>
        </IonItem>
        <IonLoading isOpen={saving} />
        {conflicts && conflicts.filter(c=>c._id===item?._id).map(({title,description, date})=> {
          return <>
            <IonTitle color={"danger"} class={"conflictTitle"}>CONFLICTING ASSIGNMENT</IonTitle>
            <IonItem>
              <IonLabel>Title:</IonLabel>
              <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} readonly/>
            </IonItem>
            <IonItem>
              <IonLabel>Content:</IonLabel>
              <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} readonly/>
            </IonItem>
            <IonItem>
              <IonLabel>Date:</IonLabel>
              <IonInput value={date} onIonChange={e => setDate(e.detail.value || '')} readonly/>
            </IonItem>
            <IonFab vertical="bottom" horizontal="start" slot="fixed">
              <IonLabel>Save your data</IonLabel>
              <IonFabButton color={"success"} onClick={changeDataOnServer}>
                <IonIcon icon={save}/>
              </IonFabButton>
            </IonFab>
            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonLabel>Drop your data</IonLabel>
              <IonFabButton color={"danger"} onClick={keepDataOnServer}>
                <IonIcon icon={trash}/>
              </IonFabButton>
            </IonFab>
          </>
        })}
        {savingError && (
            <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>)}

export default AssignmentDetails;
