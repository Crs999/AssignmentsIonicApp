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
  IonLabel, IonChip, IonAlert,
    IonToast
} from '@ionic/react';
import {add, cloud, cloudOffline} from 'ionicons/icons';
import Assignment from './Assignment';
import { getLogger } from '../core';
import {AssignmentContext, conflicts} from './AssignmentProvider';
import {AuthContext} from "../authentication";
import {AssignmentProperties} from "./AssignmentProperties";
import ConflictingAssignment from "./ConflictingAssignment";
import {useNetwork} from "../core/useNetworkState";

const log = getLogger('AssignmentList');

const AssignmentList: React.FC<RouteComponentProps> = ({ history }) => {
  const { assignments, fetching, fetchingError} = useContext(AssignmentContext);
  const { logout } = useContext(AuthContext);
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const [loadedAssignments, setLoadedAssignments]=useState<AssignmentProperties[]>([]);
  const [searchAssignment, setSearchAssignment] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [loadedNumber, setLoadedNumber]=useState(6);
  const {networkStatus}=useNetwork()
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
          {<IonToast isOpen={!networkStatus.connected} duration={2000} message={"No internet connection! Using data stored locally!"}/>}
          {loadedAssignments && loadedAssignments.filter(assign=>{if(filter==="") return true; else return assign.date===filter})
              .filter(assign=>assign.title.indexOf(searchAssignment)>=0)
              .map(({ _id, title, date, description, pupilID, version, photoURL}) => {
                let assign = conflicts.filter(a => a === _id).length
                if (assign === 1)
                  return <ConflictingAssignment key={_id} _id={_id} title={title} date={date} description={description}
                                                pupilID={pupilID} version={version} photoURL={photoURL}
                                                onClick={id => history.push(`/assignment/${id}`)} />
                return <Assignment key={_id} _id={_id} title={title} date={date} description={description}
                                   pupilID={pupilID} version={version}  photoURL={photoURL}
                                   onClick={id => history.push(`/assignment/${id}`)}/>
              })
          }
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
