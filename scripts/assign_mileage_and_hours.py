import os
import re
import json
import datetime
import pandas as pd
import numpy as np

# Set stdout encoding
import sys
sys.stdout.reconfigure(encoding='utf-8')

EXCEL_PATH = r"C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx"
FLEET_DATA_PATH = r"c:\Users\emir.durakovic\Desktop\analiza-transporta-master\fleet_data.json"
PUBLIC_DATA_PATH = r"c:\Users\emir.durakovic\Desktop\analiza-transporta-master\public\fleet_data.json"
ODOMETER_JSON_PATH = r"c:\Users\emir.durakovic\Desktop\analiza-transporta-master\public\fleet_odometer.json"
WORK_ACTIONS_PATH = r"C:\Users\emir.durakovic\Desktop\Gemini-Files\Work\mileage_update_actions.json"

def normalize_reg(reg):
    if not reg or pd.isna(reg):
        return ""
    s = str(reg).strip().upper()
    s = s.replace("Š", "S").replace("Č", "C").replace("Ć", "C").replace("Ž", "Z").replace("Đ", "DJ")
    return re.sub(r"[^A-Z0-9]", "", s)

def normalize_mt(mt):
    if not mt or pd.isna(mt):
        return ""
    s = str(mt).strip()
    if s.endswith(".0"):
        s = s[:-2]
    if s.lower() in ["nan", "none", "n/a", "/", "-", ""]:
        return ""
    return re.sub(r"[^A-Z0-9]", "", s.upper())

