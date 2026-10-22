export type Unit = {
  name: string;
  aka?: string;
  note: string;
  href?: string;
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
        note: "Campus-wide courses and experiences for students building and launching ideas. Coordinates the undergraduate Princeton Review ranking.",
        href: "https://cfe.umich.edu/",
      },
      {
        name: "Center for Socially Engaged Design",
        aka: "CSED",
        note: "Socially engaged engineering and design, including Innovation in Action, a months-long challenge open to any discipline.",
        href: "https://csed.engin.umich.edu/",
      },
      {
        name: "Honors & Engagement",
        note: "The honors community and student engagement office in the College of Engineering.",
        href: "https://honors.engin.umich.edu/",
      },
      {
        name: "Multidisciplinary Design Program",
        aka: "MDP",
        note: "Design and research projects for credit, connecting students from many majors with faculty and outside sponsors.",
        href: "https://mdp.engin.umich.edu/",
      },
      {
        name: "Wilson Student Team Project Center",
        note: "Workspace, training, and support for Engineering student project teams.",
        href: "https://teamprojects.engin.umich.edu/",
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
        note: "Grants, mentorship, and accelerators for student ventures, including venture capital. Prepares Michigan’s graduate rankings.",
        href: "https://zli.umich.edu/",
      },
      {
        name: "Business + Tech",
        note: "Programs and competitions where students, faculty, and industry meet at the intersection of business and technology.",
        href: "https://businesstech.bus.umich.edu/",
      },
      {
        name: "Business + Impact",
        note: "Action-based courses for impact-driven work, including Impact Studio and the Detroit Neighborhood Entrepreneurs Project.",
        href: "https://businessimpact.umich.edu/",
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
        name: "optiMize",
        note: "A student-led community for social innovation, with a challenge that offers workshops, mentorship, and project funding.",
      },
      {
        name: "Program in the Environment",
        aka: "PitE",
        note: "Jointly managed with the School for Environment and Sustainability. Grouped here with LSA.",
        href: "https://lsa.umich.edu/pite",
      },
      {
        name: "Residential Education",
        aka: "ResEd",
        note: "Home of the Innovation Theme Community, a living-learning community for first-year students entering entrepreneurship.",
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
        name: "Education LEAPS",
        note: "Innovation and entrepreneurship programming in the Marsal Family School of Education, alongside CEDER.",
      },
    ],
  },
  {
    id: "smtd",
    name: "School of Music, Theatre & Dance",
    short: "Music, Theatre & Dance",
    units: [
      {
        name: "School of Music, Theatre & Dance",
        note: "Courses and credentials in entrepreneurship, leadership, and the arts.",
        href: "https://smtd.umich.edu/",
      },
      {
        name: "EXCEL Lab",
        note: "Entrepreneurship, leadership, and career support for performing arts students, with mentoring and project funding.",
        href: "https://smtd.umich.edu/excel-lab/",
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
  {
    id: "university",
    name: "University-wide",
    short: "University-wide",
    units: [
      {
        name: "ArtsEngine",
        note: "A partnership across art, design, architecture, music, engineering, and information. Its funding programs now continue through Engaged Michigan.",
        href: "https://artsengine.engin.umich.edu/",
      },
      {
        name: "Entrepreneurship Minor",
        note: "A 15-credit minor open to undergraduates in any school. Offered through the Office of the Provost.",
        href: "https://entrepreneurship.umich.edu/degrees/",
      },
    ],
  },
];

export const unitCount = colleges.reduce((sum, college) => sum + college.units.length, 0);
