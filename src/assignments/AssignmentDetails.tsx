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
  IonFab, IonFabButton, IonGrid, IonRow, IonCol, IonImg, IonActionSheet, IonModal,
    IonCard
} from '@ionic/react';
import { getLogger } from '../core';
import {AssignmentContext, conflicts} from './AssignmentProvider';
import { RouteComponentProps } from 'react-router';
import { AssignmentProperties } from './AssignmentProperties';
import {camera, close, cloud, cloudOffline, save, trash} from "ionicons/icons";
import {Storage} from "@capacitor/core";
import {useNetwork} from "../core/useNetworkState";
import {Photo, usePhotoGallery} from '../core/usePhotoGallery'
import {Map} from "../maps/Map"
import {useLocation} from "../maps/useLocation";


const log = getLogger('AssignmentDetails');

interface DetailedAssignmentProperties extends RouteComponentProps<{
  id?: string;
}> {}

const AssignmentDetails: React.FC<DetailedAssignmentProperties> = ({ history, match }) => {
  const myLocation = useLocation();
  const { latitude: currentLat, longitude: currentLng } = myLocation.position?.coords || {}
  const { assignments, saving, savingError,saveAssignment, resolveConflict, getConflict} = useContext(AssignmentContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [version, setVersion] = useState('');
  const [pupilID] = useState('');
  const [id, setId]=useState('')
  const [photoURL, setPhotoURL]=useState('')
  const [item, setItem] = useState<AssignmentProperties>();
  const [showConflict, setShowConflict]=useState(true)
  const [currentConflict, setCurrentConflict]=useState<AssignmentProperties>();
  const {networkStatus}=useNetwork();
  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<Photo>();
  const [openModal, setOpenModal]=useState(false)
  const [openMapModal, setOpenMapModal]=useState(false)
  const [lat, setLat]=useState<number>();
  const [lng, setLng]=useState<number>();

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
      setId(assignment._id || '')
      setLat(assignment.lat)
      setLng(assignment.lng)
    }
  }, [match.params.id, assignments]);


  useEffect(()=>{
    if(getConflict && !currentConflict) {
      let elem = getConflict(id, version);
      elem.then(res=>{setCurrentConflict(res)})
    }
      // setCurrentConflict();
  }, [currentConflict,getConflict, id, version])


  const handleSave = () => {
    const editedAssignment = item ?
        { ...item, title, description, pupilID,date, version, photoURL, lat, lng} : { title: title, description: description,date:date, pupilID: pupilID, version:version, photoURL: photoURL, lat: lat, lng:lng};
    saveAssignment && saveAssignment(editedAssignment).then(() => history.push("/assignments"));
  };


  const keepDataOnServer=async ()=>{
      let locals=await Storage.get({key:"assignments"})
      let localItems=JSON.parse(locals.value||"[]");
      if(currentConflict)
        for(let i=0;i<localItems.length;i++)
          if(currentConflict._id && localItems[i]._id===currentConflict._id) {
            localItems[i] = currentConflict;
            conflicts.splice(conflicts.indexOf(currentConflict._id),1)
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
        {...item, title, description, pupilID, date, version, photoURL, lat, lng} : {
          title: title,
          description: description,
          date: date,
          pupilID: pupilID,
          version: version,
          photoURL: photoURL,
          lat:lat,
          lng:lng
        };
    resolveConflict && resolveConflict(myAssignment).then(async () => {
      if (currentConflict && currentConflict._id) {
        conflicts.splice(conflicts.indexOf(currentConflict._id), 1)
        await Storage.set({key: `conflictingData`, value: JSON.stringify(conflicts)})
      }
      history.push("/assignments")
      history.go(0)
    })
  }


  const takePhotoAndSaveIt=() =>{
    let url=takePhoto();
    url.then(val=>setPhotoURL(val))
        .catch(err=>setPhotoURL(''));
  }

  log('render');

  return (
    //  ELEMENT DETAILS
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
          <IonInput value={title} onIonChange={e => {setShowConflict(false);setTitle(e.detail.value || '')}}/>
        </IonItem>

        <IonItem>
          <IonLabel>Content:</IonLabel>
          <IonInput value={description} onIonChange={e =>{setShowConflict(false); setDescription(e.detail.value || '')}}/>
        </IonItem>
        <IonItem>
          <IonLabel>Date:</IonLabel>
          <IonInput value={date} onIonChange={e =>{setShowConflict(false);setDate(e.detail.value || '')}}/>
        </IonItem>
        <IonLoading isOpen={saving} />


        {/*PHOTO SECTION*/}
        <div>
          <IonCard class={"photoCard"}>
            {photos.filter(photo=>{return photo.filepath===photoURL || photo.filepath===item?.photoURL}).map((photo, index) => (
                  <IonImg onClick={() => setPhotoToDelete(photo)}
                          src={photo.webviewPath}/>
            ))}
        </IonCard>
        <IonFab>
          <IonFabButton onClick={takePhotoAndSaveIt} color={"dark"}>
            <IonIcon icon={camera}/>
          </IonFabButton>
        </IonFab>
        <IonActionSheet
            isOpen={!!photoToDelete}
            buttons={[{
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (photoToDelete) {
                  setPhotoURL('')
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                }
              }
            }, {
              text: 'Cancel',
              icon: close,
              role: 'cancel'
            }]}
            onDidDismiss={() => setPhotoToDelete(undefined)}
        />
        </div>


        {/*CONFLICTS*/}
        {showConflict && currentConflict && currentConflict._id && (currentConflict.date!==date || currentConflict.description!==description || currentConflict.title!==title) &&
          <>
            <IonButton color={"danger"} class={"conflictTitle"} onClick={()=>setOpenModal(true)}>CONFLICTING ASSIGNMENT</IonButton>
            <IonModal
              isOpen={openModal}
              onDidDismiss={()=>setOpenModal(false)}>
              <IonContent>
                <IonItem>
                  <IonLabel>Title:</IonLabel>
                  <IonInput value={currentConflict.title} readonly/>
                </IonItem>
                <IonItem>
                  <IonLabel>Content:</IonLabel>
                  <IonInput value={currentConflict.description} readonly/>
                </IonItem>
                <IonItem>
                  <IonLabel>Date:</IonLabel>
                  <IonInput value={currentConflict.date} readonly/>
                </IonItem>
                  {photos.filter(photo=>photo.filepath===currentConflict.photoURL).map((photo, index) => (
                      <IonCard class={"photoCard"}>
                        <IonImg src={photo.webviewPath}/>
                      </IonCard>
                  ))}
              </IonContent>
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
            </IonModal>
          </>
        }

        {/*MAPS*/}
        <>
          <IonButton color={"success"} class={"mapBtn"} onClick={()=>setOpenMapModal(true)}>OPEN MAP</IonButton>
          <IonModal isOpen={openMapModal} onDidDismiss={()=>setOpenMapModal(false)}>
            {(lat && lng &&
            <>
            <div>The location where you can buy the needed books is</div>
            <div>latitude: {lat}</div>
            <div>longitude: {lng}</div>
            <Map
                visibleMarker={true}
                onMapClick={(e:any)=>{setLat(e.latLng.lat()); setLng(e.latLng.lng())}}
                lat={lat}
                lng={lng}
                onMarkerClick={log('onMarker')}
            />
            </>) ||
            <>
              <div>SELECT A LOCATION FROM WHERE BOOKS CAN BE PURCHASED</div>
              <Map
                  lat={currentLat}
                  lng={currentLng}
                  onMapClick={(e:any)=>{setLat(e.latLng.lat()); setLng(e.latLng.lng())}}
                  onMarkerClick={log('onMarker')}
              />
            </>
            }
            {/*{!lat && !lng &&*/}
            {/*<>*/}
            {/*  <div>SELECT A LOCATION FROM WHERE BOOKS CAN BE PURCHASED</div>*/}
            {/*  <Map*/}
            {/*      lat={currentLat}*/}
            {/*      lng={currentLng}*/}
            {/*      onMapClick={(e:any)=>{setLat(e.latLng.lat()); setLng(e.latLng.lng())}}*/}
            {/*      onMarkerClick={log('onMarker')}*/}
            {/*  />*/}
            {/*</>}*/}
          </IonModal>
        </>
        {savingError && (
            <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>)}

export default AssignmentDetails;
