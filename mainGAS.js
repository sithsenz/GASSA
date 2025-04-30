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
    Alamat.jalan("daftarPerjanjian", binaLamanDaftarPerjanjian);

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
function ambilData(butiran, carian=null) {
    function ambilSemua(lembaran) {
        let data = lembaran.getRange("A1").getDataRegion().getDisplayValues();
        data.shift();

        return data;
    }

    if (butiran == 1) {  // semua data hospital
        let dataHospital = ambilSemua(lembaranDataHospital);

        let dataAktif = dataHospital.filter(rekod => {return rekod[11] == "Aktif"});

        return dataAktif;

    } else if (butiran == 2) {  // data hospital lajur terpilih
        let dataHospital = [];
        let data = ambilSemua(lembaranDataHospital);
        data.forEach(rekod => {
            if (rekod[11] == "Aktif") {
                dataHospital.push([rekod[0], rekod[1], rekod[2]]);
            }
        });

        return dataHospital;

    } else if (butiran == 3) {  // data ujian bagi ID hospital terpilih
        let dataUjian = [];
        let bilanganID = carian.length;
        const carianID = new Set(carian);

        let dataU = ambilSemua(lembaranDataUjian).filter(rekod => {return carianID.has(rekod[1])});

        if (bilanganID == 1) {
            dataUjian = dataU;

        } else if (bilanganID > 1) {
            let [penokok, baki] = bahagiBaki(dataU.length, 100);

            let pemula = Math.floor(Math.random() * baki);

            for (let i=pemula; i<dataU.length; i+=penokok) {
                dataUjian.push(dataU[i]);
            }
        }

        return dataUjian;

    } else if (butiran == 4) { // data ujian bagi carian yang muncul dalam nama ujian
        let dataUjian = [];
        let dataU = ambilSemua(lembaranDataUjian).filter(hospital => {
            let namaUjian = hospital[2].toLowerCase();

            return carian.every(perkatan => namaUjian.includes(perkatan));
        });

        if (dataU.length <= 0) {
            return "Tiada rekod sepadan dijumpai";

        } else if (dataU.length <= 100) {
            dataUjian = dataU;
        
        } else if (dataU.length > 100) {
            let [penokok, baki] = bahagiBaki(dataU.length, 100);
            let pemula = Math.floor(Math.random() * baki);

            for (let i=pemula; i<dataU.length; i+=penokok) {
                dataUjian.push(dataU[i]);
            }
        }

        return dataUjian;

    } else if (butiran == 5) {  // data perjanjian bagi ID hospital merujuk yang terpilih
        let dataJ = ambilSemua(lembaranDataPerjanjian).filter(rekod => {return rekod[1] == carian});

        let senaraiUjian = [];

        for (rekod of dataJ) {
            senaraiUjian.push(rekod[2]);
        }

        const setIDujian = new Set(senaraiUjian);

        let dataU = ambilSemua(lembaranDataUjian).filter(rekod => {return setIDujian.has(rekod[0])});

        return [dataJ, dataU, "Merujuk"];
    
    } else if (butiran == 6) {  // data perjanjian bagi ID hospital rujukan yang terpilih
        let dataUjian = ambilSemua(lembaranDataUjian).filter(rekod => {return rekod[1] == carian});
        
        let senaraiUjian = [];
        let senaraiU = [];

        for (rekod of dataUjian) {
            senaraiUjian.push(rekod[0]);
        }

        const setIDujian = new Set(senaraiUjian);

        let dataJ = ambilSemua(lembaranDataPerjanjian).filter(rekod => {return setIDujian.has(rekod[2])});

        for (rekod of dataJ) {
            senaraiU.push(rekod[2]);
        }

        const setIDu = new Set(senaraiU);

        let dataU = dataUjian.filter(rekod => {return setIDu.has(rekod[0])});

        return [dataJ, dataU, "Rujukan"];
    }
}


function kemaskiniStatusPerjanjian(idPerjanjian, statusPerjanjian, tarikh, idHospital, sebagai) {
    let baris = Number(idPerjanjian);

    lembaranDataPerjanjian.getRange(baris, 4).setValue(statusPerjanjian);
    lembaranDataPerjanjian.getRange(baris, 5).setValue(tarikh);

    if (sebagai == "Merujuk") {
        return ambilData(5, idHospital);

    } else if (sebagai == "Rujukan") {
        return ambilData(6, idHospital);
    }
}


function bahagiBaki(pengangka, penyebut) {
    let nomborBulat = Math.floor(pengangka / penyebut);
    let baki = pengangka % penyebut;

    return [nomborBulat, baki];
}


function kemaskiniUjian(dataBaru) {
    let idUjian = dataBaru[0];
    let baris = Number(idUjian);
    let idHospital = [dataBaru[1]];

    for (let i=3; i<8; i++) {
        lembaranDataUjian.getRange(baris, i).setValue(dataBaru[i-1]);
    }

    return ambilData(3, idHospital);
}


function daftarUjianBaru(dataUjianBaru) {
    let idHospital = [dataUjianBaru[1]];

    lembaranDataUjian.appendRow(dataUjianBaru);
    let jumlahBaris = lembaranDataUjian.getLastRow()-1;  // tidak termasuk baris tajuk
    lembaranDataUjian.getRange(2, 1, jumlahBaris).setNumberFormat("000000");
    lembaranDataUjian.getRange(2, 2, jumlahBaris).setNumberFormat("000000");

    return ambilData(3, idHospital);
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

    return ambilData(1);  // Kembalikan data terkini
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

    return ambilData(1);  // Kembalikan data terkini
}


function mohonPerjanjianBaru(data) {
    function ambilSemua(lembaran) {
        let data = lembaran.getRange("A1").getDataRegion().getDisplayValues();
        data.shift();

        return data;
    }

    let dataPerjanjian = ambilSemua(lembaranDataPerjanjian);

    let rujukanSediaAda = [];

    for (rekod of dataPerjanjian) {
        if (rekod[1] == data[1]) {rujukanSediaAda.push(rekod[2]);}
    }

    const setRujukanSediaAda = new Set(rujukanSediaAda);

    if (setRujukanSediaAda.has(data[2])) {
        return "Sudah ada";
    }

    lembaranDataPerjanjian.appendRow(data);
    let jumlahBaris = lembaranDataPerjanjian.getLastRow() - 1;  //tidak termasuk baris tajuk
    lembaranDataPerjanjian.getRange(2, 1, jumlahBaris).setNumberFormat("000000");
    lembaranDataPerjanjian.getRange(2, 2, jumlahBaris).setNumberFormat("000000");
    lembaranDataPerjanjian.getRange(2, 3, jumlahBaris).setNumberFormat("000000");

    return "Permohonan diterima";
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


function binaLamanDaftarPerjanjian() {
    return binaLaman("daftarPerjanjian");
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

//Data Perjanjian
const lembaranDataPerjanjian = hamparanDataPerjanjian.getSheetByName("Sheet1");
