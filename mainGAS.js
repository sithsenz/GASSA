/*==================
1. Pemalar & Tetapan
==================*/
const ID = {
    HOSPITAL: "1MmpSWPsl4wCdZ3vV0cSReLfIJs3fRvz73S7oV8YPyWg",
    UJIAN: "1s5d06iqPI6TrwlZDAYyjRr0O0g1dHI1AULhHbWZCMDo",
    PERJANJIAN: "1ZAT5On_Ag_2RD9L-8RivArWEoCaXn5iTBx0b2rGBu84",
}

const HOSPITAL ={
    AKTIF: "Aktif",
    RUJUKAN: "Rujukan",
    MERUJUK: "Merujuk",
}

const NOTA = {
    WUJUD: "Sudah ada",
    DITERIMA: "Permohonan diterima",
    TIADA: "Tiada rekod sepadan dijumpai",
}

/*============
2. Sumber Data
============*/
const lembaran = {
    hospital: SpreadsheetApp.openById(ID.HOSPITAL).getSheetByName("Sheet1"),
    ujian: SpreadsheetApp.openById(ID.UJIAN).getSheetByName("Sheet1"),
    perjanjian: SpreadsheetApp.openById(ID.PERJANJIAN).getSheetByName("Sheet1"),
}

/*===============
3. Fungsi Utiliti
===============*/
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
 * Membahagi dua nombor dan mengembalikan hasil bahagi integer serta bakinya.
 * 
 * @param {number} pengangka - Nombor yang ingin dibahagi (dividend)
 * @param {number} penyebut - Nombor pembahagi (divisor)
 * @returns {[number, number]} Array dengan dua nilai:
 *   - [0]: Hasil bahagi integer (pembulatan ke bawah)
 *   - [1]: Baki pembahagian (modulo)
 * 
 * @example
 * bahagiBaki(17, 5);  // [3, 2] (kerana 17 ÷ 5 = 3 dengan baki 2)
 * bahagiBaki(100, 25); // [4, 0]
 */
function bahagiBaki(pengangka, penyebut) {
    let nomborBulat = Math.floor(pengangka / penyebut);
    let baki = pengangka % penyebut;

    return [nomborBulat, baki];
}

// Fungsi helper untuk ambil semua data tanpa header
function ambilSemua(lembaran) {
    // Mengambil semua data dari lembaran Google Sheets (tidak termasuk baris header).
    let data = lembaran.getRange("A1").getDataRegion().getDisplayValues();
    data.shift();  // Buang baris header

    return data;
}

/*===================
4. Operasi Data Utama
===================*/
/**
 * Mengambil dan memproses data dari Google Sheets berdasarkan jenis permintaan (butiran) dan kriteria carian.
 * 
 * @param {number} butiran - Jenis data yang diminta (1-6)
 * @param {string|Array|null} [carian=null] - Kriteria carian (bergantung pada jenis butiran):
 *   - Untuk butiran 1/2: Tidak digunakan
 *   - Untuk butiran 3/4: Array istilah carian
 *   - Untuk butiran 5/6: ID hospital khusus
 * @returns {Array[]|string|Array} - Struktur data berbeza mengikut butiran:
 *   - Butiran 1-4: Array 2D data
 *   - Butiran 5-6: Array [dataPerjanjian, dataUjian, jenisRujukan]
 *   - Butiran 4: String "Tiada rekod sepadan dijumpai" jika tiada hasil
 * 
 * @description
 * ALIRAN KERJA BERDASARKAN BUTIRAN:
 * 
 * [Butiran 1] Semua data hospital aktif
 *   - Filter rekod dengan status "Aktif" (kolum 11)
 * 
 * [Butiran 2] Data hospital (lajur terpilih sahaja)
 *   - Ambil ID, Kunci, Nama (kolum 0-2) untuk hospital aktif
 * 
 * [Butiran 3] Data ujian untuk ID hospital tertentu
 *   - Gunakan Set untuk pencarian efisien
 *   - Sampel rawak jika hasil >100 rekod
 * 
 * [Butiran 4] Data ujian berdasarkan carian teks
 *   - Filter mengikut istilah dalam nama ujian (kolum 2)
 *   - Sampel rawak jika hasil >100 rekod
 * 
 * [Butiran 5] Data perjanjian + ujian (hospital merujuk)
 *   - Gabungkan data dari lembaran Perjanjian dan Ujian
 *   - Tandakan sebagai "Merujuk"
 * 
 * [Butiran 6] Data perjanjian + ujian (hospital rujukan)
 *   - Gabungkan data dari lembaran Perjanjian dan Ujian
 *   - Tandakan sebagai "Rujukan"
 */
