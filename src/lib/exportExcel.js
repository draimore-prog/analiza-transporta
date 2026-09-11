import * as XLSX from "xlsx";
import { formatDate, normalizeVehicleStatus } from "./calculations.js";

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
    "Status": normalizeVehicleStatus(v.status)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vozni_Park");
  XLSX.writeFile(wb, filename);
}

export function exportTransactionsToExcel(data, filename = "Tabela_Servisa_Transakcije.xlsx") {
  const rows = data.map((c, i) => {
    let usageStr = "-";
    const tip = (c.tipMehan || "").toLowerCase();
    if (tip.includes("priključn") || tip.includes("prikljucn")) {
      usageStr = "-";
    } else if (tip.includes("radn") || tip.includes("skladi") || tip.includes("viljuš") || tip.includes("viljusk")) {
      usageStr = (c.radniSati != null ? c.radniSati : 0) + " h";
    } else if (c.kilometraza != null) {
      usageStr = Math.round(c.kilometraza).toLocaleString("bs-BA") + " km";
    }

    return {
      "R.b.": i + 1,
      "Datum": formatDate(c.datumObj || c.datum),
      "Broj Fakture": c.brojRacuna || "-",
      "Interno / Eksterno": c.type === "Interno" || (c.fakturaTip && c.fakturaTip.toLowerCase().includes("intern")) ? "Interno" : "Eksterno",
      "Godina": c.year,
      "Garažni Broj": c.garazniBroj || "-",
      "Registracija / Oznaka": c.reg,
      "Tip Vozila": c.tipMehan || "-",
      "Marka": c.markaVoz || "-",
      "Kilometraža / Radni sati": usageStr,
      "Segment": c.segment || "-",
      "Opis Popravke": c.opisPopravke || c.opisRadova || c.opis || "-",
      "Serviser / Dobavljač": c.dobavljacOrig || c.dobavljac || "-",
      "Trošak (KM)": c.cost || 0
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Servisi");
  XLSX.writeFile(wb, filename);
}
