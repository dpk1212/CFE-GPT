export type GuideLink = { label: string; href: string };

export type GuideReply = {
  id: string;
  title: string;
  paragraphs: string[];
  facts?: { label: string; value: string }[];
  links?: GuideLink[];
  related?: string[];
};

type Entry = GuideReply & {
  phrases: string[];
  keywords: string[];
};

const entries: Entry[] = [
  {
    id: "rankings",
    title: "Where Michigan stands in 2026",
    phrases: ["princeton review", "entrepreneur magazine", "midwest", "ranking", "rankings", "ranked"],
    keywords: ["princeton", "review", "rank", "ranking", "rankings", "midwest", "undergraduate", "graduate", "number", "#4", "#5", "top"],
    paragraphs: [
      "On the 2026 Princeton Review and Entrepreneur lists, the University of Michigan—Ann Arbor is No. 4 among undergraduate entrepreneurship programs and No. 5 among graduate programs. It is No. 1 in the Midwest on both lists.",
      "The 2025 lists were graduate No. 3 and undergraduate No. 6, the tenth straight year in the national top 10. The 2026 placement keeps that run going. The lists were announced November 12, 2025, from a summer survey of nearly 300 schools and more than 40 measures, including curriculum, faculty, experiential work, mentorship, and alumni ventures.",
      "A ranking describes the ecosystem. The doors into it are ENTR courses, the Entrepreneurial Leadership Program, I-Corps, EHour, the graduate certificate, and the Perot Jain TechLabs.",
    ],
    facts: [
      { label: "Undergraduate, national", value: "No. 4" },
      { label: "Graduate, national", value: "No. 5" },
      { label: "Midwest", value: "No. 1 undergraduate and graduate" },
      { label: "2025 lists", value: "Graduate No. 3 · Undergraduate No. 6" },
    ],
    links: [
      { label: "Ranking story on this site", href: "/rankings" },
      { label: "Princeton Review announcement", href: "https://www.princetonreview.com/press/top-entrepreneurial-press-release-2026" },
    ],
    related: ["What can I actually join?", "Tell me about I-Corps"],
  },
  {
    id: "start",
    title: "A practical place to start",
    phrases: ["where do i start", "where should i start", "getting started", "new to", "i'm new", "im new", "first course", "which course"],
    keywords: ["start", "starting", "begin", "beginning", "new", "first", "advisor", "path", "recommend"],
    paragraphs: [
      "If you are a U-M student and you are curious, start with an ENTR course or with Friday EHour. Courses are open to every school and college, from first-year undergraduates through PhD and professional students. Nothing currently requires a prerequisite.",
      "EHour (ENTR 407) is the lowest-friction credit: Fridays at 11:30 a.m., one credit, and the talks are open even if you are not enrolled. ENTR 410 and ENTR 411 are the courses for students who already have a problem they want to test.",
      "If you are a graduate or professional student, ask about the 12-credit certificate and plan to take ENTR 500 first. If you are a researcher with a technology, look at NSF I-Corps before you build. Email entrepreneurship@umich.edu and an advisor will place you faster than any page can.",
    ],
    links: [
      { label: "Browse courses", href: "/courses" },
      { label: "EHour", href: "/programs/ehour" },
      { label: "Write the Center", href: "/visit" },
    ],
    related: ["Can any student take ENTR courses?", "What is the graduate certificate?"],
  },
  {
    id: "eligibility",
    title: "Who can take ENTR courses",
    phrases: ["any student", "ross student", "engineering student", "lsa", "phd student", "who can take", "non-engineering", "other schools"],
    keywords: ["eligible", "eligibility", "ross", "lsa", "si", "taubman", "nursing", "kinesiology", "public", "health", "music", "any", "everyone", "school", "college", "undergraduate", "undergrad", "senior", "prerequisite", "prereq", "remote", "online", "register", "wolverine", "atlas"],
    paragraphs: [
      "ENTR courses are open to students from every U-M school and college: undergraduate, master’s, PhD, and professional. The Center is housed in Michigan Engineering. The classroom is not limited to engineering.",
      "No ENTR course currently has a prerequisite. ELP and the Perot Jain TechLabs are the exceptions in process: they require an application. Undergraduates with senior standing, 85 credits or more, may take 500-level courses. Graduate students may take courses numbered 400 and above.",
      "Credits usually count as electives, or as cognates if the home department agrees. College of Engineering undergraduates can use up to 4 ENTR credits toward PCDC. Register in Wolverine Access or Atlas under the subject ENTR. Sections meet in person.",
    ],
    facts: [
      { label: "Prerequisites", value: "None on current ENTR courses" },
      { label: "Senior standing", value: "85+ credits to take 500-level" },
      { label: "Format", value: "In person" },
      { label: "Advising", value: "entrepreneurship@umich.edu" },
    ],
    links: [
      { label: "Course catalog", href: "/courses" },
      { label: "Official course page", href: "https://cfe.umich.edu/learn/entrepreneurial-courses/courses/" },
    ],
    related: ["Where do I start?", "What is the graduate certificate?"],
  },
  {
    id: "icorps",
    title: "NSF I-Corps at Michigan",
    phrases: ["i-corps", "i corps", "icorps", "nsf", "customer discovery", "customer interview", "research idea"],
    keywords: ["corps", "customer", "discovery", "interview", "interviews", "sbir", "sttr", "researcher", "research", "postdoc", "faculty", "commercialization", "virtual", "cohort"],
    paragraphs: [
      "I-Corps teaches researchers to look at an idea from the customer’s side. The Center describes the stakes plainly: the usual reason a startup fails is that the product does not solve a customer need.",
      "The fall 2026 cohort is free, virtual, and open to Midwest innovators and researchers. It runs October 23 through December 4, 2026, with Friday sessions at 9:00 a.m. ET. The published registration deadline was October 16, 2026. If that date has passed, ask the Center when the next cohort opens rather than assuming the door is still ajar.",
      "Core workshops serve graduate students, medical students, faculty, and postdocs. Other Center programs reach undergraduates and community teams. Participants practice customer interviews, value from the buyer’s point of view, and the surrounding ecosystem. Completing the workshop comes with coaching, a stronger path toward SBIR, STTR, NSF, university, and state funding, and a digital certificate.",
    ],
    facts: [
      { label: "Fall 2026", value: "October 23 – December 4" },
      { label: "Meets", value: "Fridays, 9:00 a.m. ET" },
      { label: "Cost", value: "Free · virtual" },
      { label: "Deadline published", value: "October 16, 2026" },
    ],
    links: [
      { label: "I-Corps page", href: "/programs/i-corps" },
      { label: "Official I-Corps page", href: "https://cfe.umich.edu/learn/tech-acceleration/i-corps/" },
    ],
    related: ["I have a research idea. Where do I start?", "What is the graduate certificate?"],
  },
  {
    id: "elp",
    title: "The Entrepreneurial Leadership Program",
    phrases: ["entrepreneurial leadership", "leadership program", "coaching connection"],
    keywords: ["elp", "leadership", "cohort", "trek", "treks", "coach", "coaching", "internship", "470", "480"],
    paragraphs: [
      "ELP is a one-year, application-based cohort for U-M students in any college. It is not an open section. Students enroll in ENTR 470, a 3-credit course, in the winter, then ENTR 480, another 3 credits, in the fall.",
      "The year includes access to founders, investors, and operators, U.S. discovery treks, and Coaching Connection: a monthly pairing with an entrepreneur, investor, or leader through the winter. In the summer, students take a startup internship, shadow, or build their own venture. The Center provides at least one interview for a paid internship at a venture-backed startup.",
      "The sequence satisfies Engineering PCDC credit and the practicum requirement for the undergraduate Entrepreneurship Minor.",
    ],
    facts: [
      { label: "Courses", value: "ENTR 470 (winter) and ENTR 480 (fall)" },
      { label: "Credits", value: "6, graded" },
      { label: "Admission", value: "Application and selection" },
      { label: "Eligible", value: "U-M students, every school and college" },
    ],
    links: [
      { label: "ELP page", href: "/programs/leadership" },
      { label: "Official ELP page", href: "https://cfe.umich.edu/launch/entrepreneurial-leadership-program/" },
    ],
    related: ["What are the TechLabs?", "Where do I start?"],
  },
  {
    id: "ehour",
    title: "Dr. Thomas Zurbuchen EHour",
    phrases: ["e hour", "e-hour", "ehour", "speaker series", "zurbuchen", "entr 407"],
    keywords: ["ehour", "speaker", "speakers", "friday", "fridays", "407", "417", "stamps", "zurbuchen", "lineup", "monica", "ryder"],
    paragraphs: [
      "EHour is the Center’s Friday speaker series, named for founder Dr. Thomas Zurbuchen through a gift from Marc and Mary Weiser. It runs in the fall and winter. The public is welcome. Students who want credit enroll in ENTR 407, one credit. ENTR 417 is the discussion companion.",
      "The standing time is Friday at 11:30 a.m. at Stamps Auditorium in the Walgreen Drama Center on North Campus. Individual weeks can move. The November 6, 2026 conversation with Kate Ryder is at Robertson Auditorium in the Ross School of Business.",
      "Still ahead on the published fall 2026 lineup: Monica Wheat of Venture Catalysts on October 23, and Kate Ryder of Maven on November 6. Earlier fall guests included Andy Lapsa, Ty Dunn, Maayan Ziv, Sam Schillace, Kiko Dontchev, and Justin Lopas. Confirm the week on the official EHour page before you cross campus.",
    ],
    facts: [
      { label: "Credit", value: "ENTR 407 · 1 credit" },
      { label: "Time", value: "Fridays, 11:30 a.m." },
      { label: "Room", value: "Stamps Auditorium, unless a week says otherwise" },
      { label: "Next published", value: "Monica Wheat · October 23" },
    ],
    links: [
      { label: "EHour page", href: "/programs/ehour" },
      { label: "Official EHour page", href: "https://cfe.umich.edu/ehour/" },
    ],
    related: ["Where do I start?", "Who was Thomas Zurbuchen?"],
  },
  {
    id: "certificate",
    title: "Graduate Certificate in Innovation and Entrepreneurship",
    phrases: ["graduate certificate", "grad certificate", "12 credit", "12-credit", "entr 500"],
    keywords: ["certificate", "graduate", "master", "masters", "phd", "doctoral", "professional", "500", "tuition", "double"],
    paragraphs: [
      "The Graduate Certificate in Innovation and Entrepreneurship is 12 approved credits. It is for students already pursuing a master’s, PhD, or professional degree on the Ann Arbor campus. It is built to sit beside the home degree, not replace it.",
      "Apply and be admitted before registering for certificate courses. ENTR 500, Introduction to Innovation, is required and is the course to take first. Some credits can be double-counted with the primary program; confirm the rules for your school.",
      "Since July 2019, students register certificate coursework under their primary academic career. Full-time students are not charged extra tuition for the certificate.",
    ],
    facts: [
      { label: "Credits", value: "12" },
      { label: "Required", value: "ENTR 500 first" },
      { label: "Who", value: "Current Ann Arbor master’s, PhD, and professional students" },
      { label: "Extra tuition", value: "Not for full-time students on the primary career" },
    ],
    links: [
      { label: "Certificate page", href: "/programs/graduate-certificate" },
      { label: "Official graduate page", href: "https://cfe.umich.edu/learn/entrepreneurial-courses/graduate-opportunities/" },
    ],
    related: ["Can any student take ENTR courses?", "Tell me about I-Corps"],
  },
  {
    id: "techlabs",
    title: "Perot Jain TechLabs",
    phrases: ["techlab", "tech lab", "perot jain", "mcity"],
    keywords: ["techlab", "techlabs", "perot", "jain", "mcity", "climate", "electrification", "healthtech", "health", "aerospace", "space", "475", "485"],
    paragraphs: [
      "The Perot Jain TechLabs are year-long, application-based studios. Students work on projects with startups in one of five themes: Air & Space, Mcity (transportation), Climate Change, Electrification, and HealthTech.",
      "Each lab is ENTR 475/485 with its own section. The pattern is 3 graded credits in the winter and 3 in the fall, six credits in total. Several of the labs also satisfy the undergraduate Entrepreneurship Minor practicum.",
      "These are not drop-in courses. Apply to the lab whose industry you actually want to work inside.",
    ],
    facts: [
      { label: "Themes", value: "Air & Space, Mcity, Climate, Electrification, HealthTech" },
      { label: "Credits", value: "6 across two terms" },
      { label: "Admission", value: "By application" },
    ],
    links: [
      { label: "TechLabs page", href: "/programs/techlabs" },
      { label: "Courses", href: "/courses" },
    ],
    related: ["What is ELP?", "Where do I start?"],
  },
  {
    id: "visit",
    title: "How to reach the Center",
    phrases: ["where are you", "where is the center", "duderstadt", "office hours", "phone number", "email address", "how do i contact", "how to contact"],
    keywords: ["where", "location", "address", "visit", "hours", "phone", "email", "contact", "duderstadt", "bonisteel", "north", "campus", "advisor", "advising"],
    paragraphs: [
      "The Center sits in the Duderstadt Center on North Campus: 3350 Duderstadt Center, 2281 Bonisteel Boulevard, Ann Arbor, MI 48109. The desk is open Monday through Friday, 9:00 a.m. to 5:00 p.m.",
      "Call 734-763-1021 or email entrepreneurship@umich.edu. Advisors are the right next step for certificate planning, course fit, and anything an application requires.",
      "This guide restates published Center information. Registration, deadlines, and room changes live on cfe.umich.edu and in Wolverine Access.",
    ],
    facts: [
      { label: "Room", value: "3350 Duderstadt Center" },
      { label: "Hours", value: "Monday–Friday, 9–5" },
      { label: "Phone", value: "734-763-1021" },
      { label: "Email", value: "entrepreneurship@umich.edu" },
    ],
    links: [
      { label: "Visit page", href: "/visit" },
      { label: "Official site", href: "https://cfe.umich.edu/" },
    ],
    related: ["Where do I start?", "Who can take ENTR courses?"],
  },
  {
    id: "founder",
    title: "The Center and its founder",
    phrases: ["thomas zurbuchen", "dr z", "who founded", "history of the center"],
    keywords: ["zurbuchen", "founder", "founded", "history", "mission", "2008", "kurt", "skifstad", "director"],
    paragraphs: [
      "The Center for Entrepreneurship has operated since 2008. Dr. Thomas Zurbuchen founded it while he was a Michigan professor of space science and aerospace engineering. He later led NASA’s Science Mission Directorate. The Friday series carries his name.",
      "Kurt Skifstad is the Dixon and Carol Doll Executive Director. The mission is straightforward: educational opportunities, immersive experiences, coaching, and industry connections so people at Michigan can turn what they know into something that ships.",
      "The Center’s own account is that more than 30,000 U-M students have come through since 2008. In the 2024 academic year, just over 1 in 5 undergraduates, across 132 of 144 majors, enrolled in an entrepreneurship course.",
    ],
    links: [
      { label: "About the ranking and the Center", href: "/rankings" },
      { label: "Visit", href: "/visit" },
    ],
    related: ["Where does Michigan rank?", "What is EHour?"],
  },
  {
    id: "minor",
    title: "The Entrepreneurship Minor and practicum",
    phrases: ["entrepreneurship minor", "practicum requirement"],
    keywords: ["minor", "practicum", "pcdc"],
    paragraphs: [
      "The undergraduate Entrepreneurship Minor is a university partnership, not a single CFE major. Several CFE courses satisfy its practicum: ENTR 411, ENTR 420, ENTR 490.425, the ELP sequence, and Perot Jain TechLabs including Mcity and Climate.",
      "College of Engineering undergraduates can also apply up to 4 ENTR credits toward PCDC, Professional and Creative Development Courses. Confirm both with the advisor for your degree. The minor itself is administered with the Provost’s Office.",
    ],
    links: [
      { label: "Courses that carry the practicum", href: "/courses" },
      { label: "Campus entrepreneurship gateway", href: "https://entrepreneurship.umich.edu/" },
    ],
    related: ["Can any student take ENTR courses?", "What is ELP?"],
  },
];