function ambilData(butiran, carian=null) {

    // Ambil semua data hospital yang aktif
    if (butiran == 1) {
        let dataHospital = ambilSemua(lembaran.hospital);

        // Filter rekod dengan status "Aktif" (kolum 11)
        let dataAktif = dataHospital.filter(rekod => {return rekod[11] == HOSPITAL.AKTIF});

        if (dataAktif.length < 100) {
            return dataAktif;
        
        } else {
            // Ambil sampel rawak jika data melebihi 100 rekod
            let dataA = [];
            let [penokok, baki] = bahagiBaki(dataAktif.length, 100);
            let pemula = Math.floor(Math.random() * baki);

            for (let i=pemula; i<dataAktif.length; i+=penokok) {
                dataA.push(dataAktif[i]);
            }

            return dataA;
        }

    // Ambil data hospital (lajur terpilih sahaja)
    } else if (butiran == 2) {
        let dataHospital = [];
        let data = ambilSemua(lembaran.hospital);
        data.forEach(rekod => {
            if (rekod[11] == HOSPITAL.AKTIF) {
                dataHospital.push([rekod[0], rekod[1], rekod[2]]);
            }
        });

        return dataHospital;

    // Ambil data ujian untuk ID hospital tertentu
    } else if (butiran == 3) {
        let dataUjian = [];
        let bilanganID = carian.length;

        // Gunakan Set untuk pencarian ID lebih efisien
        const carianID = new Set(carian);

        let dataU = ambilSemua(lembaran.ujian).filter(rekod => {return carianID.has(rekod[1])});

        if (bilanganID == 1) {
            dataUjian = dataU;

        } else if (bilanganID > 1) {
            // Ambil sampel rawak jika data melebihi 100 rekod
            let [penokok, baki] = bahagiBaki(dataU.length, 100);

            let pemula = Math.floor(Math.random() * baki);

            for (let i=pemula; i<dataU.length; i+=penokok) {
                dataUjian.push(dataU[i]);
            }
        }

        return dataUjian;

    // Ambil data ujian berdasarkan carian teks nama ujian
    } else if (butiran == 4) {
        let dataUjian = [];
        let dataU = ambilSemua(lembaran.ujian).filter(hospital => {
            // Semak jika nama ujian mengandungi SEMUA istilah carian
            let namaUjian = hospital[2].toLowerCase();

            return carian.every(perkatan => namaUjian.includes(perkatan));
        });

        if (dataU.length <= 0) {
            // Return mesej khusus jika tiada rekod ditemui
            return NOTA.TIADA;

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

    // Ambil data perjanjian dan ujian bagi hospital yang merujuk
    } else if (butiran == 5) {
        let dataJ = ambilSemua(lembaran.perjanjian).filter(rekod => {return rekod[1] == carian});

        let senaraiUjian = [];

        for (rekod of dataJ) {
            senaraiUjian.push(rekod[2]);
        }

        // Gunakan Set untuk pencarian ID lebih efisien
        const setIDujian = new Set(senaraiUjian);

        let dataU = ambilSemua(lembaran.ujian).filter(rekod => {return setIDujian.has(rekod[0])});

        // Gabungkan data dari 2 lembaran berbeza:
        // 1. Data perjanjian (lembaran.perjanjian)
        // 2. Data ujian (lembaran.ujian)
        // Tandakan jenis hubungan ("Merujuk"/"Rujukan")
        // Return format khusus untuk butiran 5/6:
        // [dataPerjanjian, dataUjian, jenisRujukan]
        return [dataJ, dataU, HOSPITAL.MERUJUK];

    // Ambil data perjanjian dan ujian bagi hospital rujukan
    } else if (butiran == 6) {
        let dataUjian = ambilSemua(lembaran.ujian).filter(rekod => {return rekod[1] == carian});
        
        let senaraiUjian = [];
        let senaraiU = [];

        for (rekod of dataUjian) {
            senaraiUjian.push(rekod[0]);
        }

        // Gunakan Set untuk pencarian ID lebih efisien
        const setIDujian = new Set(senaraiUjian);

        let dataJ = ambilSemua(lembaran.perjanjian).filter(rekod => {return setIDujian.has(rekod[2])});

        for (rekod of dataJ) {
            senaraiU.push(rekod[2]);
        }

        // Gunakan Set untuk pencarian ID lebih efisien
        const setIDu = new Set(senaraiU);

        let dataU = dataUjian.filter(rekod => {return setIDu.has(rekod[0])});

        // Gabungkan data dari 2 lembaran berbeza:
        // 1. Data perjanjian (lembaran.perjanjian)
        // 2. Data ujian (lembaran.ujian)
        // Tandakan jenis hubungan ("Merujuk"/"Rujukan")
        // Return format khusus untuk butiran 5/6:
        // [dataPerjanjian, dataUjian, jenisRujukan]
        return [dataJ, dataU, HOSPITAL.RUJUKAN];
    }
}

/*=========================
5. Pengurusan Data Hospital
=========================*/
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

    // Kemaskini kolum 3-13 (skip lajur 1 dan 2)
    let data = [dataBaru.slice(1)];  // data indeks 1-11 untuk dikemaskini
    lembaran.hospital.getRange(baris, 3, 1, 11).setValues(data);

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
    lembaran.hospital.appendRow(dataHospitalBaru);

    return ambilData(1);  // Kembalikan data terkini
}

