/**
 * Objek Alamat menguruskan pemetaan laman kepada fungsi pembina laman.
 *
 * Objek ini membolehkan pendaftaran fungsi pembina laman berdasarkan nama laman.
 */
const Alamat = {
    /**
     * Mendaftarkan fungsi pembina laman untuk laman tertentu.
     *
     * @param {string} laman Nama laman untuk didaftarkan.
     * @param {function(): GoogleAppsScript.HTML.HtmlOutput} fungsi Fungsi pembina laman yang akan dipanggil.
     */
    jalan: function(laman, fungsi) {
        Alamat[laman] = fungsi;
    }
};


/**
 * Menangani permintaan GET HTTP.
 *
 * Fungsi ini mendaftarkan laman dan mengembalikan laman yang diminta berdasarkan parameter "laman" dalam
 * permintaan GET.
 *
 * @param {GoogleAppsScript.Events.DoGet} e Objek peristiwa permintaan GET.
 * @returns {GoogleAppsScript.HTML.HtmlOutput|undefined} Output HTML laman yang diminta, atau undefined
 * jika laman tidak ditemui.
 */
function doGet(e) {
    Alamat.jalan("daftarHospital", binaLamanDaftarHospital);
    Alamat.jalan("daftarUjian", binaLamanDaftarUjian);

    if (e.parameter.laman) {
        return Alamat[e.parameter.laman]();
    }
}


// Tugasan: Kaji semula JSDoc dan komen fungsi ini
/**
 * Mengambil data dari Google Sheets berdasarkan kombinasi parameter bitmask.
 * 
 * @param {1|0} hospital - Flag untuk akses Data Hospital (1 = ya, 0 = tidak)
 * @param {2|0} ujian - Flag untuk akses Data Ujian (2 = ya, 0 = tidak)
 * @param {4|0} perjanjian - Flag untuk akses Data Perjanjian (4 = ya, 0 = tidak)
 * @returns {Array[]|undefined} - Data tanpa header atau undefined jika tidak memenuhi kondisi
 * 
 * @description
 * Sistem bitmask menentukan lembaran mana yang diakses:
 * - Nilai parameter: Hospital(1) + Ujian(2) + Perjanjian(4) = Total
 * - Contoh: 
 *   - Total 1: Hanya Data Hospital
 *   - Total 3: Hospital + Ujian (1+2)
 *   - Total 5: Hospital + Perjanjian (1+4)
 * 
 */
function ambilData(bitmask, carian=null) {
    function ambilSemua(lembaran) {
        let data = lembaran.getRange("A1").getDataRegion().getDisplayValues();
        data.shift();

        return data;
    }

    function ambilTerpilih(enumPilihan) {
        let dataTerpilih = [];

        if (enumPilihan == 1) {
            let data = ambilSemua(lembaranDataHospital);
            data.forEach(rekod => {
                if (rekod[11] == "Aktif") {
                    let d = [rekod[0], rekod[1], rekod[2]];
                    dataTerpilih.push(d);
                }
            });
        }

        return dataTerpilih;
    }

    if (bitmask == 1) {
        let dataHospital = ambilSemua(lembaranDataHospital);

        return dataHospital;
    } else if (bitmask == 3) {
        let dataHospital = ambilTerpilih(1);

        return dataHospital;
    }
}


/**
 * Kemaskini data hospital sedia ada dalam Google Sheets.
 * - Lajur 1: ID Hospital (diperlukan untuk mencari baris)
 * - Lajur 2: Kunci (hashed) - tidak diubah dalam fungsi ini
 * - Lajur 3-12: Data lain
 * 
 * @param {Array} dataBaru - Array data hospital [id, Nama Hospital, ...]
 * @returns {Array[]} - Data terkini hospital (setelah kemaskini)
 */
