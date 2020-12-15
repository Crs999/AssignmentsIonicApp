export interface AssignmentProperties {
  _id?: string;
  title: string;
  description:string;
  pupilID:string;
  date:string;
  // version:number;
  version:string;
  photoURL:string;
  lat?:number;
  lng?:number;
}