/*======================
6. Pengurusan Data Ujian
======================*/
/**
 * Mengemaskini maklumat ujian dalam Google Sheets dan memulangkan data terkini.
 * 
 * @param {Array} dataBaru - Array data untuk dikemaskini dengan struktur:
 *   - [0]: ID Ujian (untuk tentukan baris)
 *   - [1]: ID Hospital berkaitan
 *   - [2..6]: Data untuk kolum 3-7 (nama, parameter, dll.)
 * @returns {Array[]} Data ujian terkini untuk hospital berkaitan (dari `ambilData(3, idHospital)`)
 * 
 * @description
 * PROSES:
 * 1. Tentukan baris berdasarkan ID Ujian
 * 2. Kemaskini kolum 3-7 dengan data baru
 * 3. Dapatkan semula data ujian terkini untuk hospital tersebut
 * 
 * @example
 * // Kemaskini ujian ID "45" untuk hospital "HOSP78"
 * const data = kemaskiniUjian(["45", "HOSP78", "Ujian Baru", "Param1", ...]);
 */
function kemaskiniUjian(dataBaru) {
    let idUjian = dataBaru[0];
    let baris = Number(idUjian);  // Tukar ID kepada nombor baris
    let idHospital = [dataBaru[1]];  // Simpan sebagai array untuk ambilData()
    let data = [dataBaru.slice(2)];  // data indeks 2-6 untuk dikemaskini

    // Kemaskini 5 lajur, kolum 3-7 (indeks Sheets) dengan data indeks 2-6 dari array
    lembaran.ujian.getRange(baris, 3, 1, 5).setValues(data);

    return ambilData(3, idHospital);  // Kembalikan data ujian terkini
}

/**
 * Mendaftarkan ujian baru ke dalam sistem dan memulangkan senarai ujian terkini untuk hospital berkaitan.
 * 
 * @param {Array} dataUjianBaru - Data ujian dalam format:
 *   [0]: ID Ujian (auto-generated)
 *   [1]: ID Hospital (format "000000")
 *   [2..n]: Maklumat ujian (nama, parameter, dll.)
 * @returns {Array[]} Senarai ujian terkini untuk hospital tersebut (dari `ambilData(3, idHospital)`)
 * 
 * @description
 * ALUR KERJA:
 * 1. Tambah rekod baru menggunakan `appendRow()`
 * 2. Format ID (kolum 1 & 2) sebagai 6-digit (contoh: "000123")
 * 3. Dapatkan data terkini untuk hospital berkaitan
 * 
 * @example
 * // Daftar ujian baru untuk hospital "000456"
 * const data = daftarUjianBaru([
 *   "",             // ID auto-generated
 *   "000456",       // ID Hospital
 *   "Ujian Darah",  // Nama ujian
 *   "Param1,Param2" // Parameter
 * ]);
 */