def main():
    print("=== 1. UČITAVANJE EVIDENCIJE TOČENJA GORIVA I KILOMETRAŽA ===")
    df_fuel = pd.read_excel(EXCEL_PATH, sheet_name='DATA')
    print(f"Ukupno redova u DATA sheetu: {len(df_fuel):,}")

    km_col = [c for c in df_fuel.columns if 'Kilometra' in c][0]
    reg_col = [c for c in df_fuel.columns if 'Registarska' in c][0]
    mt_col = [c for c in df_fuel.columns if 'Mjesto' in c][0]
    date_col = [c for c in df_fuel.columns if 'Datum' in c][0]

    fuel_by_reg = {}
    fuel_by_mt = {}
    odometer_timeline = {} # za public/fleet_odometer.json

    for idx, r in df_fuel.iterrows():
        km = r[km_col]
        if pd.isna(km) or km <= 0:
            continue
        d = r[date_col]
        if pd.isna(d):
            continue
        
        try:
            d_dt = pd.to_datetime(d, dayfirst=True)
            if hasattr(d_dt, 'tz_localize') and d_dt.tzinfo is not None:
                d_dt = d_dt.tz_localize(None)
            elif hasattr(d_dt, 'tz') and d_dt.tz is not None:
                d_dt = d_dt.tz_localize(None)
        except Exception:
            continue

        km_int = int(round(km))
        d_str = d_dt.strftime('%Y-%m-%d')

        r_n = normalize_reg(r[reg_col])
        m_n = normalize_mt(r[mt_col])

        if r_n:
            if r_n not in fuel_by_reg:
                fuel_by_reg[r_n] = []
            fuel_by_reg[r_n].append((d_dt, km_int))
            if r_n not in odometer_timeline:
                odometer_timeline[r_n] = []
            odometer_timeline[r_n].append([d_str, km_int])

        if m_n:
            if m_n not in fuel_by_mt:
                fuel_by_mt[m_n] = []
            fuel_by_mt[m_n].append((d_dt, km_int))
            if m_n not in odometer_timeline:
                odometer_timeline[m_n] = []
            odometer_timeline[m_n].append([d_str, km_int])

    # Sort timelines
    for k in fuel_by_reg:
        fuel_by_reg[k].sort(key=lambda x: x[0])
    for k in fuel_by_mt:
        fuel_by_mt[k].sort(key=lambda x: x[0])
    for k in odometer_timeline:
        odometer_timeline[k].sort(key=lambda x: x[0])

    print(f"Jedinstvenih vozila/kartica u evidenciji točenja: {len(odometer_timeline)}")

    # Sačuvaj public/fleet_odometer.json za brzi frontend lookup u NewCostModal
    print(f"Spašavam klijentsku bazu točenja u: {ODOMETER_JSON_PATH}...")
    with open(ODOMETER_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(odometer_timeline, f, separators=(',', ':'))
    print(f"Veličina fleet_odometer.json: {os.path.getsize(ODOMETER_JSON_PATH)/1024:.1f} KB")

    print("\n=== 2. DODJELA KILOMETRAŽA I RADNIH SATI U BAZI SERVISA ===")
    with open(FLEET_DATA_PATH, 'r', encoding='utf-8') as f:
        fleet_data = json.load(f)

    records = fleet_data.get('records', [])
    print(f"Ukupno zapisa u fleet_data.json: {len(records):,}")

    stats = {
        'teretna_matched': 0,
        'teretna_unmatched': 0,
        'putnicka_matched': 0,
        'putnicka_unmatched': 0,
        'prikljucna_null': 0,
        'radna_hours_0': 0,
        'skladisna_hours_0': 0,
        'smv_null': 0
    }

    # Mapa za ažuriranje Firestore-a: { docId: { kilometraza: ..., radniSati: ... } }
    firestore_updates = {}

    for r in records:
        tip = r.get('tipMehan', '')
        r_id = r.get('id')
        
        assigned_km = None
        assigned_hours = None

        if tip in ['Teretna vozila', 'Putnička vozila']:
            r_n = normalize_reg(r.get('reg'))
            m_n = normalize_mt(r.get('garazniBroj'))
            readings = fuel_by_reg.get(r_n) or fuel_by_mt.get(m_n)
            
            if readings and r.get('datum'):
                try:
                    rep_dt = pd.to_datetime(r['datum'])
                    if hasattr(rep_dt, 'tz_localize') and rep_dt.tzinfo is not None:
                        rep_dt = rep_dt.tz_localize(None)
                    elif hasattr(rep_dt, 'tz') and rep_dt.tz is not None:
                        rep_dt = rep_dt.tz_localize(None)

                    best_km = None
                    best_diff = None
                    for f_dt, f_km in readings:
                        diff = abs((rep_dt - f_dt).total_seconds())
                        if best_diff is None or diff < best_diff:
                            best_diff = diff
                            best_km = f_km
                    
                    assigned_km = int(best_km)
                    if tip == 'Teretna vozila':
                        stats['teretna_matched'] += 1
                    else:
                        stats['putnicka_matched'] += 1
                except Exception:
                    if tip == 'Teretna vozila':
                        stats['teretna_unmatched'] += 1
                    else:
                        stats['putnicka_unmatched'] += 1
            else:
                if tip == 'Teretna vozila':
                    stats['teretna_unmatched'] += 1
                else:
                    stats['putnicka_unmatched'] += 1

        elif tip in ['Radna mašina', 'Skladišna mehanizacija']:
            assigned_hours = 0
            if tip == 'Radna mašina':
                stats['radna_hours_0'] += 1
            else:
                stats['skladisna_hours_0'] += 1
        elif tip == 'Priključna vozila':
            stats['prikljucna_null'] += 1
        else:
            stats['smv_null'] += 1

        # Postavi na objekt
        r['kilometraza'] = assigned_km
        r['radniSati'] = assigned_hours

        if r_id:
            firestore_updates[r_id] = {
                'kilometraza': assigned_km,
                'radniSati': assigned_hours
            }

    print("\nStatistika obrade:")
    for k, v in stats.items():
        print(f" - {k}: {v:,}")

    # Ažuriraj metapodatke
    if 'metadata' not in fleet_data:
        fleet_data['metadata'] = {}
    fleet_data['metadata']['lastMileageAssigned'] = datetime.datetime.now().isoformat()
    fleet_data['metadata']['mileageStats'] = stats

    print(f"\nSpašavam ažurirani fleet_data.json...")
    with open(FLEET_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(fleet_data, f, ensure_ascii=False, indent=2)

    print(f"Spašavam ažurirani public/fleet_data.json...")
    with open(PUBLIC_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(fleet_data, f, ensure_ascii=False, indent=2)

    # Sačuvaj akcije za Firestore
    os.makedirs(os.path.dirname(WORK_ACTIONS_PATH), exist_ok=True)
    with open(WORK_ACTIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(firestore_updates, f)
    print(f"Pripremljeno {len(firestore_updates):,} ažuriranja za Firestore u {WORK_ACTIONS_PATH}.")

if __name__ == '__main__':
    main()
