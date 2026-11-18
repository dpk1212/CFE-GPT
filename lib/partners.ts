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
    id: "education",
    name: "Marsal Family School of Education",
    short: "Education",
    units: [
      {
        name: "Center for Education, Design, Evaluation, and Research",
        aka: "CEDER",
        note: "Research and design aimed at strengthening education systems and how students learn.",
        href: "https://marsal.umich.edu/ceder",
      },
      {
        name: "Learning, Equity and Problem Solving for the Common Good",
        aka: "LEAPS",
        note: "A bachelor’s degree for students who lead, work on real problems, and turn ideas into public action.",
        href: "https://marsal.umich.edu/academics-admissions/leaps",
      },
    ],
  },
  {
    id: "engineering",
    name: "College of Engineering",
    short: "Engineering",
    units: [
      {
        name: "ArtsEngine",
        note: "A partnership across art, design, architecture, music, engineering, and information. In 2026, its funding programs moved to Engaged Michigan’s Arts-Integrated Grant, and Faculty Engineering/Arts Student Teams (FEAST) moved to the Arts Initiative.",
        noteLinks: [
          { label: "Arts-Integrated Grant", href: "https://engaged.umich.edu/michigan/artsengine-grant/" },
          { label: "Arts Initiative", href: "https://arts.umich.edu/" },
        ],
        href: "https://artsengine.engin.umich.edu/",
      },
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
        name: "College of Engineering",
        note: "The college home for undergraduate majors, departments, and programs.",
        href: "https://www.engin.umich.edu/majors-programs/departments-programs/",
      },
      {
        name: "Honors & Engagement",
        note: "Our office leads core academic and leadership initiatives across Michigan Engineering—including the Honors Program, Engineering Global Leadership specialization, ENGR 110 and 499 courses, the Common Reading Experience, and representation in the Michigan Leadership Collaborative.",
        href: "https://honeng.engin.umich.edu/",
      },
      {
        name: "Multidisciplinary Design Program",
        aka: "MDP",
        note: "Discover applied project opportunities. Put your classroom knowledge into practice through open-ended, team-based engineering projects open to students of many majors and GPA.",
        href: "https://mdp.engin.umich.edu/",
      },
      {
        name: "Tauber Institute for Global Operations",
        note: "A joint institute of Engineering and Ross. Students take on operations projects with industry partners.",
        href: "https://tauber.umich.edu/",
      },
      {
        name: "Wilson Student Team Project Center",
        aka: "WSTPC",
        note: "The Wilson Center offers student teams dedicated fabrication facilities, cross-disciplinary collaboration, and a platform to showcase hands-on engineering innovation.",
        href: "https://teamprojects.engin.umich.edu/",
      },
    ],
  },
  {
    id: "entrepreneurship-minor",
    name: "Minor in Entrepreneurship",
    short: "Entrepreneurship Minor",
    units: [
      {
        name: "Minor in Entrepreneurship",
        note: "A minor open to undergraduates in any school.",
        href: "https://ent-minor.umich.edu/",
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
        href: "https://www.si.umich.edu/programs/engaged-learning/entrepreneurship-and-innovation-opportunities",
      },
    ],
  },
  {
    id: "kinesiology",
    name: "School of Kinesiology",
    short: "Kinesiology",
    units: [
      {
        name: "School of Kinesiology",
        note: "Undergraduate programs in movement science, sport management, and applied exercise.",
        href: "https://www.kines.umich.edu/",
      },
    ],
  },
  {
    id: "lsa",
    name: "College of Literature, Science, and the Arts",
    short: "LSA",
    units: [
      {
        name: "Barger Leadership Institute",
        aka: "BLI",
        note: "Immersive leadership experiences in LSA, with courses, projects, and grants for students building a leadership practice.",
        href: "https://lsa.umich.edu/bli",
      },
      {
        name: "optiMize",
        note: "A student-led community for social innovation, with a challenge that offers workshops, mentorship, and project funding.",
        href: "https://www.optimizemi.org/",
      },
      {
        name: "Program in the Environment",
        aka: "PitE",
        note: "A joint program of LSA and the School for Environment and Sustainability.",
        href: "https://lsa.umich.edu/pite",
      },
    ],
  },
  {
    id: "smtd",
    name: "School of Music, Theatre & Dance",
    short: "Music, Theatre & Dance",
    units: [
      {
        name: "Minor in Performing Arts Management & Entrepreneurship",
        aka: "PAME",
        note: "A 15-credit minor in arts management and entrepreneurship, open to undergraduates across the university.",
        href: "https://smtd.umich.edu/degree/minor-in-performing-arts-management-entrepreneurship/",
      },
    ],
  },
  {
    id: "nursing",
    name: "School of Nursing",
    short: "Nursing",
    units: [
      {
        name: "Healthcare Innovation Impact Program",
        aka: "HIIP",
        note: "Mentorship and programming for nursing students leading health care innovation.",
        href: "https://nursing.umich.edu/about/HiiP",
      },
    ],
  },
  {
    id: "public-health",
    name: "School of Public Health",
    short: "Public Health",
    units: [
      {
        name: "M-HEAL",
        note: "Students design health care solutions with community partners, across public health, nursing, and engineering.",
        href: "https://mheal.engin.umich.edu/",
      },
      {
        name: "School of Public Health",
        note: "Courses, projects, and stories from the school tagged for entrepreneurship.",
        href: "https://sph.umich.edu/pursuit/results.html?tags=Entrepreneurship",
      },
    ],
  },
  {
    id: "residential",
    name: "Residential Education",
    short: "Residential Education",
    units: [
      {
        name: "Social Innovation Living-Learning Community",
        note: "A living-learning community for students interested in social innovation.",
        href: "https://housing.umich.edu/themes/innovation/",
      },
    ],
  },
  {
    id: "ross",
    name: "Stephen M. Ross School of Business",
    short: "Ross",
    units: [
      {
        name: "Business+Impact",
        note: "A school-wide Ross initiative for shaping business practice to advance the common good.",
        href: "https://businessimpact.umich.edu/",
      },
      {
        name: "Business+Tech",
        note: "Programs and competitions where students, faculty, and industry meet at the intersection of business and technology.",
        href: "https://businesstech.bus.umich.edu/",
      },
      {
        name: "Detroit Neighborhood Entrepreneurs Project",
        aka: "DNEP",
        note: "Pairs students with Detroit entrepreneurs and offers free support for neighborhood businesses.",
        href: "https://detroitsmallbusiness.umich.edu/",
      },
      {
        name: "Impact Studio",
        note: "A Ross design community where students develop and launch early-stage ideas for social impact.",
        href: "https://rossimpactstudio.com/",
      },
      {
        name: "Zell Lurie Institute for Entrepreneurship",
        aka: "ZLI",
        note: "Grants, mentorship, and accelerators for student ventures, including venture capital. Coordinates Michigan’s graduate rankings.",
        href: "https://zli.umich.edu/",
      },
    ],
  },
  {
    id: "ross-seas",
    name: "Ross School of Business and the School for Environment and Sustainability",
    short: "Ross and SEAS",
    units: [
      {
        name: "Erb Institute",
        note: "A partnership of Ross and the School for Environment and Sustainability, with an undergraduate fellows program alongside its graduate work.",
        href: "https://erb.umich.edu/about/about-erb",
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
        href: "https://stamps.umich.edu/about",
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
        note: "Architecture and urban planning students join cross-campus design and entrepreneurship through alumni panels, the Urban Technology minor, and the Real Estate Development minor.",
        noteLinks: [
          { label: "alumni panels", href: "https://taubmancollege.umich.edu/news/2025/11/13/taubman-college-alumni-share-entrepreneurship-lessons-with-students/" },
          { label: "Urban Technology minor", href: "https://taubmancollege.umich.edu/academics/urban-and-regional-planning/bachelor-of-science-in-urban-technology/" },
          { label: "Real Estate Development minor", href: "https://taubmancollege.umich.edu/academics/urban-and-regional-planning/real-estate-development-minor/" },
        ],
        href: "https://taubmancollege.umich.edu/about/",
      },
    ],
  },
];

export const unitCount = colleges.reduce((sum, college) => sum + college.units.length, 0);