function daftarUjianBaru(dataUjianBaru) {
    let idHospital = [dataUjianBaru[1]];  // Simpan sebagai array untuk ambilData()

    // 1. Tambah rekod baru
    lembaran.ujian.appendRow(dataUjianBaru);

    // 2. Format ID sebagai 6-digit
    let jumlahBaris = lembaran.ujian.getLastRow()-1;  // tidak termasuk baris tajuk
    lembaran.ujian.getRange(2, 1, jumlahBaris).setNumberFormat("000000");  // Lajur ID Ujian
    lembaran.ujian.getRange(2, 2, jumlahBaris).setNumberFormat("000000");  // Lajur ID Hospital

    // 3. Pulangkan data terkini
    return ambilData(3, idHospital);
}

/*===========================
7. Pengurusan Data Perjanjian
===========================*/
/**
 * Mengemaskini status dan tarikh perjanjian dalam Google Sheets, kemudian memulangkan data terkini.
 * 
 * @param {string} idPerjanjian - ID unik perjanjian (baris dalam lembaran)
 * @param {string} statusPerjanjian - Status baru untuk dikemaskini (kolum 4)
 * @param {string} tarikh - Tarikh kemaskini dalam format ISO (YYYY-MM-DD) (kolum 5)
 * @param {string} idHospital - ID hospital berkaitan (untuk ambil data semula)
 * @param {"Merujuk"|"Rujukan"} sebagai - Jenis hubungan hospital:
 *   - "Merujuk": Hospital yang menghantar ujian
 *   - "Rujukan": Hospital yang menerima ujian
 * @returns {Array[]} Data perjanjian + ujian terkini (bergantung pada jenis hubungan)
 * 
 */
function kemaskiniStatusPerjanjian(idPerjanjian, statusPerjanjian, tarikh, idHospital, sebagai) {
    let baris = Number(idPerjanjian);  // Tukar ID kepada nombor baris

    // Kemaskini status dan tarikh
    let dataBaru = [[statusPerjanjian, tarikh]];
    lembaran.perjanjian.getRange(baris, 4, 1, 2).setValues(dataBaru);

    // Dapatkan data terkini berdasarkan jenis hubungan
    if (sebagai == HOSPITAL.MERUJUK) {
        return ambilData(5, idHospital);  // [dataPerjanjian, dataUjian, "Merujuk"]

    } else if (sebagai == HOSPITAL.RUJUKAN) {
        return ambilData(6, idHospital);  // [dataPerjanjian, dataUjian, "Rujukan"]
    }
}

/**
 * Memproses permohonan perjanjian baru antara hospital dan makmal rujukan.
 * 
 * @param {Array} data - Data perjanjian dalam format:
 *   [0]: ID Perjanjian (auto-generate)
 *   [1]: ID Hospital Merujuk (format "000000")
 *   [2]: ID Ujian (format "000000")
 *   [3..n]: Maklumat tambahan perjanjian
 * @returns {string} Status permohonan:
 *   - "Sudah ada" jika perjanjian serupa wujud
 *   - "Permohonan diterima" jika berjaya didaftarkan
 * 
 * @description
 * ALIRAN KERJA:
 * 1. Semak jika perjanjian serupa (hospital + makmal) sudah wujud
 * 2. Jika tiada, daftar perjanjian baru
 * 3. Format semua ID sebagai 6-digit
 * 
 * @example
 * // Mohon perjanjian baru
 * const status = mohonPerjanjianBaru([
 *   "",             // ID auto-generate
 *   "000123",       // ID Hospital Merujuk
 *   "000456",       // ID Ujian
 *   "Mohon"         // Status permohonan perjanjian
 *   "2025-01-01",   // Tarikh kemaskini
 * ]);
 */
