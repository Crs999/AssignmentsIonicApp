import React, {useContext, useState} from 'react';
import {Redirect} from 'react-router-dom';
import {RouteComponentProps} from "react-router-dom";
import {
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
} from "@ionic/react";
import {AuthContext} from "./AuthProvider";
import {getLogger} from '../core';


const log=getLogger("Login");

interface LoginState{
    username?:string;
    password?:string;
}

export const Login: React.FC<RouteComponentProps>=({history})=>{
    const {isAuthenticated, isAuthenticating, login, authenticationError}=useContext(AuthContext);
    const [loginState, setState]=useState<LoginState>({});
    const {username, password}=loginState;
    const handleLogin=()=>{
        log('handleLogin...');
        login?.(username, password);
    };
    log('render');
    if(isAuthenticated){
        return <Redirect to={{pathname:'/'}}/>
    }
    return(
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Welcome! Please login!</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput
                    placeholder="Username"
                    value={username}
                    onIonChange={e=>setState({...loginState, username:e.detail.value||''})}/>
                <IonInput
                    placeholder="Password"
                    value={password}
                    onIonChange={e=>setState({...loginState, password: e.detail.value||''})}
                />
                <IonLoading isOpen={isAuthenticating}/>
                {authenticationError &&(
                    <div>{authenticationError.message || 'Failed to authenticate'}</div>
                )}
                <IonButton onClick={handleLogin} id={"loginBtn"}>Login</IonButton>
            </IonContent>
        </IonPage>
    )
}