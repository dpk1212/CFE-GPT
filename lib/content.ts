export const center = {
  name: "Center for Entrepreneurship",
  short: "CFE",
  university: "University of Michigan",
  college: "Michigan Engineering",
  tagline: "Learn. Launch. Lead.",
  mission:
    "Unlock the entrepreneurial potential of the University of Michigan through courses, immersive experiences, coaching, and industry connection.",
  address: "3350 Duderstadt Center, 2281 Bonisteel Boulevard",
  city: "Ann Arbor, MI 48109",
  phone: "734-763-1021",
  phoneHref: "tel:+17347631021",
  email: "entrepreneurship@umich.edu",
  hours: "Monday–Friday, 9:00 a.m.–5:00 p.m.",
  official: "https://cfe.umich.edu/",
  ecosystem: "https://entrepreneurship.umich.edu/",
  since: 2008,
} as const;

export const rankings = {
  year: 2026,
  announced: "November 12, 2025",
  sourceName: "The Princeton Review and Entrepreneur",
  press: "https://www.princetonreview.com/press/top-entrepreneurial-press-release-2026",
  cfeStory:
    "https://cfe.umich.edu/10-years-top-10-2025-princeton-review-entrepreneur-magazines-rankings-leaders-best-entrepreneurship-programs/",
  undergradNational: 4,
  graduateNational: 5,
  undergradMidwest: 1,
  graduateMidwest: 1,
  priorYear: 2025,
  priorUndergrad: 6,
  priorGraduate: 3,
  surveySchools: "nearly 300",
  dataPoints: "more than 40",
  methodology:
    "The 2026 lists are the 20th annual rankings. They draw on a summer 2025 survey of administrators at nearly 300 schools in the United States, Canada, Mexico, and Europe. More than 40 measures cover academic offerings, faculty credentials, experiential learning, mentorship, and alumni ventures. Schools that do not participate are not eligible.",
} as const;

export const impact = [
  { value: "30,000+", label: "U-M students served since 2008" },
  { value: "1 in 5", label: "Undergraduates in an entrepreneurship course, 2024" },
  { value: "132", label: "of 144 undergraduate majors represented" },
  { value: "688", label: "Companies launched by undergraduate alumni in a decade" },
  { value: "$1.23B", label: "Raised by those undergraduate alumni ventures" },
  { value: "227", label: "Faculty teaching entrepreneurship across 71 departments" },
] as const;

export type Program = {
  slug: string;
  index: string;
  name: string;
  eyebrow: string;
  summary: string;
  href: string;
  official: string;
  forWhom: string;
  commitment: string;
  points: { title: string; body: string }[];
  facts: { label: string; value: string }[];
};