const fallback: GuideReply = {
  id: "fallback",
  title: "I can brief you on the published record",
  paragraphs: [
    "I answer from the Center’s published programs: the 2026 Princeton Review placement, ENTR courses, ELP, NSF I-Corps, EHour, the graduate certificate, the TechLabs, and how to reach an advisor.",
    "Try a specific question, or use one of the prompts below. For a decision about your own schedule, email entrepreneurship@umich.edu or call 734-763-1021.",
  ],
  links: [
    { label: "Programs", href: "/programs" },
    { label: "Courses", href: "/courses" },
    { label: "Visit", href: "/visit" },
  ],
  related: [
    "Where does Michigan rank?",
    "Where do I start?",
    "Tell me about I-Corps",
    "What is the graduate certificate?",
  ],
};

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9#+\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(input: string) {
  const stop = new Set(["a", "an", "the", "is", "are", "do", "does", "did", "i", "me", "my", "we", "our", "you", "your", "to", "of", "for", "and", "or", "in", "on", "at", "with", "about", "what", "whats", "who", "how", "can", "could", "should", "please", "tell", "want", "like", "any", "where", "there"]);
  return normalize(input)
    .split(" ")
    .map((word) => word.replace(/-/g, ""))
    .filter((word) => word.length > 1 && !stop.has(word));
}

