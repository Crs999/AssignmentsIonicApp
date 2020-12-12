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
  IonItem, IonIcon, IonChip
} from '@ionic/react';
import { getLogger } from '../core';
import {AssignmentContext} from './AssignmentProvider';
import { RouteComponentProps } from 'react-router';
import { AssignmentProperties } from './AssignmentProperties';
import {cloud, cloudOffline} from "ionicons/icons";
import {Network, NetworkStatus} from "@capacitor/core";


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
  const { assignments, saving, savingError,saveAssignment } = useContext(AssignmentContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
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

    }
  }, [match.params.id, assignments]);
  const handleSave = () => {
    const editedAssignment = item ?
        { ...item, title, description, pupilID,date} : { title: title, description: description,date:date, pupilID: pupilID };
    saveAssignment && saveAssignment(editedAssignment).then(() => history.push("/assignments"));
  };
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
        {savingError && (
            <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AssignmentDetails;
