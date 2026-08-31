import * as XLSX from "xlsx";
import { formatDate } from "./calculations.js";

export function exportMasterFleetToExcel(fleet, filename = "Sifrarnik_Voznog_Parka_2026.xlsx") {
  const rows = fleet.map((v, i) => ({
    "R.b.": i + 1,
    "Garažni Broj": v.garazniBroj || "-",
    "Registarska Oznaka": v.reg,
    "Tip Vozila / Mehanizacije": v.tipMehan,
    "Marka": v.markaVoz || "-",
    "Model": v.modelVoz || "-",
    "Godište": v.godProizvodnje || "-",
    "Broj Šasije": v.brojSasije || "-",
    "Status": v.status || "Aktivno"
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vozni_Park");
  XLSX.writeFile(wb, filename);
}

export function exportTransactionsToExcel(data, filename = "Tabela_Servisa_Transakcije.xlsx") {
  const rows = data.map((c, i) => ({
    "R.b.": i + 1,
    "Datum": formatDate(c.datumObj || c.datum),
    "Godina": c.year,
    "Garažni Broj": c.garazniBroj || "-",
    "Registracija / Oznaka": c.reg,
    "Tip Vozila": c.tipMehan || "-",
    "Marka": c.markaVoz || "-",
    "Segment": c.segment || "-",
    "Opis Popravke": c.opisPopravke || c.opisRadova || c.opis || "-",
    "Serviser / Dobavljač": c.dobavljacOrig || c.dobavljac || "-",
    "Trošak (KM)": c.cost || 0
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Servisi");
  XLSX.writeFile(wb, filename);
}
