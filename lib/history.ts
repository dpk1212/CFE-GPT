export type HistoryYear = {
  academic: string;
  cycle: string;
  enrollment: number;
  ugShare: number;
  partners: number;
  majors: number;
  departments: number;
  ventureTests: number | null;
  prize: number;
  scholarships: number;
  scholarshipDollars: number;
  prizeCumulative: number;
  scholarshipDollarsCumulative: number;
};

const raw: Omit<HistoryYear, "prizeCumulative" | "scholarshipDollarsCumulative">[] = [
  { academic: "2017–18", cycle: "2019", enrollment: 4554, ugShare: 0.15, partners: 6, majors: 101, departments: 35, ventureTests: null, prize: 370500, scholarships: 41, scholarshipDollars: 222135 },
  { academic: "2018–19", cycle: "2020", enrollment: 4397, ugShare: 0.15, partners: 7, majors: 98, departments: 39, ventureTests: null, prize: 45000, scholarships: 211, scholarshipDollars: 412982.86 },
  { academic: "2019–20", cycle: "2021", enrollment: 4086, ugShare: 0.13, partners: 8, majors: 134, departments: 46, ventureTests: null, prize: 62500, scholarships: 80, scholarshipDollars: 202580 },
  { academic: "2020–21", cycle: "2022", enrollment: 4614, ugShare: 0.15, partners: 9, majors: 119, departments: 50, ventureTests: 1001, prize: 9800, scholarships: 191, scholarshipDollars: 242900 },
  { academic: "2021–22", cycle: "2023", enrollment: 5525, ugShare: 0.17, partners: 20, majors: 127, departments: 58, ventureTests: 1371, prize: 375296.34, scholarships: 162, scholarshipDollars: 378486 },
  { academic: "2022–23", cycle: "2024", enrollment: 6044, ugShare: 0.19, partners: 16, majors: 133, departments: 54, ventureTests: 703, prize: 33500, scholarships: 212, scholarshipDollars: 275690 },
  { academic: "2023–24", cycle: "2025", enrollment: 7144, ugShare: 0.21, partners: 17, majors: 132, departments: 71, ventureTests: 1093, prize: 11000, scholarships: 228, scholarshipDollars: 539522.33 },
  { academic: "2024–25", cycle: "2026", enrollment: 7804, ugShare: 0.23, partners: 28, majors: 141, departments: 73, ventureTests: 1339, prize: 735000, scholarships: 312, scholarshipDollars: 484871 },
  { academic: "2025–26", cycle: "2027", enrollment: 8191, ugShare: 0.23, partners: 27, majors: 134, departments: 75, ventureTests: 3329, prize: 73250, scholarships: 289, scholarshipDollars: 788350 },
];

let prizeCumulative = 0;
let scholarshipDollarsCumulative = 0;

export const history: HistoryYear[] = raw.map((row) => {
  prizeCumulative += row.prize;
  scholarshipDollarsCumulative += row.scholarshipDollars;
  return {
    ...row,
    prizeCumulative: Math.round(prizeCumulative * 100) / 100,
    scholarshipDollarsCumulative: Math.round(scholarshipDollarsCumulative * 100) / 100,
  };
});

export const latest = history[history.length - 1];
export const prior = history[history.length - 2];

export function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value % 1 === 0 ? 0 : 2 });
}

export function integer(value: number) {
  return value.toLocaleString("en-US");
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const campusNetwork = [
  "Entrepreneurship Minor, Office of the Provost",
  "Zell Lurie Institute, Michigan Ross",
  "Ross Business+Tech",
  "Ross Business + Impact",
  "College of Literature, Science, and the Arts",
  "optiMize",
  "Program in the Environment",
  "Innovation Theme Community, ResEd",
  "ArtsEngine",
  "Center for Socially Engaged Design",
  "Multidisciplinary Design Program",
  "School of Information",
  "School of Kinesiology",
  "Marsal Family School of Education",
  "School of Nursing",
  "School of Music, Theatre & Dance",
  "School of Public Health",
  "Taubman College of Architecture & Urban Planning",
];
