export type Unit = {
  name: string;
  aka?: string;
  note?: string;
};

export type College = {
  id: string;
  name: string;
  units: Unit[];
};

export const colleges: College[] = [
  {
    id: "engineering",
    name: "College of Engineering",
    units: [
      {
        name: "Center for Entrepreneurship",
        aka: "CFE",
        note: "Coordinates the reporting partners and compiles the undergraduate file submitted to the Princeton Review.",
      },
      {
        name: "Center for Socially Engaged Design",
        aka: "CSED",
        note: "Includes Innovation in Action (IiA).",
      },
      { name: "Honors & Engagement" },
      { name: "Multidisciplinary Design Program", aka: "MDP" },
      { name: "Wilson Student Team Project Center" },
    ],
  },
  {
    id: "ross",
    name: "Stephen M. Ross School of Business",
    units: [
      { name: "Zell Lurie Institute for Entrepreneurship" },
      { name: "Business + Tech" },
      { name: "Business + Impact", note: "Includes DNEP and Impact Studio." },
    ],
  },
  {
    id: "tauber",
    name: "College of Engineering and Ross School of Business",
    units: [
      { name: "Tauber Institute for Global Operations", note: "Joint institute." },
    ],
  },
  {
    id: "lsa",
    name: "College of Literature, Science, and the Arts",
    units: [
      { name: "College of Literature, Science, and the Arts" },
      { name: "optiMize" },
      {
        name: "Program in the Environment",
        aka: "PitE",
        note: "Jointly managed with the School for Environment and Sustainability. Grouped here with LSA.",
      },
      { name: "Residential Education", aka: "ResEd" },
    ],
  },
  {
    id: "education",
    name: "Marsal Family School of Education",
    units: [
      { name: "Center for Education Design, Evaluation, and Research", aka: "CEDER" },
      { name: "Education LEAPS" },
    ],
  },
  {
    id: "smtd",
    name: "School of Music, Theatre & Dance",
    units: [
      { name: "School of Music, Theatre & Dance" },
      { name: "EXCEL Lab" },
    ],
  },
  {
    id: "public-health",
    name: "School of Public Health",
    units: [{ name: "School of Public Health" }],
  },
  {
    id: "stamps",
    name: "Stamps School of Art & Design",
    units: [{ name: "Stamps School of Art & Design" }],
  },
  {
    id: "nursing",
    name: "School of Nursing",
    units: [{ name: "School of Nursing" }],
  },
  {
    id: "information",
    name: "School of Information",
    units: [{ name: "School of Information" }],
  },
  {
    id: "taubman",
    name: "Taubman College of Architecture & Urban Planning",
    units: [{ name: "Taubman College of Architecture & Urban Planning" }],
  },
  {
    id: "university",
    name: "University-wide",
    units: [
      { name: "ArtsEngine", note: "Cross-campus arts, design, engineering, and technology partnership." },
      { name: "Entrepreneurship Minor", note: "Office of the Provost." },
    ],
  },
];

export const unitCount = colleges.reduce((sum, college) => sum + college.units.length, 0);
