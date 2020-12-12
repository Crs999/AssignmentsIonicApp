import React from 'react';
import {IonCardSubtitle, IonIcon, IonCardContent, IonCard} from '@ionic/react';
import { AssignmentProperties } from './AssignmentProperties';
import {book, pencil} from "ionicons/icons";
import {IonCardTitle} from "@ionic/react";

interface AssignmentPropertiesExt extends AssignmentProperties {
  onClick: (_id?: string) => void;
}

const Assignment: React.FC<AssignmentPropertiesExt> = ({ _id, title,description, onClick }) => {
  return (
      <IonCard class={"card"}>
          <IonCardContent onClick={() => onClick(_id)}>
              <IonIcon icon={pencil} slot="end"/>
              <IonIcon icon={book} slot="end"/>
              <IonCardTitle>{title}</IonCardTitle>
              <IonCardSubtitle>{description}</IonCardSubtitle>
          </IonCardContent>
      </IonCard>
  );
};

export default Assignment;
