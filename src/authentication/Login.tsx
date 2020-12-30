import React, {useContext, useState} from 'react';
import {Redirect} from 'react-router-dom';
import {RouteComponentProps} from "react-router-dom";
import {
    CreateAnimation,
    createAnimation,
    IonToast,
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
import './login.css'


const log=getLogger("Login");

interface LoginState{
    username?:string;
    password?:string;
}

export const Login: React.FC<RouteComponentProps>=({history})=>{
    const {isAuthenticated, isAuthenticating, login, authenticationError, pendingAuthentication}=useContext(AuthContext);
    const [loginState, setState]=useState<LoginState>({});

    const [authError, setAuthError]=useState<boolean>(false)
    const {username, password}=loginState;
    const handleLogin=()=>{
        setAuthError(false)
        log('handleLogin...');
        login?.(username, password);
    };
    log('render');
    if(isAuthenticated){
        return <Redirect to={{pathname:'/'}}/>
    }

    let animation=function simpleAnimation() {
        const user = document.querySelector("#user");
        const pass = document.querySelector("#passwd");
        if (user && pass) {
            const animation = createAnimation()
                .addElement(user)
                .addElement(pass)
                .duration(100)
                .direction('alternate')
                .iterations(1)
                .keyframes([
                    {offset: 0, transform: 'translateX(0px)'},
                    {offset: 0.2, transform: 'translateX(10px)'},
                    {offset: 0.4, transform: 'translateX(0px)'},
                    {offset: 0.6, transform: 'translateX(-10px)'},
                    {offset: 1, transform: 'translateX(0px)'}
                ])
                .onFinish(()=>setAuthError(true))
            animation.play();
        }
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
                    id={"user"}
                    placeholder="Username"
                    value={username}
                    onIonChange={e=>setState({...loginState, username:e.detail.value||''})}/>
                <IonInput
                    id={"passwd"}
                    placeholder="Password"
                    value={password}
                    onIonChange={e=>setState({...loginState, password: e.detail.value||''})}
                />
                <IonLoading isOpen={isAuthenticating}/>
                {authenticationError
                && (<IonToast isOpen={true} message={"Login error!"} duration={200}/>)
                 && !authError
                && (<CreateAnimation ref={animation}/>)}
                <IonButton onClick={handleLogin} id={"loginBtn"}>Login</IonButton>
            </IonContent>
        </IonPage>
    )
}