const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'c:\\Users\\Bingo\\Desktop\\Analiza transporta';
const ponjavaPath = path.join(dir, 'Ponjava.xlsx');

console.log("=== TESTING BRAND & MODEL EXTRACTION RULES ===");

function normalizeRegKey(str) {
    if (!str) return '';
    let s = str.toString().trim().toUpperCase();
    if (s === '-' || s === 'NEPOZNATO' || s === '/' || s === 'N/A' || s === '0' || s === 'NEPOZNATA') return '';
    // Strip spaces and trailing dots for matching: e.g. "128 I." -> "128I", "GB 40894" -> "GB40894"
    return s.replace(/[\s\.-]/g, '');
}

// Manufacturer pattern matching
const BRANDS = [
    { name: 'Jungheinrich', patterns: ['jungheinrich', 'jungeihrich', 'jungheinric'] },
    { name: 'Linde', patterns: ['linde'] },
    { name: 'Mercedes Benz', patterns: ['mercedes', 'mercedes-benz', 'actros', 'sprinter', 'atego', 'arocs'] },
    { name: 'Volkswagen', patterns: ['volkswagen', 'vw', 'caddy', 'crafter', 'transporter', 'passat', 'golf', 'touareg', 'amarok'] },
    { name: 'Škoda', patterns: ['škoda', 'skoda', 'octavia', 'fabia', 'superb', 'kodiaq', 'kamiq', 'yeti'] },
    { name: 'Audi', patterns: ['audi'] },
    { name: 'BMW', patterns: ['bmw'] },
    { name: 'MAN', patterns: ['man', 'tga', 'tgs', 'tgx'] },
    { name: 'Volvo', patterns: ['volvo', 'fh', 'fm', 'fl'] },
    { name: 'Iveco', patterns: ['iveco', 'daily', 'stralis'] },
    { name: 'Peugeot', patterns: ['peugeot', 'peugot', 'boxer', 'partner', 'expert'] },
    { name: 'Ford', patterns: ['ford', 'transit', 'fiesta', 'focus', 'ranger'] },
    { name: 'Renault', patterns: ['renault', 'master', 'traffik', 'kangoo', 'clio', 'megane'] },
    { name: 'Fiat', patterns: ['fiat', 'ducato', 'doblo', 'fiorino'] },
    { name: 'Still', patterns: ['still'] },
    { name: 'Toyota', patterns: ['toyota'] },
    { name: 'Caterpillar', patterns: ['caterpillar', 'cat'] },
    { name: 'Komatsu', patterns: ['komatsu'] },
    { name: 'Nissan', patterns: ['nissan'] },
    { name: 'Suzuki', patterns: ['suzuki'] },
    { name: 'Seat', patterns: ['seat'] },
    { name: 'Hyundai', patterns: ['hyundai'] },
    { name: 'Kia', patterns: ['kia'] },
    { name: 'Daf', patterns: ['daf'] },
    { name: 'Scania', patterns: ['scania'] },
    { name: 'Mitsubishi', patterns: ['mitsubishi'] },
    { name: 'JCB', patterns: ['jcb'] }
];

function extractBrandAndModel(rawMarka, rawModel, tipMehan) {
    let combined = `${rawMarka || ''} ${rawModel || ''}`.trim();
    let combinedLower = combined.toLowerCase();

    let matchedBrand = null;
    for (let b of BRANDS) {
        if (b.patterns.some(p => combinedLower.includes(p))) {
            matchedBrand = b.name;
            break;
        }
    }

    if (!matchedBrand) {
        if (tipMehan === 'Skladišna mehanizacija') matchedBrand = 'Linde';
        else matchedBrand = 'Ostalo';
    }

    // Clean model string: remove location words, "VILJUSKAR", "PLIN", etc.
    let cleanModel = combined;
    // Remove brand names from model string
    BRANDS.forEach(b => {
        b.patterns.forEach(p => {
            let reg = new RegExp(p, 'gi');
            cleanModel = cleanModel.replace(reg, '');
        });
    });

    // Remove noise words (cities, "viljuskar", "nafta", "plin", etc.)
    cleanModel = cleanModel.replace(/vilj\w*|viljuškar|viljuskar|pogon|nafta|plin|dizel|struja|električni|prebačen|lokacija|direkcija|regionalni|menadžer|maloprodaja|održavanje|srebrenik|tuzla|trebinje|visoko|sarajevo|dubica|mostar|bihać|bihac|zenica|prijedor|brčko|brcko|kiseljak|bjeljina|bijeljina|tuš|zivinice|živinice/gi, '');
    cleanModel = cleanModel.replace(/[\/\\,\(\)]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanModel || cleanModel.length < 2 || cleanModel === '-') {
        cleanModel = matchedBrand;
    }

    return { marka: matchedBrand, model: cleanModel };
}

console.log("Sample Brand & Model Parsing Test:");
let samples = [
    { marka: 'JUNGHEINRICH VILJUSKAR PLIN BOS.DUBICA', model: 'GL16C', tip: 'Skladišna mehanizacija' },
    { marka: 'Linde VILJ NAFTA ĐOLI POLJANA,prebačen na ciljuge plastenici', model: 'H30D-03', tip: 'Skladišna mehanizacija' },
    { marka: 'Mercedes', model: 'GLE 300D', tip: 'Putničko' },
    { marka: 'Peugot', model: 'Boxer', tip: 'Teretno' },
    { marka: 'Audi', model: 'Q5 2.0 TDI', tip: 'Putničko' }
];

samples.forEach(s => {
    let res = extractBrandAndModel(s.marka, s.model, s.tip);
    console.log(`INPUT: Marka="${s.marka}", Model="${s.model}" => MARKA="${res.marka}", MODEL="${res.model}"`);
});