export const programs: Program[] = [
  {
    slug: "courses",
    index: "01",
    name: "ENTR courses",
    eyebrow: "Open enrollment",
    summary:
      "More than 30 sections, from a first venture to patent strategy, open to every school and college.",
    href: "/courses",
    official: "https://cfe.umich.edu/learn/entrepreneurial-courses/courses/",
    forWhom: "Undergraduate, master’s, PhD, and professional students.",
    commitment: "Individual courses. Most are in person on North Campus.",
    points: [],
    facts: [],
  },
  {
    slug: "leadership",
    index: "02",
    name: "Entrepreneurial Leadership",
    eyebrow: "Application · one year",
    summary:
      "A selective cohort for students who want operators’ judgment: founders in the room, a coach, and a summer inside a venture.",
    href: "/programs/leadership",
    official: "https://cfe.umich.edu/launch/entrepreneurial-leadership-program/",
    forWhom: "University of Michigan students from every college. Admission is by application.",
    commitment: "One academic year. ENTR 470 in winter, ENTR 480 in fall. Six graded credits.",
    points: [
      {
        title: "A year with the people who have done it",
        body: "Classroom sessions, campus roundtables, and U.S. discovery treks put founders, investors, and operators on the calendar, not on a reading list.",
      },
      {
        title: "Coaching Connection",
        body: "Each student is paired with an entrepreneur, investor, or leader. Pairs meet monthly through the winter. An orientation and assessments are part of the work.",
      },
      {
        title: "A summer that counts",
        body: "The summer is for a startup internship, a shadowing placement, or a student’s own venture. The Center arranges at least one interview for a paid internship at a venture-backed startup.",
      },
    ],
    facts: [
      { label: "Courses", value: "ENTR 470 and ENTR 480" },
      { label: "Credits", value: "6, graded" },
      { label: "Also satisfies", value: "Engineering PCDC credit and the Entrepreneurship Minor practicum" },
      { label: "Who may apply", value: "Students in any U-M school or college" },
    ],
  },
  {
    slug: "i-corps",
    index: "03",
    name: "NSF I-Corps",
    eyebrow: "Customer discovery",
    summary:
      "A free, virtual cohort that teaches researchers to test an idea through the customer’s eyes before anyone builds the wrong thing.",
    href: "/programs/i-corps",
    official: "https://cfe.umich.edu/learn/tech-acceleration/i-corps/",
    forWhom:
      "Graduate students, medical students, faculty, and postdocs. Additional offerings reach undergraduates and community teams.",
    commitment: "Fall 2026 cohort: October 23–December 4. Fridays at 9:00 a.m. ET. Virtual and free.",
    points: [
      {
        title: "The failure mode I-Corps is built to prevent",
        body: "Most young ventures stall because the product does not answer a real customer need. The cohort trains participants to interview, listen, and revise before that mistake gets expensive.",
      },
      {
        title: "Three skills, practiced out loud",
        body: "How to interview a potential customer. How to judge the value of an idea from that customer’s side of the table. How to map the ecosystem around the work.",
      },
      {
        title: "What people leave with",
        body: "A wider network, coaching from experienced entrepreneurs, a stronger case for later SBIR, STTR, NSF, university, and state funding, and a digital certificate.",
      },
    ],
    facts: [
      { label: "Fall 2026 dates", value: "October 23 – December 4, 2026" },
      { label: "Sessions", value: "Fridays, 9:00 a.m. ET" },
      { label: "Format", value: "Free and virtual" },
      { label: "Published deadline", value: "October 16, 2026" },
      { label: "Open to", value: "Midwest innovators and researchers" },
    ],
  },
  {
    slug: "ehour",
    index: "04",
    name: "EHour",
    eyebrow: "Fridays · ENTR 407",
    summary:
      "The Dr. Thomas Zurbuchen EHour. One hour with people who have built companies, missions, and markets. One credit if you enroll.",
    href: "/programs/ehour",
    official: "https://cfe.umich.edu/ehour/",
    forWhom: "Students, staff, families, and the public. The credit course is ENTR 407.",
    commitment: "Fridays at 11:30 a.m. in fall and winter. Most sessions meet at Stamps Auditorium.",
    points: [
      {
        title: "Named for the founder",
        body: "A gift from Marc and Mary Weiser named the series for Dr. Thomas Zurbuchen, who founded the Center. He later led NASA’s Science Mission Directorate, with missions that include the James Webb Space Telescope and Perseverance.",
      },
      {
        title: "A conversation, not a lecture slot",
        body: "Guests walk through the decisions that actually changed their work, then take questions. ENTR 417 is the companion discussion section for students who want to go further.",
      },
      {
        title: "Fall 2026 still on the calendar",
        body: "Monica Wheat of Venture Catalysts is scheduled for October 23 at Stamps Auditorium. Kate Ryder of Maven is scheduled for November 6 at Robertson Auditorium in the Ross School of Business.",
      },
    ],
    facts: [
      { label: "Course", value: "ENTR 407 · 1 credit" },
      { label: "Companion", value: "ENTR 417 discussion" },
      { label: "Usual time", value: "Fridays, 11:30 a.m." },
      { label: "Usual room", value: "Stamps Auditorium, Walgreen Drama Center, North Campus" },
    ],
  },
  {
    slug: "graduate-certificate",
    index: "05",
    name: "Graduate Certificate",
    eyebrow: "12 credits",
    summary:
      "A 12-credit certificate in innovation and entrepreneurship that sits beside a master’s, PhD, or professional degree.",
    href: "/programs/graduate-certificate",
    official: "https://cfe.umich.edu/learn/entrepreneurial-courses/graduate-opportunities/",
    forWhom:
      "Students already enrolled in a master’s, PhD, or professional degree on the Ann Arbor campus.",
    commitment: "At least 12 approved credits. ENTR 500 is required and is the right first course.",
    points: [
      {
        title: "Apply before you register",
        body: "Meet an advisor early, apply, and be admitted to the certificate before enrolling in certificate courses. That conversation is how the Center builds a schedule that fits the home degree.",
      },
      {
        title: "No second tuition bill for full-time students",
        body: "Since July 2019, certificate courses register under the student’s primary academic career. Full-time students are not charged extra tuition for the certificate.",
      },
      {
        title: "Credits can do double duty",
        body: "Some credits may be double-counted with the primary degree. The Center’s FAQ is the place to confirm what a specific program will accept.",
      },
    ],
    facts: [
      { label: "Credits", value: "12 approved credits" },
      { label: "Required course", value: "ENTR 500" },
      { label: "Campus", value: "Ann Arbor" },
      { label: "Tuition note", value: "Full-time students register under their primary career" },
    ],
  },
  {
    slug: "techlabs",
    index: "06",
    name: "Perot Jain TechLabs",
    eyebrow: "Application · year-long",
    summary:
      "Project studios with startups in mobility, climate, electrification, health, and air and space.",
    href: "/programs/techlabs",
    official: "https://cfe.umich.edu/learn/entrepreneurial-courses/courses/",
    forWhom: "Students admitted by application into a specific lab.",
    commitment: "Winter and fall, three credits each term, six graded credits in total.",
    points: [
      {
        title: "Five labs, one shape",
        body: "Air & Space, Mcity, Climate Change, Electrification, and HealthTech. Each is a year of project work beside companies already building in that field.",
      },
      {
        title: "Course numbers",
        body: "The labs run as ENTR 475/485 with a section for each theme. Mcity, Climate, and several sibling studios also satisfy the Entrepreneurship Minor practicum.",
      },
      {
        title: "What the year is for",
        body: "Students practice delivery inside someone else’s real constraints: a vehicle platform, a climate technology, a clinical workflow, a grid, or a flight system.",
      },
    ],
    facts: [
      { label: "Labs", value: "Air & Space, Mcity, Climate, Electrification, HealthTech" },
      { label: "Credits", value: "6, graded, across two terms" },
      { label: "Pattern", value: "3 credits in winter, 3 credits in fall" },
    ],
  },
];

