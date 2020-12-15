import React from 'react';
import {IonCardSubtitle, IonIcon, IonCardContent, IonCard, IonItem, IonImg} from '@ionic/react';
import { AssignmentProperties } from './AssignmentProperties';
import {book, pencil} from "ionicons/icons";
import {IonCardTitle} from "@ionic/react";
import {usePhotoGallery} from "../core/usePhotoGallery";

interface AssignmentPropertiesExt extends AssignmentProperties {
  onClick: (_id?: string) => void;
}

const Assignment: React.FC<AssignmentPropertiesExt> = ({ _id, title,description,photoURL, onClick }) => {
  const { photos } = usePhotoGallery();
  return (
      <IonItem class={"card"} onClick={() => onClick(_id)}>
          <IonCardContent>
              <IonIcon icon={pencil} slot="end"/>
              <IonIcon icon={book} slot="end"/>
              <IonCardTitle>{title}</IonCardTitle>
              <IonCardSubtitle>{description}</IonCardSubtitle>
          </IonCardContent>
          {photos.filter(photo=>photo.filepath===photoURL).map((photo, index) => (
              <IonImg slot={"end"} src={photo.webviewPath} class={"listImg"}/>
          ))}
      </IonItem>
  );
};
export default Assignment;
