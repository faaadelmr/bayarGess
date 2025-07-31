# BayarGess - AI-Powered Bill Splitter
BayarGess adalah aplikasi web cerdas dan mudah digunakan yang dirancang untuk menyederhanakan proses membagi tagihan antar teman yang seringkali membosankan. Dibangun dengan Next.js, Firebase, dan didukung oleh AI Gemini Google melalui Genkit, aplikasi ini membuat pembagian biaya secara adil dan akurat menjadi mudah.

## ✨ Fitur Utama
- **🤖 Pemindaian Struk dengan AI**: Cukup unggah foto struk Anda, dan AI aplikasi akan secara otomatis mendeteksi dan mencantumkan semua item, harga, pajak, dan diskon. Aplikasi ini dilatih untuk memahami berbagai format struk dari layanan populer seperti GoFood, GrabFood, dan ShopeeFood.
- **✍️ Penugasan Berbasis Teks dengan AI**: Tempelkan daftar sederhana tentang siapa memesan apa (misalnya, "Budi: Nasi Goreng, Ani: Es Teh"), dan AI akan secara cerdas menugaskan item ke peserta yang bersangkutan.
- **-️ Pembagian Fleksibel**: Mudah menugaskan item ke individu tertentu, atau membagi item bersama secara merata di antara grup atau semua peserta.
- **💰 Menangani Tagihan Kompleks**: Aplikasi ini menghitung total dengan benar dengan memperhitungkan pajak (termasuk harga sudah termasuk pajak), beberapa jenis diskon (tetap atau persentase), biaya pengiriman, dan biaya tambahan lainnya.
- **📸 Ringkasan Dapat Diunduh**: Hasilkan ringkasan tagihan yang bersih dan mudah dibaca dalam bentuk gambar, sempurna untuk dibagikan di grup chat.
- **🐞 Pelaporan Bawaan**: Jika Anda menemui bug atau analisis yang salah, Anda dapat dengan mudah mengirim laporan kesalahan terperinci, termasuk gambar struk yang diunggah, untuk membantu meningkatkan aplikasi.

## 🚀 Cara Penggunaannya
 Berikut adalah panduan langkah demi langkah untuk membagi tagihan Anda dengan BayarGess:

### Langkah 1: Menambahkan Item Tagihan
Anda memiliki dua opsi untuk menambahkan item ke tagihan:

- **Opsi A (Disarankan - Gunakan AI):**
  1. Klik tombol **“Unggah Struk”** (Upload Receipt).
  2. Pilih file gambar struk Anda.
  3. AI akan menganalisis gambar dan secara otomatis mengisi “Daftar Tagihan” dengan semua item, harga, pajak, dan biaya lainnya yang ditemukan.

- **Opsi B (Entri Manual):**  
  1. Klik tombol **“Tambah Item”**.  
  2. Baris baru akan muncul. Isi nama item dan harganya.
  3. Ulangi untuk semua item pada tagihan Anda.

### Langkah 2: Menambahkan Peserta
1. Di kartu “Peserta” (Participants), ketik nama orang yang terlibat dalam tagihan.  
2. Tekan `Enter` atau klik tombol `+`.  
3. Ulangi untuk setiap orang yang berbagi tagihan.

### Langkah 3: Menugaskan Item ke Peserta
Ini adalah langkah penting untuk pembagian yang adil. Sekali lagi, Anda punya dua pilihan:  
Ini adalah langkah penting untuk pembagian yang adil. Sekali lagi, Anda punya dua pilihan: ### Langkah 3: Menugaskan Item ke Peserta  
  1. Di kartu “AI Peserta:Item”, ketik atau tempel daftar siapa yang memesan apa. Gunakan format sederhana, seperti satu orang per baris.
     *Contoh:*
     ```
     Budi: Nasi Goreng, Es Teh
     Ani: Mie Ayam
     Fadel: Jus Jeruk, Nasi Goreng
     ``
  2. Klik tombol **“Analisis Teks”**. AI akan membaca teks Anda dan secara otomatis mengaitkan item dari daftar tagihan ke orang yang tepat.

- **Opsi B (Penugasan Manual):**  
  1. Untuk setiap item dalam daftar “Daftar Tagihan”, klik tombol yang bertuliskan **“Bagi rata untuk semua”** (Split for all).  
  2. Menu dropdown akan muncul dengan nama semua peserta.
  3. Centang kotak di samping setiap orang yang mengonsumsi item tersebut. Jika item dibagikan oleh semua orang, Anda tidak perlu melakukan apa pun.

### Langkah 4: Review dan Finalisasi
1. Semua perhitungan dilakukan secara real-time di kartu **“Ringkasan”** (Summary) di sebelah kanan.
2. Anda dapat menyesuaikan Pajak, Diskon, dan biaya lain secara manual jika diperlukan.
3. Jumlah akhir yang harus dibayar oleh masing-masing orang tercantum dengan jelas di bawah “Total per Orang”.
4. Klik **“Lihat Ringkasan Pembagian”** untuk melihat rincian detail. Dari sana, Anda dapat mengklik **“Simpan sebagai JPEG”** untuk mengunduh gambar ringkasan untuk dibagikan dengan teman-teman Anda.