export const ehourLineup = [
  { date: "September 11", guest: "Andy Lapsa", role: "Co-founder and CEO, Stoke Space", upcoming: false },
  { date: "September 18", guest: "Ty Dunn", role: "Founder, Continue (acquired by Cursor)", upcoming: false },
  { date: "October 2", guest: "Maayan Ziv", role: "Founder and CEO, AccessNow", upcoming: false },
  { date: "October 9", guest: "Sam Schillace", role: "CVP and Deputy CTO, Microsoft", upcoming: false },
  { date: "October 16", guest: "Kiko Dontchev", role: "Vice President, Launch, SpaceX", upcoming: false },
  { date: "October 16", guest: "Justin Lopas", role: "COO and co-founder, Base Power", upcoming: false },
  { date: "October 23", guest: "Monica Wheat", role: "Co-founder and executive director, Venture Catalysts", upcoming: true, place: "Stamps Auditorium" },
  { date: "November 6", guest: "Kate Ryder", role: "Founder and CEO, Maven", upcoming: true, place: "Robertson Auditorium, Ross" },
] as const;

export type Course = {
  code: string;
  title: string;
  credits: string;
  summary: string;
  tags: string[];
};

export const courses: Course[] = [
  { code: "ENTR 407", title: "EHour speaker series", credits: "1 credit", summary: "Friday interviews with founders and operators. Open seating for the public; credit for enrolled students.", tags: ["Open", "Leadership"] },
  { code: "ENTR 409", title: "Introduction to venture capital", credits: "1 credit · winter · 7 weeks", summary: "A compressed investor’s workflow: screen a deal, do diligence, and make a simulated go or no-go.", tags: ["Open", "Short", "Venture"] },
  { code: "ENTR 408", title: "Patent law", credits: "1 credit · 7 weeks", summary: "Case law and business scenarios applied to an invention a student brings into the room.", tags: ["Open", "Short", "Venture"] },
  { code: "ENTR 410", title: "Finding your venture", credits: "Course", summary: "A framework for designing something a specific customer will pay for, then pitching it.", tags: ["Open", "Venture"] },
  { code: "ENTR 411", title: "Entrepreneurship practicum", credits: "Practicum", summary: "Students develop their own venture idea through problem framing, interviews, and tests. Counts toward the minor practicum.", tags: ["Open", "Practicum", "Venture"] },
  { code: "ENTR 413", title: "Entrepreneurial marketing", credits: "Course", summary: "Team-based work on discovery, offer design, pricing, and whether the numbers can hold.", tags: ["Open", "Venture"] },
  { code: "ENTR 414", title: "Startup sales", credits: "Course", summary: "Business-to-business sales: the organization, the process, the technical sale, and objections.", tags: ["Open", "Venture"] },
  { code: "ENTR 402", title: "Concept to prototype: software and hardware", credits: "Studio", summary: "Microcontrollers, sensors, and weekly builds that move a sketch to something that runs.", tags: ["Open", "Make"] },
  { code: "ENTR 403", title: "Concept to prototype: 3D printing", credits: "Studio", summary: "Hands-on 3D printing, laser cutting, CNC, scanning, and CAD.", tags: ["Open", "Make"] },
  { code: "ENTR 404", title: "Starting your side gig", credits: "Course", summary: "Teams stand up a working e-commerce store, from offer and audience through sourcing and fulfillment.", tags: ["Open", "Venture", "Make"] },
  { code: "ENTR 405", title: "Digital product design", credits: "Course", summary: "UX and UI practice with critique, user feedback, and a portfolio piece at the end.", tags: ["Open", "Make"] },
  { code: "ENTR 417", title: "EHour discussion", credits: "Companion", summary: "A closer conversation around the Friday guests for students who want more than the hour.", tags: ["Open", "Leadership"] },
  { code: "ENTR 420", title: "Reimagining companies through innovation", credits: "Winter · practicum", summary: "Consulting teams advise real companies with the Economic Growth Institute. Counts toward the minor practicum.", tags: ["Open", "Practicum", "Leadership"] },
  { code: "ENTR 422", title: "Values and ethics in startups", credits: "Course", summary: "Cases on profit, responsibility, culture, and the decisions that set both.", tags: ["Open", "Leadership"] },
  { code: "ENTR 423", title: "Leading an entrepreneurial team", credits: "2 credits", summary: "Who to hire, which skills matter now, and why the team will stay.", tags: ["Open", "Leadership"] },
  { code: "ENTR 390.101", title: "Management of technology and innovation", credits: "3 credits", summary: "How organizations choose, develop, and ship technology when the market is moving.", tags: ["Open", "Leadership"] },
  { code: "ENTR 390.103", title: "Space entrepreneurship", credits: "Fall", summary: "Space technology, economics, venture models, and regulation, taught for students who are not specialists.", tags: ["Open", "Venture"] },
  { code: "ENTR 390.200", title: "Entrepreneurial project management", credits: "Course", summary: "Vision, milestones, stakeholders, and Agile delivery under uncertainty.", tags: ["Open", "Leadership"] },
  { code: "ENTR 490.104", title: "Storytelling for innovators", credits: "Course", summary: "Narrative as a tool for customers, investors, and the people you need on the team.", tags: ["Open", "Leadership"] },
  { code: "ENTR 490.105", title: "AI, entrepreneurship, and the next industrial shift", credits: "3 credits", summary: "Historical disruptions beside current AI practice, ending in an evidence-based venture proposal.", tags: ["Open", "Venture", "Make"] },
  { code: "ENTR 490.425", title: "Innovation for impact: defense and security", credits: "Winter · practicum", summary: "Teams work problems posed by defense and intelligence partners, with mentors and direct feedback. Counts toward the minor practicum.", tags: ["Open", "Practicum"] },
  { code: "ENTR 470/480", title: "Entrepreneurial Leadership Program", credits: "6 credits · application", summary: "The year-long ELP sequence. Winter, then fall. Not a drop-in course.", tags: ["Application", "Leadership"] },
  { code: "ENTR 475/485", title: "Perot Jain TechLabs", credits: "6 credits · application", summary: "Year-long studios in air and space, Mcity, climate, electrification, and health technology.", tags: ["Application", "Make", "Practicum"] },
  { code: "ENTR 500", title: "Introduction to innovation", credits: "3 credits", summary: "The certificate’s required course: markets, intellectual property, fit, equity, funding, and how to run the work.", tags: ["Open", "Certificate", "Venture"] },
  { code: "ENTR 510", title: "Compensation, funding, and ownership", credits: "3 credits · winter", summary: "Equity and ownership from formation through growth or exit, for companies and nonprofits.", tags: ["Open", "Certificate", "Venture"] },
  { code: "ENTR 520", title: "Technology-inspired business models", credits: "Course", summary: "For STEM students ready to separate creating value from capturing it. ENTR 500, or a working knowledge of the business model canvas, comes first.", tags: ["Certificate", "Venture"] },
  { code: "ENTR 525", title: "Disruptive technology", credits: "7-week short course", summary: "Where AI is actually changing work, and a way to spot the opportunities that follow.", tags: ["Open", "Short", "Certificate"] },
  { code: "ENTR 530", title: "Innovation and IP strategy", credits: "Fall", summary: "Patents, copyrights, trademarks, and trade secrets used as strategy, ideally on a technology the student already holds.", tags: ["Certificate", "Venture"] },
  { code: "ENTR 550", title: "Interpersonal skills for leadership", credits: "Course", summary: "Emotional intelligence applied to self-management, relationships, and teams.", tags: ["Open", "Certificate", "Leadership"] },
  { code: "ENTR 560", title: "Project management consulting", credits: "Course", summary: "Consulting tools practiced on projects with local startups or nonprofits.", tags: ["Open", "Practicum", "Leadership"] },
  { code: "ENTR 570", title: "Creativity and product development", credits: "Fall", summary: "Story and creative method inside the product process, for startups and existing organizations.", tags: ["Open", "Certificate", "Make"] },
];

export const courseNotes = [
  "ENTR courses are open to every U-M school and college. Undergraduate, master’s, PhD, and professional students are all in the room.",
  "No ENTR course currently lists a prerequisite. A few experiences, including ELP and the TechLabs, are by application.",
  "Undergraduates with senior standing (85 or more credits) may take 500-level courses. Graduate students may take courses numbered 400 and above.",
  "Credits generally count as electives, or as cognates with department approval. Engineering undergraduates can apply up to 4 credits toward PCDC.",
  "Registration is in Wolverine Access or Atlas under the subject code ENTR. Sections are in person.",
] as const;

export const courseFilters = ["All", "Open", "Application", "Certificate", "Short", "Practicum", "Make", "Venture", "Leadership"] as const;

export function programBySlug(slug: string) {
  return programs.find((program) => program.slug === slug);
}
