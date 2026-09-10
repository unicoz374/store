// Filter otomatis untuk kolom "Kritik & Saran".
// Cara kerja: setiap kata di pesan dicocokkan (tanpa peduli besar/kecil huruf,
// dan tahan terhadap angka pengganti huruf seperti "b4b1" -> "babi") dengan
// daftar kata terlarang di bawah, lalu diganti jadi tanda bintang.
//
// UNTUK MENAMBAH / MENGURANGI KATA YANG DISENSOR:
// Cukup edit array BLOCKED_WORDS di bawah ini — tambahkan kata baru dalam
// huruf kecil, atau hapus kata yang tidak perlu. Tidak perlu ubah kode lain.

const BLOCKED_WORDS = [
  "anjing", "anjg", "asu", "babi", "bangsat", "bego", "bejat", "bodoh",
  "brengsek", "goblok", "kampret", "kontol", "memek", "ngentot", "pepek",
  "peler", "sialan", "tolol", "tai", "taik", "jancok", "jancuk", "cok",
  "kimak", "monyet", "idiot", "keparat", "sundal", "lonte", "pelacur",
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
];

// Normalisasi ringan: hapus spasi/simbol berulang & ganti angka mirip huruf,
// supaya "b4b1", "b.a.b.i", "babiii" tetap terdeteksi.
function normalize(word: string) {
  return word
    .toLowerCase()
    .replace(/4/g, "a")
    .replace(/1|!/g, "i")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/[^a-z]/g, "");
}

export interface FilterResult {
  filtered: string;
  wasCensored: boolean;
}

export function filterMessage(message: string): FilterResult {
  let wasCensored = false;

  const filtered = message
    .split(/(\s+)/) // pecah per kata, tapi simpan spasi aslinya
    .map((token) => {
      if (/^\s+$/.test(token)) return token; // biarkan spasi apa adanya
      const normalized = normalize(token);
      const isBlocked = BLOCKED_WORDS.some(
        (bad) => normalized === bad || (bad.length >= 4 && normalized.includes(bad))
      );
      if (isBlocked) {
        wasCensored = true;
        // Sisakan huruf pertama, sisanya jadi bintang. Contoh: "anjing" -> "a*****"
        return token[0] + "*".repeat(Math.max(token.length - 1, 1));
      }
      return token;
    })
    .join("");

  return { filtered, wasCensored };
}
