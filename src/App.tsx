import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {AssignmentList,AssignmentDetails} from "./assignments";

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
// import './theme/variables.css';
import { AuthProvider, Login, PrivateRoute } from './authentication';
import {AssignmentProvider} from "./assignments/AssignmentProvider";

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <AuthProvider>
                    <Route path="/login" component={Login} exact={true}/>
                    <AssignmentProvider>
                        <PrivateRoute path="/assignments" component={AssignmentList} exact={true}/>
                        <PrivateRoute path="/assignment" component={AssignmentDetails} exact={true}/>
                        <PrivateRoute path="/assignment/:id" component={AssignmentDetails} exact={true}/>
                    </AssignmentProvider>
                    <Route exact path="/" render={() => <Redirect to="/assignments"/>}/>
                </AuthProvider>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