function mohonPerjanjianBaru(data) {
    // 1. Semak perjanjian sedia ada
    let dataPerjanjian = ambilSemua(lembaran.perjanjian);
    let rujukanSediaAda = [];

    for (rekod of dataPerjanjian) {
        if (rekod[1] == data[1]) {  // Bandingkan ID Hospital merujuk
            rujukanSediaAda.push(rekod[2]);  // Kumpulkan ID Ujian
        }
    }

    // Gunakan Set untuk pencarian ID lebih efisien
    const setRujukanSediaAda = new Set(rujukanSediaAda);

    // 2. Jika kombinasi hospital+ujian sudah wujud
    if (setRujukanSediaAda.has(data[2])) {
        return NOTA.WUJUD;
    }

    // 3. Daftar perjanjian baru
    lembaran.perjanjian.appendRow(data);

    // 4. Format semua ID sebagai 6-digit
    let jumlahBaris = lembaran.perjanjian.getLastRow() - 1;  //tidak termasuk baris tajuk
    lembaran.perjanjian.getRange(2, 1, jumlahBaris).setNumberFormat("000000");  // ID Perjanjian
    lembaran.perjanjian.getRange(2, 2, jumlahBaris).setNumberFormat("000000");  // ID Hospital merujuk
    lembaran.perjanjian.getRange(2, 3, jumlahBaris).setNumberFormat("000000");  // ID Ujian

    return NOTA.DITERIMA;
}

/*===================
8. Penghala & Templat 
===================*/
/**
 * Objek Alamat menguruskan pemetaan laman kepada fungsi pembina laman.
 *
 * Objek ini bertindak sebagai:
 * 1. Direktori pusat untuk fungsi pembina laman (builder functions)
 * 2. Mekanisma penghalaan (routing) berdasarkan parameter URL
 */
const Alamat = {
    /**
     * Mendaftarkan fungsi pembina laman untuk laman tertentu.
     * 
     * @contoh
     * Alamat.jalan("lamanSaya", binaLamanSaya);
     */
    jalan: function(laman, fungsi) {
        Alamat[laman] = fungsi;
    }
};

/**
 * Penghala utama untuk permintaan HTTP GET dalam aplikasi Web App.
 *
 * Tanggungjawab:
 * 1. Mendaftarkan semua laman yang tersedia
 * 2. Memproses parameter URL untuk menentukan laman yang diminta
 * 3. Mengembalikan output HTML laman berkenaan
 * 
 * @contoh URL
 * /exec?laman=daftarHospital
 */
function doGet(e) {
    // Pendaftaran laman
    Alamat.jalan("daftarHospital", binaLamanDaftarHospital);
    Alamat.jalan("daftarUjian", binaLamanDaftarUjian);
    Alamat.jalan("daftarPerjanjian", binaLamanDaftarPerjanjian);

    // Pemprosesan permintaan
    if (e.parameter.laman) {
        return Alamat[e.parameter.laman]();
    }
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

/*================
9. Pembinaan Laman
================*/
/**
 * Mencipta dan mengembalikan laman daftar hospital.
 * Fungsi ini menggunakan templat HTML dari fail "daftarHospital" untuk membina laman daftar hospital.
 *
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Output HTML laman daftar hospital yang dinilai.
 */
function binaLamanDaftarHospital() {
    return binaLaman("daftarHospital");
}

/**
 * Mencipta dan mengembalikan laman daftar ujian.
 * Fungsi ini menggunakan templat HTML dari fail "daftarUjian" untuk membina laman daftar ujian.
 *
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Output HTML laman daftar ujian yang dinilai.
 */
function binaLamanDaftarUjian() {
    return binaLaman("daftarUjian");
}

/**
 * Mencipta dan mengembalikan laman daftar perjanjian.
 * Fungsi ini menggunakan templat HTML dari fail "daftarPerjanjian" untuk membina laman daftar perjanjian.
 *
 * @returns {GoogleAppsScript.HTML.HtmlOutput} Output HTML laman perjanjian yang dinilai.
 */
function binaLamanDaftarPerjanjian() {
    return binaLaman("daftarPerjanjian");
}