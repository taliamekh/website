// Shared project data for all mockups. All copy + images are pulled verbatim from
// the original index.html so every mockup expands to the same source content.
window.PROJECTS = [
  {
    id: 'sleep-apnea',
    num: '01',
    title: 'Sleep Apnea Detector',
    summary: 'Wearable respiratory tracker → QNX on Pi 5 → REST API → SwiftUI iOS app with anomaly alerts.',
    awards: [
      { kind: 'silver', text: '🥈 2nd — QNX Challenge · uOttaHack 8' }
    ],
    tags: ['Fusion 360','3D Printing','Raspberry Pi 5','C++','SwiftUI','QNX'],
    cover: '../sleepapneahardware.jpeg',
    description: 'A wearable sleep apnea risk detection system tracking respiratory depth and rate in real time, streaming data to a mobile app and triggering automated alerts on anomaly detection.',
    sections: [
      {
        label: 'How It Works',
        bullets: [
          'A <strong>custom spring-loaded housing</strong> for a potentiometer translates chest expansion into variable voltage signals.',
          'Read voltage digitally via <strong>SPI protocol</strong> and an <strong>MCP3008 ADC</strong> on Raspberry Pi 5 running <strong>QNX OS</strong>.',
          'Data pipeline via <strong>HTTP → Express/TypeScript REST API → PostgreSQL</strong> deployed on Railway.',
          'iOS app built in <strong>SwiftUI</strong> displays live breaths/min, depth classification, and warning alerts.'
        ]
      },
      {
        label: 'Personal Contributions',
        bullets: [
          'Conceptualized the original <strong>project design</strong> and <strong>functional requirements</strong>',
          'Reverse engineered a badge reel mechanism to develop a <strong>custom spring-loaded housing</strong> for a potentiometer using <strong>Fusion 360</strong>.',
          'Developed and integrated a <strong>custom circuit framework</strong>, achieving seamless communication between hardware components.'
        ]
      },
      {
        label: 'Challenges & Next Steps',
        bullets: [
          'No MacOS support for <strong>QNX</strong> required environment workarounds mid-hackathon.',
          'Missing kit hardware and <strong>3D printing issues</strong> resolved on the fly during the event.',
          'Next Steps: <strong>Machine learning</strong> layer to adapt thresholds to each individual’s breathing patterns.'
        ]
      }
    ],
    photos: [
      { src: '../sleepapneahardware.jpeg', alt: 'Hardware prototype on person with wiring visible' },
      { src: '../sleepapneapp.jpg', alt: 'Mobile app screen showing breathing data and alert' },
      { src: '../IMG_7685.jpeg', alt: 'Team photo at uOttaHack 8' }
    ]
  },
  {
    id: 'deskclaw',
    num: '02',
    title: 'DeskClaw — Giving AI a Body',
    summary: 'Tracked rover + 6-axis 3D-printed arm + Gemini 2.5 + Whisper + ElevenLabs + YOLO11 dual-cam vision.',
    awards: [
      { kind: 'gold', text: '🏆 Best Hardware Hack · GenAI Genisis' },
      { kind: 'gold', text: '🏆 Overall Finalist · GenAI Genisis' }
    ],
    tags: ['Raspberry Pi 5','Arduino','YOLO11','3D Printing','C++','AI Agents','Open CV','Websockets','Whisper','ElevenLabs API','Python'],
    cover: '../deskclaw.jpeg',
    description: 'DeskClaw is an autonomous robot assistant designed to bridge the gap between digital intelligence and physical labor. While traditional AI agents are confined to screens, DeskClaw provides a functional "body" to assist engineers and makers in the workshop when their hands are tied.\n\nThe system acts as a real-time collaborator; you can vocalize design challenges to bounce ideas off the AI or ask for a second opinion on mechanical problems as it observes your workspace. By combining advanced computer vision with voice-activated intelligence, DeskClaw transforms from a simple tool into an active participant in the creative process.',
    sections: [
      {
        label: 'How it Works',
        bullets: [
          '<strong>Body:</strong> Tracked rover chassis driven by Raspberry Pi 5 and L289N motor driver.',
          '<strong>Arm:</strong> Fully 3D-printed 6-axis robotic arm with Arduino servo control and inverse kinematics for precision positioning. Ultrasonic sensors for obstacle detection.',
          '<strong>Brain:</strong> Gemini 2.5 Flash for scene reasoning · Whisper ASR for voice input · ElevenLabs for speech output.',
          '<strong>Vision:</strong> Dual-camera system running YOLO11 for real-time object detection and spatial awareness.'
        ]
      },
      {
        label: 'Personal Contributions',
        bullets: [
          'Conceived the concept, <strong>designed and 3D-printed all physical components</strong>, planned and <strong>soldered all circuitry</strong>.',
          'Diagnosed and resolved <strong>motor power distribution failure</strong> hours before the submission deadline.',
          'Wrote <strong>robotic arm firmware</strong> in C++ on Arduino, learning and implementing <strong>inverse kinematics</strong> within the hackathon window.'
        ]
      },
      {
        label: 'Challenges and Next Steps',
        bullets: [
          'Transitioned from a direct solder configuration to an <strong>external power supply and breadboard distribution</strong> to meet high current demands and ensure stable torque.',
          'Developed and implemented <strong>robotic arm control logic and firmware</strong> within the last couple hours of the competition.',
          'Navigated emerging <strong>OpenClaw documentation</strong> through manual troubleshooting and independent study, as the library was too recent for standard AI/LLM assistance.',
          'Next Steps: Synchronize all DeskClaw functions to transition from individual operation to a <strong>fully integrated, unified robotic system</strong>.'
        ]
      }
    ],
    photos: [
      { src: '../deskclaw.jpeg', alt: 'Full view of DeskClaw robot with arm extended' },
      { src: '../circuitry.jpg', alt: 'Circuitry set up for DeskClaw with Raspberry Pi, Arduino, and motor driver' },
      { src: '../openclawvision.jpeg', alt: 'DeskClaw vision system in action' },
      { src: '../IMG_9327.png', alt: 'Team receiving award at hackathon' }
    ]
  },
  {
    id: 'water-filter',
    num: '03',
    title: 'Water Filter System & No Flow System',
    summary: 'Two subsurface columns built in 5 hours to remediate a 20,000 L industrial fertilizer spill.',
    awards: [
      { kind: 'gold', text: '🏆 1st · Engineering Without Borders' }
    ],
    tags: ['Environmental Engineering','Filtration Design','Materials Science'],
    cover: '../columnAB.jpeg',
    description: 'The 2026 Sustainable Design Competition (SDC) was a 5-hour engineering challenge where teams were presented with a surprise environmental scenario. The prompt involved a 20,000-liter industrial fertilizer spill near a northern Canadian community, threatening a Significant Groundwater Recharge Zone (SGRA) and a local freshwater spring. We were tasked with designing and assembling two distinct subsurface columns to remediate the site:',
    descriptionBullets: [
      '<strong>Subsurface Column A:</strong> A filtration system designed to decontaminate water while allowing it to flow into the aquifer.',
      '<strong>Subsurface Column B:</strong> A "No-Flow" barrier designed to completely block contaminated runoff from entering sensitive areas.'
    ],
    sections: [
      {
        label: 'Column A — Filtration & Treatment (Top to bottom)',
        bullets: [
          '<strong>Drainage Gravel:</strong> Serves as a primary physical barrier to block large debris.',
          '<strong>Sand:</strong> Filters out finer particles.',
          '<strong>Sand + Biochar:</strong> Implemented as a protective buffer. Biochar’s efficacy is maximized when protected from direct contact with heavy sediment/soil by this transition layer.',
          '<strong>Biochar:</strong> Functions via adsorption, utilizing a high surface area and extensive pore structure to trap chemical pollutants and volatile organic compounds.',
          '<strong>GAC (Granular Activated Carbon):</strong> Acts through a process called absorptions, where the carbons large surface area + large pores absorb/trap contaminents and polutants.',
          '<strong>Resin:</strong> A specialized cation exchange resin used to reduce electrical conductivity by stripping hardness ions, such as Calcium, Magnesium, and various dissolved salts.',
          '<strong>Green Sand:</strong> Utilized to deal with any remaining ions from the resin filteration, by taking the disolved ions and turning them into solids that remain trapped in the filteration media.',
          '<strong>Sand:</strong> Provides a stable, structural foundation for the upper filtration layers to prevent shifting.',
          '<strong>Cotton Balls:</strong> Presoaked and used to act as a final purification layer, ensuring high clarity output without absorbing and retaining water from the flow.',
          '<strong>Mesh Cloth:</strong> Acts as a containment barrier to prevent cotton fibers or media from exiting the column with the treated water.'
        ]
      },
      {
        label: 'Column B — Flow Prevention (Top to Bottom)',
        bullets: [
          '<strong>Gravel:</strong> Dissipates the kinetic energy of incoming water to prevent erosion of the underlying clay barrier.',
          '<strong>Sand:</strong> Facilitates even water distribution to prevent localized pooling and hydrostatic pressure on the clay layer.',
          '<strong>Clay layer:</strong> Serves as the primary impermeable hydraulic barrier to halt the downward migration of water.',
          '<strong>6× Sponges:</strong> Failsafe for if water were to manage to get past the initial barrier.',
          '<strong>Hydrophobic cloth:</strong> Final fail safe covering the hole at the bottom of the column.'
        ]
      },
      {
        label: 'Personal Contribution',
        bullets: [
          'Researched the provided materials and developed the <strong>specific layering sequences</strong> for both the treatment and no-flow columns.',
          'Guided teammates in building the columns and <strong>simulated material interactions</strong> by carving test holes into plastic cups to verify flow behavior.'
        ]
      },
      {
        label: 'Challenges',
        bullets: [
          '<strong>AI</strong> usage was <strong>strictly prohibited</strong>, requiring us to rely on manual research of the provided material within the limited design window.',
          '<strong>Unable to test our filter</strong> with the actual contaminant solution until final judging, meaning the design relied entirely on theoretical material interactions.'
        ]
      },
      {
        label: 'Results',
        bullets: [
          '<strong>Original solution metrics:</strong> Turbidity (NTU) = 1.67 , Absorbance = 0.724, Electrical Conductivity(EV) = 4.4',
          '<strong>After filtering:</strong> Turbidity (NTU) = 0.5 , Absorbance = 0.009, Electrical Conductivity(EV) = 2.0',
          '<strong>Only team to successfully reduce turbidity and electrical conductivity</strong> compared to the original solution metrics.'
        ]
      }
    ],
    photos: [
      { src: '../columnAB.jpeg', alt: 'Both columns side by side with filtration layers visible' },
      { src: '../abs.jpeg', alt: 'Absorbance measurement results' },
      { src: '../turbidity.jpeg', alt: 'Turbidity measurement results' },
      { src: '../electric.jpeg', alt: 'Electrical conductivity measurement results' }
    ]
  },
  {
    id: 'spocket',
    num: '04',
    title: 'Spocket — AI-powered study assistant',
    summary: 'React + Gemini AI tutor for the Student Resources workspace. Live, not a mockup.',
    awards: [
      { kind: 'pink', text: 'Personal Project' },
      { kind: 'pink', text: 'v2 — AI' }
    ],
    tags: ['React','Gemini AI','Vercel Serverless','postMessage / iframe'],
    cover: '../IMG_7671.png',
    description: '<strong>Spocket</strong> is an AI-powered study assistant for the Student Resources workspace I use with students I tutor. She is a <strong>React</strong> layer on top of the notes page with a <strong>Gemini AI</strong> backend. Students can ask freeform questions about their notes and get answers grounded in the actual content, or use Find &amp; Explain to highlight and understand specific sections across the study guide and formula sheet. Onboarding, workspace help, Roam/Study modes, and keyboard shortcut reference are all built in.',
    sections: [
      {
        label: 'What it does',
        bullets: [
          '<strong>AI-powered Q&A:</strong> Students ask freeform questions about their notes and Spocket answers using Gemini, grounded only in the actual uploaded content — no hallucinated answers from the internet.',
          '<strong>Find &amp; Explain:</strong> Highlights relevant sections across the study guide and formula sheet iframes via <code>postMessage</code>, then explains what was found.',
          '<strong>Onboarding state machine:</strong> Branching dialogue tree with different paths for unknown visitors, students, and returning sessions, backed by <code>localStorage</code> persistence.',
          '<strong>Workspace tools:</strong> Roam/Study immersive modes, reminder scheduling, keyboard shortcut reference, and structured help for all toolbar features.'
        ]
      },
      {
        label: 'How it is built',
        bullets: [
          'Single React tree (Babel in-browser, no build step) mounted into <code>#spocket-root</code>, with <strong>portals</strong> for immersive layouts. AI chat routes through a <strong>Vercel serverless function</strong> that proxies to Gemini 2.0 Flash.',
          'Robot is a parameterized SVG component (expressions, props, idle states) that scales dynamically with viewport size. Notes context is extracted from iframes via <code>postMessage</code> and sent as grounding for AI responses.'
        ]
      }
    ],
    photos: [],
    spocket: true
  },
  {
    id: 'wind-turbine',
    num: '05',
    title: 'Mini Power Generating Wind Turbine',
    summary: 'Offshore-style turbine designed and 3D-printed from scratch. Spins, generates, lights an LED.',
    awards: [
      { kind: 'neutral', text: 'School Project' }
    ],
    tags: ['Fusion 360','3D Printing'],
    cover: '../electric.jpeg',
    description: 'A functional miniature wind turbine designed and fabricated from scratch, converting rotational kinetic energy into real electrical output via a DC generator.',
    sections: [
      {
        label: 'Details',
        bullets: [
          'Modeled an offshore turbine in <strong>Fusion 360</strong>, optimizing <strong>blade geometry</strong> for aerodynamic efficiency and 3D printability.',
          'Designed and printed a full <strong>nacelle and rotor assembly</strong> in PLA, housing a <strong>DC generator</strong>.',
          'Successfully converted <strong>rotational kinetic energy into electrical output</strong>, illuminating an LED.'
        ]
      }
    ],
    photos: []
  },
  {
    id: 'haptic-gloves',
    num: '06',
    title: 'Force Feedback Haptic Gloves',
    summary: 'VR glove that physically stops your fingers when you grab a virtual object.',
    awards: [
      { kind: 'pink', text: 'Personal Project' },
      { kind: 'cyan', text: 'On-going' }
    ],
    tags: ['ESP32','3D Printing','Unity','C#','Fusion 360'],
    cover: '../circuitry.jpg',
    description: 'Standard VR controllers use "vibrations" (haptic feedback) to tell you that you’ve touched something. This prototype uses Force Feedback, which physically stops your fingers from moving when you "grab" a virtual object. It transforms a visual illusion into a physical sensation.',
    sections: [
      {
        label: 'Details',
        bullets: [
          'Developing a wearable haptic glove interface around an <strong>ESP32</strong>, delivering <strong>real-time force feedback</strong> in VR environments.',
          'Prototyping a <strong>mechanical restraint system</strong> utilizing <strong>MG90S servos</strong> to simulate physical resistance when gripping virtual objects.',
          'Planning full-stack hardware integration with <strong>Unity (C#)</strong>, targeting future use in <strong>surgical training simulations</strong>.',
          'Refining all ergonomic component designs in <strong>Fusion 360</strong> and running test prints to optimize the layout for motors and electrical wiring.'
        ]
      }
    ],
    photos: []
  }
];

