import {useEffect, useState} from "react";
import {Network, NetworkStatus} from "@capacitor/core";

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