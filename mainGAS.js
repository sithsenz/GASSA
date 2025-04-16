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

    if (e.parameter.laman) {
        return Alamat[e.parameter.laman]();
    }
}


function ambilData(hospital, ujian, perjanjian) {
    bitData = hospital + ujian + perjanjian;
    if (bitData == 1) {
        let dataDataHospital = lembaranDataHospital.getRange("A1").getDataRegion().getDisplayValues();
        dataDataHospital.shift();

        return dataDataHospital;
    }
}


function kemaskiniHospital(dataBaru) {
    let idHospital = dataBaru[0];
    let baris = Number(idHospital);

    for (let i=3; i<12; i++) {
        lembaranDataHospital.getRange(baris, i).setValue(dataBaru[i-2]);
    }

    return ambilData(1, 0, 0);
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