// Shared expanded-detail render. Returns inner HTML for the expanded panel.
window.renderProjectDetail = function(p, opts) {
  opts = opts || {};
  const labelClass = opts.labelClass || 'p-label';
  const pointsClass = opts.pointsClass || 'p-points';
  const photosClass = opts.photosClass || 'p-photos';
  const tagsClass = opts.tagsClass || 'p-tags';
  const awardsClass = opts.awardsClass || 'p-awards';

  const awardsHTML = (p.awards || []).map(a =>
    `<span class="p-award ${a.kind}">${a.text}</span>`
  ).join('');

  const tagsHTML = (p.tags || []).map(t =>
    `<span class="p-tag">${t}</span>`
  ).join('');

  const descHTML = (p.description || '').split('\n\n').map(par =>
    `<p class="p-desc">${par}</p>`
  ).join('');

  const descBullets = (p.descriptionBullets || []).length
    ? `<ul class="${pointsClass}">${p.descriptionBullets.map(b => `<li>${b}</li>`).join('')}</ul>`
    : '';

  const sectionsHTML = (p.sections || []).map(s => `
    <div class="${labelClass}">${s.label}</div>
    <ul class="${pointsClass}">${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
  `).join('');

  const photosHTML = (p.photos && p.photos.length)
    ? `<div class="${photosClass}">${p.photos.map(ph =>
        `<figure class="p-photo"><img src="${ph.src}" alt="${ph.alt}"><figcaption>${ph.alt}</figcaption></figure>`
      ).join('')}</div>`
    : '';

  const spocketHTML = p.spocket ? `
    <div class="spocket-stage">
      <div class="spocket-face" aria-hidden="true">
        <svg viewBox="0 0 88 48" xmlns="http://www.w3.org/2000/svg" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="1.5" y="1.5" width="85" height="45" rx="22" stroke="#a87895" stroke-width="1.75" opacity="0.9"/>
          <path d="M16 28 Q28 10 40 28" stroke="#7fdbca" stroke-width="2.1" stroke-linecap="round"/>
          <path d="M48 28 Q60 10 72 28" stroke="#7fdbca" stroke-width="2.1" stroke-linecap="round"/>
          <path d="M34 37 Q44 43 54 37" stroke="#7fdbca" stroke-width="1.95" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="spocket-msg">
        <span class="spocket-whisper">Try Spocket live · Student Resources</span>
        <p><span class="spocket-hi">This is the real thing, not a mockup.</span> Open <strong>Student Resources</strong> to walk through onboarding, ask AI questions about the notes, use Find &amp; Explain, and try Roam/Study modes. Everything runs live.</p>
        <a href="../notes/index.html" class="spocket-cta" onclick="event.stopPropagation()">Open Student Resources →</a>
      </div>
    </div>
  ` : '';

  return `
    <div class="${awardsClass}">${awardsHTML}</div>
    <h3 class="p-title">${p.title}</h3>
    ${descHTML}
    ${descBullets}
    ${sectionsHTML}
    ${spocketHTML}
    ${photosHTML}
    <div class="${tagsClass}">${tagsHTML}</div>
  `;
};
