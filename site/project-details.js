window.REDESIGN_PROJECT_DETAILS = [
  { id:'sleep-apnea', num:'02', title:'Sleep Apnea Detector',
    summary:'Wearable respiratory tracker → QNX on Pi 5 → REST API → SwiftUI iOS app with anomaly alerts.',
    awards:[{kind:'pop',text:'🥈 2nd — QNX Challenge · uOttaHack 8'}],
    tags:['Fusion 360','3D Printing','Raspberry Pi 5','C++','SwiftUI','QNX'],
    cover:'sleepapneahardware.jpeg',
    description:'A wearable sleep apnea risk detection system tracking respiratory depth and rate in real time, streaming data to a mobile app and triggering automated alerts on anomaly detection.',
    sections:[
      {label:'How It Works',bullets:[
        'A <strong>custom spring-loaded housing</strong> for a potentiometer translates chest expansion into variable voltage signals.',
        'Read voltage digitally via <strong>SPI protocol</strong> and an <strong>MCP3008 ADC</strong> on Raspberry Pi 5 running <strong>QNX OS</strong>.',
        'Data pipeline via <strong>HTTP → Express/TypeScript REST API → PostgreSQL</strong> deployed on Railway.',
        'iOS app built in <strong>SwiftUI</strong> displays live breaths/min, depth classification, and warning alerts.'
      ]},
      {label:'Personal Contributions',bullets:[
        'Conceptualized the original <strong>project design</strong> and <strong>functional requirements</strong>',
        'Reverse engineered a badge reel mechanism to develop a <strong>custom spring-loaded housing</strong> for a potentiometer using <strong>Fusion 360</strong>.',
        'Developed and integrated a <strong>custom circuit framework</strong>, achieving seamless communication between hardware components.'
      ]},
      {label:'Challenges & Next Steps',bullets:[
        'No MacOS support for <strong>QNX</strong> required environment workarounds mid-hackathon.',
        'Missing kit hardware and <strong>3D printing issues</strong> resolved on the fly during the event.',
        'Next Steps: <strong>Machine learning</strong> layer to adapt thresholds to each individual’s breathing patterns.'
      ]}
    ],
    photos:[
      {src:'sleepapneahardware.jpeg',alt:'Hardware prototype on person with wiring visible'},
      {src:'sleepapneapp.jpg',alt:'Mobile app screen showing breathing data and alert'},
      {src:'IMG_7685.jpeg',alt:'Team photo at uOttaHack 8'}
    ]
  },
  { id:'deskclaw', num:'01', title:'DeskClaw — Giving AI a Body',
    summary:'Tracked rover + 6-axis 3D-printed arm + Gemini 2.5 + Whisper + ElevenLabs + YOLO11 dual-cam vision.',
    awards:[{kind:'pop',text:'🏆 Best Hardware Hack · GenAI Genisis'},{kind:'pop',text:'🏆 Overall Finalist · GenAI Genisis'}],
    tags:['Raspberry Pi 5','Arduino','YOLO11','3D Printing','C++','AI Agents','Open CV','Websockets','Whisper','ElevenLabs API','Python'],
    cover:'deskclaw.jpeg',
    description:'DeskClaw is an autonomous robot assistant designed to bridge the gap between digital intelligence and physical labor. While traditional AI agents are confined to screens, DeskClaw provides a functional "body" to assist engineers and makers in the workshop when their hands are tied.\n\nThe system acts as a real-time collaborator; you can vocalize design challenges to bounce ideas off the AI or ask for a second opinion on mechanical problems as it observes your workspace. By combining advanced computer vision with voice-activated intelligence, DeskClaw transforms from a simple tool into an active participant in the creative process.',
    sections:[
      {label:'How it Works',bullets:[
        '<strong>Body:</strong> Tracked rover chassis driven by Raspberry Pi 5 and L289N motor driver.',
        '<strong>Arm:</strong> Fully 3D-printed 6-axis robotic arm with Arduino servo control and inverse kinematics for precision positioning. Ultrasonic sensors for obstacle detection.',
        '<strong>Brain:</strong> Gemini 2.5 Flash for scene reasoning · Whisper ASR for voice input · ElevenLabs for speech output.',
        '<strong>Vision:</strong> Dual-camera system running YOLO11 for real-time object detection and spatial awareness.'
      ]},
      {label:'Personal Contributions',bullets:[
        'Conceived the concept, <strong>designed and 3D-printed all physical components</strong>, planned and <strong>soldered all circuitry</strong>.',
        'Diagnosed and resolved <strong>motor power distribution failure</strong> hours before the submission deadline.',
        'Wrote <strong>robotic arm firmware</strong> in C++ on Arduino, learning and implementing <strong>inverse kinematics</strong> within the hackathon window.'
      ]},
      {label:'Challenges and Next Steps',bullets:[
        'Transitioned from a direct solder configuration to an <strong>external power supply and breadboard distribution</strong> to meet high current demands and ensure stable torque.',
        'Developed and implemented <strong>robotic arm control logic and firmware</strong> within the last couple hours of the competition.',
        'Navigated emerging <strong>OpenClaw documentation</strong> through manual troubleshooting and independent study, as the library was too recent for standard AI/LLM assistance.',
        'Next Steps: Synchronize all DeskClaw functions to transition from individual operation to a <strong>fully integrated, unified robotic system</strong>.'
      ]}
    ],
    photos:[
      {src:'deskclaw.jpeg',alt:'Full view of DeskClaw robot with arm extended'},
      {src:'circuitry.jpg',alt:'Circuitry set up for DeskClaw with Raspberry Pi, Arduino, and motor driver'},
      {src:'openclawvision.jpeg',alt:'DeskClaw vision system in action'},
      {src:'IMG_9327.png',alt:'Team receiving award at hackathon'}
    ]
  },
  { id:'water-filter', num:'03', title:'Water Filter System & No Flow System',
    summary:'Two subsurface columns built in 5 hours to remediate a 20,000 L industrial fertilizer spill.',
    awards:[{kind:'pop',text:'🏆 1st · Engineering Without Borders'}],
    tags:['Environmental Engineering','Filtration Design','Materials Science'],
    cover:'columnAB.jpeg',
    description:'The 2026 Sustainable Design Competition (SDC) was a 5-hour engineering challenge where teams were presented with a surprise environmental scenario. The prompt involved a 20,000-liter industrial fertilizer spill near a northern Canadian community, threatening a Significant Groundwater Recharge Zone (SGRA) and a local freshwater spring. We were tasked with designing and assembling two distinct subsurface columns to remediate the site:',
    descriptionBullets:[
      '<strong>Subsurface Column A:</strong> A filtration system designed to decontaminate water while allowing it to flow into the aquifer.',
      '<strong>Subsurface Column B:</strong> A "No-Flow" barrier designed to completely block contaminated runoff from entering sensitive areas.'
    ],
    sections:[
      {label:'Column A — Filtration & Treatment (Top to bottom)',bullets:[
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
      ]},
      {label:'Column B — Flow Prevention (Top to Bottom)',bullets:[
        '<strong>Gravel:</strong> Dissipates the kinetic energy of incoming water to prevent erosion of the underlying clay barrier.',
        '<strong>Sand:</strong> Facilitates even water distribution to prevent localized pooling and hydrostatic pressure on the clay layer.',
        '<strong>Clay layer:</strong> Serves as the primary impermeable hydraulic barrier to halt the downward migration of water.',
        '<strong>6× Sponges:</strong> Failsafe for if water were to manage to get past the initial barrier.',
        '<strong>Hydrophobic cloth:</strong> Final fail safe covering the hole at the bottom of the column.'
      ]},
      {label:'Personal Contribution',bullets:[
        'Researched the provided materials and developed the <strong>specific layering sequences</strong> for both the treatment and no-flow columns.',
        'Guided teammates in building the columns and <strong>simulated material interactions</strong> by carving test holes into plastic cups to verify flow behavior.'
      ]},
      {label:'Challenges',bullets:[
        '<strong>AI</strong> usage was <strong>strictly prohibited</strong>, requiring us to rely on manual research of the provided material within the limited design window.',
        '<strong>Unable to test our filter</strong> with the actual contaminant solution until final judging, meaning the design relied entirely on theoretical material interactions.'
      ]},
      {label:'Results',bullets:[
        '<strong>Original solution metrics:</strong> Turbidity (NTU) = 1.67 , Absorbance = 0.724, Electrical Conductivity(EV) = 4.4',
        '<strong>After filtering:</strong> Turbidity (NTU) = 0.5 , Absorbance = 0.009, Electrical Conductivity(EV) = 2.0',
        '<strong>Only team to successfully reduce turbidity and electrical conductivity</strong> compared to the original solution metrics.'
      ]}
    ],
    photos:[
      {src:'columnAB.jpeg',alt:'Both columns side by side with filtration layers visible'},
      {src:'abs.jpeg',alt:'Absorbance measurement results'},
      {src:'turbidity.jpeg',alt:'Turbidity measurement results'},
      {src:'electric.jpeg',alt:'Electrical conductivity measurement results'}
    ]
  },
  { id:'spocket', num:'04', title:'Spocket — AI-powered study assistant',
    summary:'React + Gemini AI assistant for the School Notes workspace.',
    awards:[],
    tags:['React','Gemini AI','Vercel Serverless','postMessage / iframe'],
    cover:'spocket.svg',
    description:'<strong>Spocket</strong> is an AI-powered assistant for School Notes inside my private Workspace. She is a <strong>React</strong> layer on top of the notes page with a <strong>Gemini AI</strong> backend. I can ask freeform questions grounded in the actual course content, or use Find &amp; Explain to highlight and understand specific sections across the study guide and formula sheet. Onboarding, workspace help, Roam/Study modes, and keyboard shortcut reference are all built in.',
    sections:[
      {label:'What it does',bullets:[
        '<strong>AI-powered Q&A:</strong> Students ask freeform questions about their notes and Spocket answers using Gemini, grounded only in the actual uploaded content — no hallucinated answers from the internet.',
        '<strong>Find &amp; Explain:</strong> Highlights relevant sections across the study guide and formula sheet iframes via <code>postMessage</code>, then explains what was found.',
        '<strong>Onboarding state machine:</strong> Branching dialogue tree with different paths for unknown visitors, students, and returning sessions, backed by <code>localStorage</code> persistence.',
        '<strong>Workspace tools:</strong> Roam/Study immersive modes, reminder scheduling, keyboard shortcut reference, and structured help for all toolbar features.'
      ]},
      {label:'How it is built',bullets:[
        'Single React tree (Babel in-browser, no build step) mounted into <code>#spocket-root</code>, with <strong>portals</strong> for immersive layouts. AI chat routes through a <strong>Vercel serverless function</strong> that proxies to Gemini 2.0 Flash.',
        'Robot is a parameterized SVG component (expressions, props, idle states) that scales dynamically with viewport size. Notes context is extracted from iframes via <code>postMessage</code> and sent as grounding for AI responses.'
      ]}
    ],
    photos:[],
    spocket:true
  },
  { id:'wind-turbine', num:'05', title:'Mini Power Generating Wind Turbine',
    summary:'Offshore-style turbine designed and 3D-printed from scratch. Spins, generates, lights an LED.',
    awards:[],
    tags:['Fusion 360','3D Printing'],
    cover:'electric.jpeg',
    description:'A functional miniature wind turbine designed and fabricated from scratch, converting rotational kinetic energy into real electrical output via a DC generator.',
    sections:[
      {label:'Details',bullets:[
        'Modeled an offshore turbine in <strong>Fusion 360</strong>, optimizing <strong>blade geometry</strong> for aerodynamic efficiency and 3D printability.',
        'Designed and printed a full <strong>nacelle and rotor assembly</strong> in PLA, housing a <strong>DC generator</strong>.',
        'Successfully converted <strong>rotational kinetic energy into electrical output</strong>, illuminating an LED.'
      ]}
    ],
    photos:[]
  },
  { id:'sift', num:'07', title:'Sift',
    summary:'Paste a recipe link, get the ingredients and instructions instantly. No more scrolling through the whole baking page.',
    awards:[{kind:'pop',text:'Live demo'}],
    tags:['Vanilla JS','Supabase','Postgres','Auth','Cheerio','Schema.org/Recipe','Vercel Functions','Chrome Extension'],
    cover:null,
    description:'Paste any recipe link and Sift gives you the ingredients and instructions instantly — no scrolling through the whole baking page. Save anything worth keeping to a private cookbook of your own.',
    sections:[
      {label:'What it does',bullets:[
        '<strong>Paste any recipe URL</strong> → parsed server-side from <strong>schema.org/Recipe</strong> JSON-LD (~95% of major recipe sites), with microdata and WordPress-plugin-selector fallbacks for the holdouts.',
        '<strong>Reader-proxy fallback</strong> — if the site blocks bots (AllRecipes, etc.), Sift transparently retries through <code>r.jina.ai</code> so you still get the recipe.',
        '<strong>Interactive cooking aids</strong> — tap-to-cross-off ingredient checklist, tap-to-mark-done numbered steps, and a <strong>ratio-based batch scaler</strong> (¼×, ⅓×, ½×, ⅔×, ¾×, 1×, 1½×, 2×, 3×, 4×) that snaps quantities back to pretty fractions so you never end up with "1.83 eggs".',
        '<strong>Your cookbook</strong> — make any number of cookbooks (each with its own cover color or image, icon, and text color), organize recipes into custom-coloured tabs, write per-recipe notes that auto-save, upload your own bake photos, give it your own 1-5 star rating.',
        '<strong>Chrome extension</strong> — toolbar icon on any recipe page opens the same clean view in a popup. Runs locally in the browser, so it bypasses bot-blocking sites.'
      ]},
      {label:'How it is built',bullets:[
        '<strong>Frontend:</strong> Vanilla JS ES modules, no build step. Hash-based router, hand-rolled <code>h()</code> hyperscript helper, a tiny modal / toast / icon library. Edits feel instant.',
        '<strong>Backend:</strong> Originally Express + <strong>better-sqlite3</strong> for a single-user local install. Refactored for mekh.ca to <strong>Supabase Postgres</strong> with email magic-link auth and Row Level Security so each visitor gets their own private cookbook.',
        '<strong>Parser:</strong> <strong>Cheerio</strong>-based JSON-LD walker with microdata and heuristic fallbacks, deployed as a Vercel serverless function under <code>/api/sift-parse</code>.',
        '<strong>Photos:</strong> Supabase Storage bucket scoped per user via RLS so users can only read/write their own uploads.',
        '<strong>Ingredient parser</strong> handles <code>1 1/2 cups</code>, <code>½</code>, <code>1½</code>, <code>2 to 3 tablespoons</code>, <code>(8 oz) package</code>, ranges, and word numbers — fractions parsed before decimals so <code>3/4 cup</code> does not degrade to "decimal 3 with /4 stranded".'
      ]},
      {label:'Why ratios, not ±1 servings',bullets:[
        'Going from 12 → 11 servings creates ugly fractional eggs. Going from 12 → ¾× (= 9 servings) keeps every ingredient on a clean fraction. That is the kind of small choice the whole app is built around — the path that leaves you with a usable recipe at the end, not a math problem.'
      ]}
    ],
    photos:[],
    sift:true
  },
  { id:'fuel-economy', num:'08', title:'Fuel Economy Calculator',
    summary:'Pick your car, plan a route, see the fuel cost — split with passengers if you want. Works in any country.',
    awards:[{kind:'pop',text:'Live demo'}],
    tags:['Vanilla JS','Leaflet','OpenStreetMap','OpenRouteService','OSRM','GitHub Actions','EIA','NRCan'],
    cover:null,
    description:'Plan the cost of any road trip in any country. Pick your car from 1984–2026 models (or VIN-decode it), plan the route on a map with multiple stops, adjust for driving conditions, and see what the fuel will cost — split between passengers if you want.',
    sections:[
      {label:'What it does',bullets:[
        '<strong>Vehicle picker</strong> — every model 1984–2026 (40k+ entries) sourced from FuelEconomy.gov, or paste a 17-character VIN to auto-decode year/make/model via NHTSA vPIC.',
        '<strong>Route planner</strong> — origin + destination + multiple stops, alternative routes, real distances pulled from OpenStreetMap.',
        '<strong>Live regional gas prices</strong> — daily-refreshed averages by US state / region and Canadian province, scraped from EIA and Natural Resources Canada.',
        '<strong>Per-station prices</strong> — click any green dot on the map → station popup with a one-tap GasBuddy link and a "saw a price" input that saves to <code>localStorage</code> so your next visit shows your last reported price.',
        '<strong>Price history chart</strong> — recent weekly history for the active region with a 4-week linear-regression trend line. Directional, not a forecast.',
        '<strong>Driving adjustments</strong> — eco / aggressive style, AC on, towing, cold weather, mountainous terrain, etc.',
        '<strong>Vehicle comparison</strong> — pit two cars against each other on the same trip.',
        '<strong>Unit-system aware</strong> — L/100km, km/L, MPG (US), MPG (UK).'
      ]},
      {label:'How it is built',bullets:[
        '<strong>Frontend:</strong> Single-file vanilla JS, no framework, no build step — open <code>index.html</code> and it runs.',
        '<strong>Maps:</strong> Leaflet + OpenStreetMap tiles. <strong>OpenRouteService</strong> for routing with avoid-features (highways, tolls, ferries); <strong>OSRM</strong> as a key-less fallback so the app never hard-fails on missing config.',
        '<strong>Daily price refresh:</strong> a GitHub Action runs <code>scripts/update-prices.mjs</code> every morning, scrapes EIA + NRCan, and commits the new <code>data/prices.json</code> back to <code>main</code>. The parser is defensive — if a source changes shape it logs a warning and keeps the existing values rather than clobbering them with bad data.',
        '<strong>Per-station memory:</strong> price reports save to <code>localStorage</code> keyed by OSM station ID so your last-seen price comes back automatically on the next visit.',
        '<strong>Resilient by design:</strong> missing <code>prices.json</code> → fall back to in-code defaults. Missing ORS key → fall back to OSRM. Nothing crashes if a source goes dark.'
      ]}
    ],
    photos:[],
    fuelEconomy:true
  },
  { id:'surgy', num:'09', title:'SurgY',
    summary:'VR surgical trainer with custom haptic gloves, finger-curl sensing, force feedback, and QNX edge AI monitoring.',
    awards:[{kind:'pop',text:'🏆 1st Overall · cuHacking7'}],
    tags:['ESP32','LucidGloves','3D Printing','Potentiometers','Servo Motors','SteamVR','OpenGloves','Raspberry Pi 5','QNX','C++17','mlpack'],
    cover:'surgy-glove-closeup.png',
    description:'SurgY is a VR surgical training system that makes simulated procedures physical and measurable. Custom haptic gloves let trainees control virtual hands while servo-driven strings resist finger motion when the simulation detects contact, and a separate Raspberry Pi 5 running QNX monitors hand movement locally for anomaly detection.',
    sections:[
      {label:'What it does',bullets:[
        'Tracks real finger curl through retractable spools and potentiometers, then streams finger flexion data from an <strong>ESP32</strong> into <strong>OpenGloves</strong> and <strong>SteamVR</strong>.',
        'Uses <strong>servo-driven force feedback</strong> to resist individual fingers, making virtual surgical interactions feel physically present instead of only visual.',
        'Mirrors glove telemetry over USB to a <strong>Raspberry Pi 5 running QNX</strong>, keeping hand monitoring independent from the VR interaction path.'
      ]},
      {label:'QNX AI monitoring',bullets:[
        'Processes left and right hands independently with <strong>20-frame sliding windows</strong>.',
        'Extracts features for finger position, frame-to-frame movement, and short-term movement variability.',
        'Runs local <strong>mlpack KNN inference</strong> against a recorded baseline to flag unusual or unstable movement without a cloud connection.'
      ]},
      {label:'Personal contribution',bullets:[
        'Developed the core concept for SurgY: pairing haptic VR surgical practice with independent QNX hand-motion analysis.',
        'Built all project hardware, including the LucidGloves-style 3D-printed glove assembly, potentiometer sensing, servo force-feedback layout, and wiring.',
        '<strong>Repurposed</strong> the chest expansion and retraction mechanism from the sleep apnea hardware into a finger-curl angle sensor for the glove.'
      ]},
      {label:'Built with',bullets:[
        '<strong>Hardware:</strong> ESP32, 3D-printed LucidGloves-style components, potentiometers, servo motors, USB serial, Raspberry Pi 5.',
        '<strong>Software:</strong> OpenGloves, SteamVR, QNX, C++17, POSIX threads, mlpack, Armadillo.'
      ]},
      {label:'Next steps',bullets:[
        'Collect larger real-user datasets and expand beyond finger flexion into hand orientation, tool trajectories, grip consistency, tremor characteristics, and procedure-specific motion patterns.'
      ]}
    ],
    links:[
      {label:'View Devpost',url:'https://devpost.com/software/surgy'},
      {label:'View Source',url:'https://github.com/angelo-riv/surgy'}
    ],
    photos:[
      {src:'surgy-metaquest-gloves.png',alt:'Meta Quest headset with SurgY haptic gloves'},
      {src:'surgy-glove-closeup.png',alt:'Close-up of the haptic glove finger-curl mechanism'},
      {src:'surgy-controlled-incision.png',alt:'SurgY controlled-incision VR simulation'}
    ]
  },
  { id:'haptic-gloves', num:'06', title:'Force Feedback Haptic Gloves',
    summary:'VR glove that physically stops your fingers when you grab a virtual object.',
    awards:[{kind:'pop',text:'On-going'}],
    tags:['ESP32','3D Printing','Unity','C#','Fusion 360'],
    cover:'circuitry.jpg',
    description:'Standard VR controllers use "vibrations" (haptic feedback) to tell you that you’ve touched something. This prototype uses Force Feedback, which physically stops your fingers from moving when you "grab" a virtual object. It transforms a visual illusion into a physical sensation.',
    sections:[
      {label:'Details',bullets:[
        'Developing a wearable haptic glove interface around an <strong>ESP32</strong>, delivering <strong>real-time force feedback</strong> in VR environments.',
        'Prototyping a <strong>mechanical restraint system</strong> utilizing <strong>MG90S servos</strong> to simulate physical resistance when gripping virtual objects.',
        'Planning full-stack hardware integration with <strong>Unity (C#)</strong>, targeting future use in <strong>surgical training simulations</strong>.',
        'Refining all ergonomic component designs in <strong>Fusion 360</strong> and running test prints to optimize the layout for motors and electrical wiring.'
      ]}
    ],
    photos:[]
  }
];

