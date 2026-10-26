export type Unit = {
  name: string;
  aka?: string;
  note: string;
  href?: string;
  noteLinks?: { label: string; href: string }[];
};

export type College = {
  id: string;
  name: string;
  short: string;
  units: Unit[];
};

export const colleges: College[] = [
  {
    id: "engineering",
    name: "College of Engineering",
    short: "Engineering",
    units: [
      {
        name: "Center for Entrepreneurship",
        aka: "CFE",
        note: "Campus-wide courses and co-curricular experiences for students exploring, building, and launching ideas. Coordinates U-M’s undergraduate Princeton Review & Entrepreneur Magazine survey reporting.",
        href: "https://cfe.umich.edu/",
      },
      {
        name: "Center for Socially Engaged Engineering & Design",
        aka: "C-SED",
        note: "Empowers engineering educators and students at U-M and beyond to connect technical design with societal needs, contexts, and impacts through human-centered learning and research.",
        href: "https://csed.engin.umich.edu/",
      },
      {
        name: "Honors & Engagement",
        note: "Our office leads core academic and leadership initiatives across Michigan Engineering—including the Honors Program, Engineering Global Leadership specialization, ENGR 110 and 499 courses, the Common Reading Experience, and representation in the Michigan Leadership Collaborative.",
        href: "https://honors.engin.umich.edu/",
      },
      {
        name: "Multidisciplinary Design Program",
        aka: "MDP",
        note: "Discover applied project opportunities. Put your classroom knowledge into practice through open-ended, team-based engineering projects open to students of many majors and GPA.",
        href: "https://mdp.engin.umich.edu/",
      },
      {
        name: "Wilson Student Team Project Center",
        aka: "WSTPC",
        note: "The Wilson Center offers student teams dedicated fabrication facilities, cross-disciplinary collaboration, and a platform to showcase hands-on engineering innovation.",
        href: "https://teamprojects.engin.umich.edu/",
      },
      {
        name: "ArtsEngine",
        note: "A partnership across art, design, architecture, music, engineering, and information. In 2026, its funding programs moved to Engaged Michigan’s Arts-Integrated Grant, and Faculty Engineering/Arts Student Teams (FEAST) moved to the Arts Initiative.",
        noteLinks: [
          { label: "Arts-Integrated Grant", href: "https://engaged.umich.edu/michigan/artsengine-grant/" },
          { label: "Arts Initiative", href: "https://arts.umich.edu/" },
        ],
        href: "https://artsengine.engin.umich.edu/",
      },
    ],
  },
  {
    id: "ross",
    name: "Stephen M. Ross School of Business",
    short: "Ross",
    units: [
      {
        name: "Zell Lurie Institute for Entrepreneurship",
        aka: "ZLI",
        note: "Grants, mentorship, and accelerators for student ventures, including venture capital. Coordinates Michigan’s graduate rankings.",
        href: "https://zli.umich.edu/",
      },
      {
        name: "Business + Tech",
        note: "Programs and competitions where students, faculty, and industry meet at the intersection of business and technology.",
        href: "https://businesstech.bus.umich.edu/",
      },
      {
        name: "Business + Impact",
        note: "Impact-driven programs at Ross, including Impact Studio, the Erb Institute, and the Detroit Neighborhood Entrepreneurs Project. Impact Studio partners with the Center for Entrepreneurship and the School of Information.",
        href: "https://businessimpact.umich.edu/",
      },
      {
        name: "Entrepreneurship Minor",
        note: "A 15-credit minor open to undergraduates in any school. Ross staff administer and advise it.",
        href: "https://entrepreneurship.umich.edu/degrees/",
      },
    ],
  },
  {
    id: "tauber",
    name: "College of Engineering and Ross School of Business",
    short: "Engineering and Ross",
    units: [
      {
        name: "Tauber Institute for Global Operations",
        note: "A joint institute of Engineering and Ross. Students take on operations projects with industry partners.",
        href: "https://tauber.umich.edu/",
      },
      {
        name: "Integrated Business and Engineering",
        aka: "IBE",
        note: "A joint dual degree from Ross and the College of Engineering. Students earn a BBA and an engineering degree.",
        href: "https://business-engineering.umich.edu/",
      },
    ],
  },
  {
    id: "lsa",
    name: "College of Literature, Science, and the Arts",
    short: "LSA",
    units: [
      {
        name: "College of Literature, Science, and the Arts",
        note: "The liberal arts home for entrepreneurship coursework across its departments.",
        href: "https://lsa.umich.edu/",
      },
      {
        name: "Barger Leadership Institute",
        aka: "BLI",
        note: "Immersive leadership experiences in LSA, with courses, projects, and grants for students building a leadership practice.",
        href: "https://lsa.umich.edu/bli",
      },
      {
        name: "optiMize",
        note: "A student-led community for social innovation, with a challenge that offers workshops, mentorship, and project funding.",
      },
      {
        name: "Residential Education",
        aka: "ResEd",
        note: "Home of the Innovation Theme Community, a living-learning community for first-year students entering entrepreneurship.",
      },
    ],
  },
  {
    id: "pite",
    name: "College of Literature, Science, and the Arts and the School for Environment and Sustainability",
    short: "LSA and SEAS",
    units: [
      {
        name: "Program in the Environment",
        aka: "PitE",
        note: "A joint program of LSA and the School for Environment and Sustainability.",
        href: "https://lsa.umich.edu/pite",
      },
    ],
  },
  {
    id: "education",
    name: "Marsal Family School of Education",
    short: "Education",
    units: [
      {
        name: "Center for Education Design, Evaluation, and Research",
        aka: "CEDER",
        note: "Research and design aimed at strengthening education systems and how students learn.",
        href: "https://marsal.umich.edu/",
      },
      {
        name: "Learning, Equity, and Problem Solving for the Public Good",
        aka: "LEAPS",
        note: "A bachelor’s degree for students who lead, work on real problems, and turn ideas into public action.",
        href: "https://marsal.umich.edu/academics-admissions/leaps",
      },
    ],
  },
  {
    id: "smtd",
    name: "School of Music, Theatre & Dance",
    short: "Music, Theatre & Dance",
    units: [
      {
        name: "EXCEL Lab",
        note: "Entrepreneurship, leadership, and career support for performing arts students, with mentoring and project funding.",
        href: "https://smtd.umich.edu/excel-lab/",
      },
      {
        name: "Performing Arts Management & Entrepreneurship",
        aka: "PAME",
        note: "A 15-credit minor in arts management and entrepreneurship, open to undergraduates across the university.",
        href: "https://smtd.umich.edu/degree/minor-in-performing-arts-management-entrepreneurship/",
      },
    ],
  },
  {
    id: "public-health",
    name: "School of Public Health",
    short: "Public Health",
    units: [
      {
        name: "School of Public Health",
        note: "Public health students and faculty in the undergraduate entrepreneurship community.",
        href: "https://sph.umich.edu/",
      },
    ],
  },
  {
    id: "stamps",
    name: "Stamps School of Art & Design",
    short: "Stamps",
    units: [
      {
        name: "Stamps School of Art & Design",
        note: "Art and design students in campus entrepreneurship and cross-school collaboration.",
        href: "https://stamps.umich.edu/",
      },
    ],
  },
  {
    id: "nursing",
    name: "School of Nursing",
    short: "Nursing",
    units: [
      {
        name: "School of Nursing",
        note: "The Healthcare Innovation Impact Program, with mentorship for nursing-led innovation.",
        href: "https://nursing.umich.edu/",
      },
    ],
  },
  {
    id: "information",
    name: "School of Information",
    short: "Information",
    units: [
      {
        name: "School of Information",
        note: "The Engaged Learning Office offers hands-on entrepreneurship and innovation for information students.",
        href: "https://www.si.umich.edu/",
      },
    ],
  },
  {
    id: "taubman",
    name: "Taubman College of Architecture & Urban Planning",
    short: "Taubman",
    units: [
      {
        name: "Taubman College of Architecture & Urban Planning",
        note: "Architecture and urban planning students in cross-campus design and entrepreneurship.",
        href: "https://taubmancollege.umich.edu/",
      },
    ],
  },
];

export const unitCount = colleges.reduce((sum, college) => sum + college.units.length, 0);
