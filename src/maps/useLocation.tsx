import { useEffect, useState } from 'react';
import { GeolocationPosition, Plugins } from '@capacitor/core';

const { Geolocation } = Plugins;

interface Location {
    position?: GeolocationPosition;
    error?: Error;
}

export const useLocation = () => { //custom hook
    const [state, setState] = useState<Location>({});
    useEffect(watchMyLocation, []);
    return state;

    function watchMyLocation() {
        let cancelled = false;
        //getCurrentPosition promite ca ne da o pozitie. Ne da si momentul de timp la care am determinat pozitia si coordonatele GPS, dar si acuratetea (exprimata in metri) cu care a determinat pozitia
        Geolocation.getCurrentPosition()
            .then(position => updateMyPosition('current', position))
            .catch(error => updateMyPosition('current',undefined, error));
        const callbackId = Geolocation.watchPosition({}, (position, error) => {
            updateMyPosition('watch', position, error);
        });
        return () => {
            cancelled = true;
            Geolocation.clearWatch({ id: callbackId });
        };

        function updateMyPosition(source: string, position?: GeolocationPosition, error: any = undefined) {
            console.log(source, position, error);
            if (!cancelled) {
                setState({ ...state, position: position || state.position, error });
            }
        }
    }
};
