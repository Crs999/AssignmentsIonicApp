import { useCamera } from '@ionic/react-hooks/camera'; //custom hook definit de cei de la Ionic
import {CameraPhoto, CameraResultType, CameraSource, FilesystemDirectory, Storage} from '@capacitor/core';
import {useContext, useEffect, useState} from 'react';
import { base64FromPath, useFilesystem } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import {AssignmentContext} from "../assignments/AssignmentProvider";

export interface Photo {
  filepath: string;
  webviewPath?: string;
  // itemID:string
}

const PHOTO_STORAGE = 'photos';

export function usePhotoGallery() {
  const { getPhoto } = useCamera();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { get, set } = useStorage();
  const { deleteFile, readFile, writeFile } = useFilesystem();
  const {assignments, fetching}=useContext(AssignmentContext)
  const takePhoto = async () => {
    const cameraPhoto = await getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    const fileName = new Date().getTime() + '.jpeg';
    const savedFileImage = await savePicture(cameraPhoto, fileName);
    console.log("saved "+JSON.stringify(savedFileImage))
    let index=photos.findIndex(p=>p.filepath===savedFileImage.filepath);
    if(index>=0) photos.splice(index,1)

    const newPhotos=[savedFileImage,...photos]
    setPhotos(newPhotos);
    set(PHOTO_STORAGE, JSON.stringify(newPhotos));
    return savedFileImage.filepath
  };

  const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
    const base64Data = await base64FromPath(photo.webPath!);
    await writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  };
  useEffect(()=> {
    const loadSaved = async () => {
      const photosString = await get(PHOTO_STORAGE);
      const photos = (photosString ? JSON.parse(photosString) : []) as Photo[];
      if(assignments)
        for(let as of assignments){
          if(as.photoURL!=="") {
            try {
              const file = await readFile({
                path: as.photoURL,
                directory: FilesystemDirectory.Data
              });
              let photoToAdd = {filepath: `${as.photoURL}`, webviewPath: `data:image/jpeg;base64,${file.data}`};
              if (photos.findIndex(p => p.filepath === photoToAdd.filepath) === -1) photos.push(photoToAdd)
            }catch{}
          }
        }
      setPhotos(photos);
      set(PHOTO_STORAGE, JSON.stringify(photos));
  }
    loadSaved();
  }, [get, readFile, assignments])

  const deletePhoto = async (photo: Photo) => {
    const newPhotos = photos.filter(p => p.filepath !== photo.filepath);
    set(PHOTO_STORAGE, JSON.stringify(newPhotos));
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data
    });
    setPhotos(newPhotos);
  };

  return {
    photos,
    takePhoto,
    deletePhoto, savePicture
  };
}
