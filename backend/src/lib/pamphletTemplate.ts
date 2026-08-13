/**
 * src/lib/pamphletTemplate.ts
 *
 * Generates the death-notice pamphlet as a standalone HTML document, given
 * a record and a language. This is the single source of truth for the
 * pamphlet's content and layout - both the browser "Print" view (5.4) and
 * the Puppeteer PDF endpoint (5.3) render this exact same HTML, so they
 * can never drift apart from each other.
 *
 * Increment 5.1 scope: correct content + field mapping, minimal styling.
 * Visual fidelity to the reference scan (border, star symbol, etc.) is
 * increment 5.2.
 */

export type PamphletLang = "gu" | "en";

export interface PamphletRecord {
  srNo?: number | null;
  name: string;
  ageText?: string | null;
  burialDate: Date | string;
  burialTime?: string | null;
  deathDate?: Date | string | null;
  deathTime?: string | null;
  misriDate?: string | null;
  relativeName?: string | null;
}

const MONTHS_GU = [
  "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
  "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર",
];
const DAYS_GU = ["રવિવાર", "સોમવાર", "મંગળવાર", "બુધવાર", "ગુરુવાર", "શુક્રવાર", "શનિવાર"];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(value: Date | string, lang: PamphletLang): string {
  const d = new Date(value);
  const months = lang === "gu" ? MONTHS_GU : MONTHS_EN;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDay(value: Date | string, lang: PamphletLang): string {
  const d = new Date(value);
  const days = lang === "gu" ? DAYS_GU : DAYS_EN;
  return days[d.getDay()];
}

// Record fields are user-entered (via the admin form) and interpolated
// directly into HTML below - escape to prevent injection via a name,
// relative name, misri date, etc. containing HTML-significant characters.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Labels + fixed org/letterhead content per language. Org name is kept
// bilingual in both versions (letterhead identity, not translated body
// content) - flagging this choice for review.
const LABELS = {
  gu: {
    established: "સ્થાપના : ૧૯૫૧",
    addressLine1: "ગેનિય સ્કૂલની પાછળ,",
    addressLine2: "પ્રતાપનગર, વડોદરા.",
    deceasedLabel: "મહુમભાઈ મહુમાબહેન",
    relativeLabel: "જનાબ",
    field: {
      deathDate: "વફાત તારીખ",
      hijri: "હીજરી",
      day: "વાર :",
      deathTime: "મરણ ટાઈમ :",
      age: "ઉંમર :",
      burialTime: "દફન ટાઈમ :",
    },
    notice: "સુચના   મૈયત થયાનો દાખલો સુધરાઇ માંથી દીન બે માં કટાવી લેવો જરૂરી છે.",
    note: "(નોંધ) નહી કટાવવાનાર દંડને પાત્ર છે.",
    signature: "ફોર તૈયબી કંપની",
  },
  en: {
    established: "Established: 1951",
    addressLine1: "Behind Genius School,",
    addressLine2: "Pratapnagar, Vadodara.",
    deceasedLabel: "The Late Mr. / Mrs.",
    relativeLabel: "Relative:",
    field: {
      deathDate: "Date of Passing",
      hijri: "Hijri Date",
      day: "Day:",
      deathTime: "Time of Death:",
      age: "Age:",
      burialTime: "Burial Time:",
    },
    notice:
      "Notice: it is necessary to obtain the death certificate from the municipality within two days.",
    note: "(Note) Those who fail to do so are liable to a penalty.",
    signature: "For Taiyabi Company",
  },
} as const;

export function generatePamphletHtml(record: PamphletRecord, lang: PamphletLang): string {
  const t = LABELS[lang];

  // વફાત તારીખ / Date of Passing: deathDate if set, else burialDate
  const headlineDeathDateIso = record.deathDate || record.burialDate;
  const headlineDeathDate = formatDate(headlineDeathDateIso, lang);

  // વાર / Day: computed from the death date (confirmed with user - not a
  // stored field, more reliable than a manually-typed one).
  const dayOfWeek = formatDay(headlineDeathDateIso, lang);

  const burialDateFormatted = formatDate(record.burialDate, lang);

  // Top-right "printed on" date. The reference scan's top-right date didn't
  // match any single stored field (it was 9 days after the burial date in
  // the sample) - reading it as "date the notice was issued/printed", so
  // this uses today's date. Flagging as an assumption to confirm.
  const printedDate = formatDate(new Date(), lang);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(record.name)} - Pamphlet</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A5; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: ${lang === "gu" ? "'Noto Sans Gujarati', 'Inter'" : "'Inter'"}, sans-serif;
    color: #14361f;
    background: #f3f1e8;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }
  .pamphlet {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border: 6px double #145a32;
    padding: 20px 22px;
  }
  .letterhead { text-align: center; margin-bottom: 10px; }
  .org-name-en {
    font-size: 22px;
    font-weight: 700;
    color: #145a32;
    letter-spacing: 0.5px;
  }
  .org-name-gu {
    font-family: 'Noto Sans Gujarati', sans-serif;
    font-size: 19px;
    font-weight: 700;
    color: #145a32;
    margin-top: 2px;
  }
  .star { color: #145a32; margin: 0 6px; font-size: 15px; }
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 11px;
    margin: 10px 0;
    border-top: 1px solid #145a32;
    border-bottom: 1px solid #145a32;
    padding: 6px 0;
  }
  .meta-row .srno { font-weight: 700; }
  .meta-center { text-align: center; flex: 1; padding: 0 8px; }
  .meta-row .right { text-align: right; }
  .names { margin: 14px 0; font-size: 14px; }
  .names .row { border-bottom: 1px solid #145a32; padding-bottom: 4px; margin-bottom: 10px; }
  .names .label { font-weight: 700; margin-right: 6px; }
  .field-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
  .field-table td { border: 1px solid #145a32; padding: 6px 10px; }
  .field-table td.label-cell { font-weight: 700; width: 38%; }
  .notice { margin-top: 16px; font-size: 10.5px; line-height: 1.6; }
  .signature { margin-top: 26px; text-align: right; font-size: 13px; font-weight: 700; }
  .signature .line { border-top: 1px solid #145a32; width: 140px; margin: 0 0 6px auto; }
</style>
</head>
<body>
  <div class="pamphlet">
    <div class="letterhead">
      <div class="org-name-en">Taiyabi Company Baroda</div>
      <div class="org-name-gu"><span class="star">&#9770;</span>તૈયબી કંપની વડોદરા.<span class="star">&#9770;</span></div>
    </div>

    <div class="meta-row">
      <div>${t.established}</div>
      <div class="meta-center">
        <div class="srno">${record.srNo ?? ""}</div>
        <div>${t.addressLine1} ${t.addressLine2}</div>
      </div>
      <div class="right">${printedDate}</div>
    </div>

    <div class="names">
      <div class="row"><span class="label">${t.deceasedLabel}</span>${escapeHtml(record.name)}</div>
      <div class="row"><span class="label">${t.relativeLabel}</span>${escapeHtml(record.relativeName || "")}</div>
    </div>

    <table class="field-table">
      <tr>
        <td class="label-cell">${t.field.deathDate}</td>
        <td>${headlineDeathDate}</td>
      </tr>
      <tr>
        <td class="label-cell">${t.field.hijri}</td>
        <td>${escapeHtml(record.misriDate || "")}</td>
      </tr>
      <tr>
        <td class="label-cell">${t.field.day}</td>
        <td>${dayOfWeek}</td>
      </tr>
      <tr>
        <td class="label-cell">${t.field.deathTime}</td>
        <td>${escapeHtml(record.deathTime || "")}</td>
      </tr>
      <tr>
        <td class="label-cell">${t.field.age}</td>
        <td>${escapeHtml(record.ageText || "")}</td>
      </tr>
      <tr>
        <td class="label-cell">${t.field.burialTime}</td>
        <td>${escapeHtml([record.burialTime, burialDateFormatted].filter(Boolean).join(", "))}</td>
      </tr>
    </table>

    <div class="notice">
      <div>${t.notice}</div>
      <div>${t.note}</div>
    </div>

    <div class="signature">
      <div class="line"></div>
      ${t.signature}
    </div>
  </div>
</body>
</html>`;
}
