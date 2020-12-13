import React from 'react';
import {IonCardSubtitle, IonIcon, IonCardContent, IonCard, IonItem} from '@ionic/react';
import { AssignmentProperties } from './AssignmentProperties';
import {book, pencil, closeCircleSharp} from "ionicons/icons";
import {IonCardTitle} from "@ionic/react";

interface AssignmentPropertiesExt extends AssignmentProperties {
    onClick: (_id?: string) => void;
}

const ConflictingAssignment: React.FC<AssignmentPropertiesExt> = ({ _id, title,description, onClick }) => {
    return (
        <IonItem class={"card"} onClick={() => onClick(_id)}>
                <IonCardContent>
                    <IonIcon icon={pencil} slot="end"/>
                    <IonIcon icon={book} slot="end"/>
                    <IonCardTitle>{title}</IonCardTitle>
                    <IonCardSubtitle>{description}</IonCardSubtitle>
                </IonCardContent>
            <IonIcon icon={closeCircleSharp} color={"danger"} class={"conflictSign"} slot={"end"}/>
        </IonItem>
    )}
export default ConflictingAssignment;