const strongWords = new Set([
  "elp",
  "ehour",
  "icorps",
  "princeton",
  "rank",
  "ranking",
  "rankings",
  "ranked",
  "certificate",
  "mcity",
  "techlab",
  "techlabs",
  "zurbuchen",
  "duderstadt",
  "sbir",
  "sttr",
  "minor",
  "pcdc",
  "bonisteel",
]);

function toReply(entry: Entry): GuideReply {
  return {
    id: entry.id,
    title: entry.title,
    paragraphs: entry.paragraphs,
    facts: entry.facts,
    links: entry.links,
    related: entry.related,
  };
}

export function answerQuestion(query: string): GuideReply {
  const cleaned = query.trim();
  if (!cleaned) return fallback;

  const text = normalize(cleaned);
  const words = new Set(tokens(cleaned));
  let best: Entry | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    let score = 0;
    for (const phrase of entry.phrases) {
      if (text.includes(phrase)) score += 8;
    }
    for (const keyword of entry.keywords) {
      const compact = keyword.replace(/-/g, "");
      if (words.has(compact) || text.includes(keyword)) {
        score += strongWords.has(compact) ? 6 : 2;
      }
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < 4) return fallback;
  return toReply(best);
}

export const prompts = [
  "Where does Michigan rank?",
  "Where do I start?",
  "Can any student take ENTR courses?",
  "Tell me about I-Corps",
  "What is ELP?",
  "What is the graduate certificate?",
  "Who is speaking at EHour?",
  "Where is the Center?",
];
