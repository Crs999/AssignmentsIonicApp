import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon, IonInfiniteScroll, IonInfiniteScrollContent,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSelectOption,
  IonSelect,
  IonSearchbar,
  IonLabel, IonChip, IonAlert
} from '@ionic/react';
import {add, cloud, cloudOffline} from 'ionicons/icons';
import Assignment from './Assignment';
import { getLogger } from '../core';
import { AssignmentContext } from './AssignmentProvider';
import {AuthContext} from "../authentication";
import {AssignmentProperties} from "./AssignmentProperties";
import {Network, NetworkStatus} from "@capacitor/core";
import {syncLocalUpdates} from "./assignmentApi";

const log = getLogger('AssignmentList');

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


const AssignmentList: React.FC<RouteComponentProps> = ({ history }) => {
  const { assignments, fetching, fetchingError } = useContext(AssignmentContext);
  const { logout } = useContext(AuthContext);
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const [loadedAssignments, setLoadedAssignments]=useState<AssignmentProperties[]>([]);
  const [searchAssignment, setSearchAssignment] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [loadedNumber, setLoadedNumber]=useState(6);
  const {networkStatus}=useNetwork();
  log('render');
  const handleLogout=()=>{
    log('handleLogin...');
    logout?.();
  };


  function getIonOptions() {
    const options: string[] = [""];
    assignments?.forEach(assign=>{
      if(options.indexOf(assign.date)===-1) options.push(assign.date)
    })
    return options
  }

  useEffect(() => {
    if(assignments?.length)
      setLoadedAssignments(assignments?.slice(0, 6));
  }, [assignments]);



  async function searchNext($event: CustomEvent<void>) {
    if(assignments && loadedNumber < assignments.length) {
      if(filter)
        console.log(filter);
      setLoadedAssignments([...loadedAssignments, ...assignments.slice(loadedNumber, loadedNumber + 5)]);
      setLoadedNumber(loadedNumber + 5);
    } else {
      setDisableInfiniteScroll(true);
    }
    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Assigns</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleLogout}>
                Logout
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
          <IonLoading isOpen={fetching} message="Fetching"/>
          <IonSelect value={filter} placeholder="Select assignment date" onIonChange={e => setFilter(e.detail.value)}>
            {assignments && getIonOptions().map(date => <IonSelectOption key={date} value={date}>{date}</IonSelectOption>)}
          </IonSelect>
          <IonSearchbar
              placeholder="Search for a certain assignment topic"
              value={searchAssignment}
              debounce={200}
              onIonChange={e => setSearchAssignment(e.detail.value!)}>
          </IonSearchbar>
          {<IonAlert isOpen={!networkStatus.connected} message={"No internet connection! Using data stored locally!"}/>}
          {loadedAssignments && loadedAssignments.filter(assign=>{if(filter==="") return true; else return assign.date===filter})
              .filter(assign=>assign.title.indexOf(searchAssignment)>=0)
              .map(({ _id, title, date, description, pupilID}) =>
                  <Assignment key={_id} _id={_id} title={title} date={date} description={description} pupilID={pupilID} onClick={id => history.push(`/assignment/${id}`)}/>)}
          <IonLoading isOpen={fetching} message="Fetching items"/>
          {fetchingError && <IonAlert isOpen={true} message={"No internet connection! Using data stored locally!"}/>}
          <IonInfiniteScroll threshold="30px" disabled={disableInfiniteScroll}
                             onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
            <IonInfiniteScrollContent
                loadingText="Loading more assignments...">
            </IonInfiniteScrollContent>
          </IonInfiniteScroll>
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/assignment')}>
              <IonIcon icon={add}/>
            </IonFabButton>
          </IonFab>
        </IonContent>
      </IonPage>
  );
};

export default AssignmentList;