function kemaskiniHospital(dataBaru) {
    let idHospital = dataBaru[0];  // ID Hospital (kolum tersembunyi)
    let baris = Number(idHospital);  // Convert ID ke nombor baris

    // Kemaskini kolum 3-12 (skip lajur 1 dan 2)
    for (let i=3; i<13; i++) {
        lembaranDataHospital.getRange(baris, i).setValue(dataBaru[i-2]);
    }

    return ambilData(1, 0, 0);  // Kembalikan data terkini
}


/**
 * Daftar hospital baru ke Google Sheets.
 * - Lajur 1: ID Hospital (auto-increment oleh Sheets)
 * - Lajur 2: Kunci (hashed) - dihantar dari client
 * - Lajur 3-12: Data lain
 * 
 * @param {Array} dataHospitalBaru - Array data hospital ["", kunci, namaHospital, ...]
 * @returns {Array[]} - Data terkini hospital (termasuk rekod baru)
 */
function daftarHospitalBaru(dataHospitalBaru) {
    // Tambah rekod baru (auto isi ID di lajur 1)
    lembaranDataHospital.appendRow(dataHospitalBaru);

    return ambilData(1, 0, 0);  // Kembalikan data terkini
}


/**
 * Memasukkan kandungan keratan kod JavaScript yang disimpan dalam file HTML.
 * Fungsi ini membaca kandungan file HTML yang ditentukan menggunakan
 * `HtmlService.createHtmlOutputFromFile()` dan mengembalikannya sebagai string.
 *
 * @param {string} namaFile Nama file HTML (tanpa sambungan .html) yang
 * mengandungi keratan kod JavaScript.
 * @return {string} Kandungan file HTML yang ditentukan sebagai string,
 * mewakili keratan kod JavaScript.
 */
function merangkumiFileJS(namaFile) {
    return HtmlService.createHtmlOutputFromFile(namaFile).getContent();
}


function binaLamanDaftarUjian() {
    return binaLaman("daftarUjian");
}


/**
 * Mencipta dan mengembalikan laman pendaftaran hospital.
 *
 * Fungsi ini menggunakan templat HTML dari fail "daftarHospital"
 * untuk membina laman pendaftaran hospital.
 *
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Output HTML laman pendaftaran hospital yang dinilai.
 */
function binaLamanDaftarHospital() {
    return binaLaman("daftarHospital");
}


/**
 * Mencipta dan menilai templat HTML dari nama fail yang diberikan.
 *
 * @param {string} namaFile Nama fail HTML untuk mencipta templat daripadanya.
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Output HTML yang dinilai.
 */
function binaLaman(namaFile) {
    const laman = HtmlService.createTemplateFromFile(namaFile);

    return laman.evaluate();
}


/**
 *Pemalar yang digunakan dalam projek ini
*/
const hamparanDataHospital = SpreadsheetApp.openById("1MmpSWPsl4wCdZ3vV0cSReLfIJs3fRvz73S7oV8YPyWg");
const hamparanDataUjian = SpreadsheetApp.openById("1s5d06iqPI6TrwlZDAYyjRr0O0g1dHI1AULhHbWZCMDo");
const hamparanDataPerjanjian = SpreadsheetApp.openById("1ZAT5On_Ag_2RD9L-8RivArWEoCaXn5iTBx0b2rGBu84");


/**
 * Sumber data
 * 1. Data Hospital
 * 2. Data Ujian
 * 3. Data Perjanjian
 * 
 * Tidak termasuk baris pertama iaitu nama/tajuk lajur
*/

//Data Hospital
const lembaranDataHospital = hamparanDataHospital.getSheetByName("Sheet1");

//Data Ujian
const lembaranDataUjian = hamparanDataUjian.getSheetByName("Sheet1");
let dataDataUjian = lembaranDataUjian.getRange("A1").getDataRegion().getDisplayValues();
dataDataUjian.shift();

//Data Perjanjian
const lembaranDataPerjanjian = hamparanDataPerjanjian.getSheetByName("Sheet1");
let dataDataPerjanjian = lembaranDataPerjanjian.getRange("A1").getDataRegion().getDisplayValues();
dataDataPerjanjian.shift();