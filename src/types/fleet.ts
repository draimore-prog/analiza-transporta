export interface Vehicle {
  rb?: number;
  reg: string;
  garazniBroj?: string;
  tipMehan: string;
  markaVoz?: string;
  modelVoz?: string;
  godProizvodnje?: string;
  brojSasije?: string;
  status?: 'Aktivno' | 'Prodato' | 'Rashodovano' | string;
  pocetnaKmRh?: number;
  prodajnaKmRh?: number;
  isCustomEdit?: boolean;
}

export type VehicleCategory = 
  | 'Teretna vozila' 
  | 'Putnička vozila' 
  | 'Priključna vozila' 
  | 'Radna mašina' 
  | 'Skladišna mehanizacija' 
  | 'Servis motornih vozila' 
  | 'Ostalo';
