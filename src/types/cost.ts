export interface CostItem {
  id?: string;
  year: number;
  month?: number;
  datum?: string;
  datumObj?: Date | null;
  reg: string;
  garazniBroj?: string;
  tipMehan?: string;
  markaVoz?: string;
  modelVoz?: string;
  segment?: string;
  opisPopravke?: string;
  opisRadova?: string;
  opis?: string;
  dijelovi?: string;
  dobavljacOrig?: string;
  dobavljac?: string;
  cost: number;
  fileUrl?: string;
  racunSlika?: string;
  invoiceUrl?: string;
  isNewCustom?: boolean;
  userCreated?: string;
  createdAt?: string;
}
