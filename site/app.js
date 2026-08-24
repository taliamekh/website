const pageContent = document.querySelector('#page-content');
const body = document.body;
const navLinks = [...document.querySelectorAll('[data-page-link]')];
const menuToggle = document.querySelector('.menu-toggle');
const mainMenu = document.querySelector('#main-menu');
const modal = document.querySelector('#detail-modal');
const modalKicker = document.querySelector('#modal-kicker');
const modalTitle = document.querySelector('#modal-title');
const modalCopy = document.querySelector('#modal-copy');
const modalActions = document.querySelector('#modal-actions');
const imageLightbox = document.querySelector('#image-lightbox');
const imageLightboxImage = document.querySelector('#image-lightbox-image');
const imageLightboxCaption = document.querySelector('#image-lightbox-caption');
const brandLong = document.querySelector('.brand-long');
const brandShort = document.querySelector('.brand-short');
const typeStudio = document.querySelector('#type-studio');
const typeStudioToggle = document.querySelector('#type-studio-toggle');
const typeStudioClose = document.querySelector('#type-studio-close');
const typeStudioOptions = document.querySelector('#type-studio-options');

let currentOption = '1';
let currentPage = 'home';
let lastFocused = null;
let lastImageFocused = null;
let spocketReactRoot = null;
let spocketMountGeneration = 0;

const scrapbookChoices = [
  { id: '1', label: 'Curated Keepsakes' },
  { id: '2', label: 'Open Journal' },
  { id: '3', label: 'Film & Paper' },
  { id: '4', label: 'Pinned Archive' },
  { id: '5', label: 'Collected Works' },
  { id: '6', label: 'Layered Polaroids' }
];

const scrapbookCompositions = {
  '1': {
    surgy: ['tape', 7, '16 / 10', '-1.1deg'],
    deskclaw: ['polaroid', 5, '4 / 5', '.9deg'],
    'sleep-apnea': ['postcard', 4, '4 / 5', '-.6deg'],
    'water-filter': ['paperclip', 8, '16 / 9', '.7deg'],
    spocket: ['polaroid', 4, '4 / 5', '.5deg'],
    'wind-turbine': ['note', 3, '1 / 1', '-1deg'],
    sift: ['stamp', 5, '5 / 4', '.8deg'],
    'fuel-economy': ['tape', 8, '16 / 9', '-.5deg']
  },
  '2': {
    surgy: ['polaroid', 4, '4 / 5', '-1.2deg'],
    deskclaw: ['tape', 8, '16 / 10', '.5deg'],
    'sleep-apnea': ['paperclip', 4, '4 / 5', '.8deg'],
    'water-filter': ['polaroid', 4, '4 / 5', '-.5deg'],
    spocket: ['postcard', 4, '4 / 5', '.9deg'],
    'wind-turbine': ['note', 3, '1 / 1', '-.8deg'],
    sift: ['stamp', 3, '1 / 1', '.5deg'],
    'fuel-economy': ['film', 6, '16 / 9', '-.5deg']
  },
  '3': {
    surgy: ['film', 8, '16 / 10', '-.7deg'],
    deskclaw: ['polaroid', 4, '4 / 5', '1deg'],
    'sleep-apnea': ['tape', 5, '4 / 5', '-1deg'],
    'water-filter': ['postcard', 7, '16 / 10', '.6deg'],
    spocket: ['paperclip', 4, '4 / 5', '.6deg'],
    'wind-turbine': ['note', 3, '1 / 1', '-.7deg'],
    sift: ['stamp', 5, '5 / 4', '.8deg'],
    'fuel-economy': ['tape', 8, '16 / 9', '-.4deg']
  },
  '4': {
    surgy: ['paperclip', 5, '4 / 5', '-.8deg'],
    deskclaw: ['tape', 7, '16 / 10', '.7deg'],
    'sleep-apnea': ['stamp', 4, '4 / 5', '.7deg'],
    'water-filter': ['tape', 8, '16 / 9', '-.6deg'],
    spocket: ['polaroid', 4, '4 / 5', '-.5deg'],
    'wind-turbine': ['note', 4, '1 / 1', '.6deg'],
    sift: ['postcard', 4, '1 / 1', '-.6deg'],
    'fuel-economy': ['film', 8, '16 / 9', '.4deg']
  },
  '5': {
    surgy: ['postcard', 5, '4 / 5', '-.9deg'],
    deskclaw: ['paperclip', 7, '16 / 10', '.5deg'],
    'sleep-apnea': ['polaroid', 4, '4 / 5', '.8deg'],
    'water-filter': ['stamp', 4, '4 / 5', '-.7deg'],
    spocket: ['tape', 4, '4 / 5', '.6deg'],
    'wind-turbine': ['note', 3, '1 / 1', '-.8deg'],
    sift: ['film', 4, '1 / 1', '.5deg'],
    'fuel-economy': ['tape', 5, '4 / 3', '-.4deg']
  }
};

let scrapbookSelection = '1';

try {
  const savedScrapbook = window.localStorage.getItem('doll-whimsy-scrapbook-v1');
  if (scrapbookChoices.some(choice => choice.id === savedScrapbook)) scrapbookSelection = savedScrapbook;
} catch (_) { /* Local preview persistence is optional. */ }

const backgroundChoices = [
  { id: '01', label: 'Blue Black', value: '#020b1b' },
  { id: '02', label: 'Deep Navy', value: '#06152d' },
  { id: '03', label: 'Midnight Ink', value: '#081a33' },
  { id: '04', label: 'Sapphire Night', value: '#0c2340' },
  { id: '05', label: 'Inkwell Blue', value: '#102a43' },
  { id: '06', label: 'Atlantic Navy', value: '#123252' },
  { id: '07', label: 'Slate Navy', value: '#1b365d' },
  { id: '08', label: 'Storm Blue', value: '#243b5a' },
  { id: '09', label: 'Royal Dusk', value: '#192f5d' },
  { id: '10', label: 'Velvet Blue', value: '#222e50' },
  { id: '11', label: 'Muted Cobalt', value: '#203b73' },
  { id: '12', label: 'Twilight Blue', value: '#2a3f66' }
];

let backgroundSelection = '06';

try {
  const savedBackground = window.localStorage.getItem('doll-whimsy-background-v2');
  if (backgroundChoices.some(choice => choice.id === savedBackground)) backgroundSelection = savedBackground;
} catch (_) { /* Local preview persistence is optional. */ }

const accentChoices = [
  { id: 'P01', label: 'Porcelain Pink', value: '#f7dde7', section: 'Baby pink - 10 shades' },
  { id: 'P02', label: 'Baby Pink', value: '#f4cfe0' },
  { id: 'P03', label: 'Ballet Pink', value: '#efc1d3' },
  { id: 'P04', label: 'Blush Pink', value: '#e8b8ca' },
  { id: 'P05', label: 'Rose Milk', value: '#e3afc1' },
  { id: 'P06', label: 'Petal Pink', value: '#f2bfd0' },
  { id: 'P07', label: 'Powder Rose', value: '#dfa5b8' },
  { id: 'P08', label: 'Shell Pink', value: '#f5c9d2' },
  { id: 'P09', label: 'Cotton Candy', value: '#edb0ca' },
  { id: 'P10', label: 'Dusty Baby Pink', value: '#d99baa' },
  { id: 'L01', label: 'Lavender Frost', value: '#e5ddf5', section: 'Lavender - 10 shades' },
  { id: 'L02', label: 'Lilac Mist', value: '#dcd0f0' },
  { id: 'L03', label: 'Lavender Mist', value: '#c9b9e8' },
  { id: 'L04', label: 'Periwinkle Lavender', value: '#c5c9f2' },
  { id: 'L05', label: 'Wisteria', value: '#bfa7d8' },
  { id: 'L06', label: 'Orchid Haze', value: '#d3b4e2' },
  { id: 'L07', label: 'Mauve Pearl', value: '#c8afcf' },
  { id: 'L08', label: 'Violet Milk', value: '#d6c2ee' },
  { id: 'L09', label: 'Heather', value: '#b9a6d1' },
  { id: 'L10', label: 'Amethyst Mist', value: '#c2b2e4' },
  { id: 'B01', label: 'Ice Blue', value: '#d9eef7', section: 'Blue - 10 shades' },
  { id: 'B02', label: 'Powder Blue', value: '#b9d5e8' },
  { id: 'B03', label: 'Sky Milk', value: '#c7e0f0' },
  { id: 'B04', label: 'Periwinkle Blue', value: '#b8c5f2' },
  { id: 'B05', label: 'Cornflower Mist', value: '#afc7ea' },
  { id: 'B06', label: 'Robin Egg Blue', value: '#bde2e8' },
  { id: 'B07', label: 'Blue Pearl', value: '#a9cce3' },
  { id: 'B08', label: 'Glacier Blue', value: '#c5e2f0' },
  { id: 'B09', label: 'Soft Denim', value: '#9fb9d8' },
  { id: 'B10', label: 'Moonlight Blue', value: '#d0dcf2' }
];

let accentSelection = 'P03';

try {
  const savedAccent = window.localStorage.getItem('doll-whimsy-accent-v3');
  if (accentChoices.some(choice => choice.id === savedAccent)) accentSelection = savedAccent;
} catch (_) { /* Local preview persistence is optional. */ }

const typeChoices = {
  brand: [
    { id: '01', label: 'Parisienne', sample: 'TM', html: 'TM', family: 'Parisienne' },
    { id: '02', label: 'Allura', sample: 'TM', html: 'TM', family: 'Allura' },
    { id: '03', label: 'Petit Formal Script', sample: 'TM', html: 'TM', family: 'Petit Formal Script' },
    { id: '04', label: 'Italianno', sample: 'TM', html: 'TM', family: 'Italianno' },
    { id: '05', label: 'Dancing Script', sample: 'TM', html: 'TM', family: 'Dancing Script' },
    { id: '06', label: 'Great Vibes', sample: 'TM', html: 'TM', family: 'Great Vibes' },
    { id: '07', label: 'Alex Brush', sample: 'TM', html: 'TM', family: 'Alex Brush' },
    { id: '08', label: 'Sacramento', sample: 'TM', html: 'TM', family: 'Sacramento' },
    { id: '09', label: 'Marck Script', sample: 'TM', html: 'TM', family: 'Marck Script' },
    { id: '10', label: 'Merienda', sample: 'TM', html: 'TM', family: 'Merienda' },
    { id: '11', label: 'Courgette', sample: 'TM', html: 'TM', family: 'Courgette' },
    { id: '12', label: 'Sriracha', sample: 'TM', html: 'TM', family: 'Sriracha' },
    { id: '13', label: 'Caveat', sample: 'TM', html: 'TM', family: 'Caveat' },
    { id: '14', label: 'Kalam', sample: 'TM', html: 'TM', family: 'Kalam' },
    { id: '15', label: 'Mali', sample: 'TM', html: 'TM', family: 'Mali' },
    { id: '16', label: 'Gochi Hand', sample: 'TM', html: 'TM', family: 'Gochi Hand' },
    { id: '17', label: 'Shantell Sans', sample: 'TM', html: 'TM', family: 'Shantell Sans' },
    { id: '18', label: 'Playpen Sans', sample: 'TM', html: 'TM', family: 'Playpen Sans' },
    { id: '19', label: 'Delius Swash Caps', sample: 'TM', html: 'TM', family: 'Delius Swash Caps' },
    { id: '20', label: 'Grandstander', sample: 'TM', html: 'TM', family: 'Grandstander' },
    { id: '21', label: 'Berkshire Swash', sample: 'TM', html: 'TM', family: 'Berkshire Swash' },
    { id: '22', label: 'Lobster Two', sample: 'TM', html: 'TM', family: 'Lobster Two' },
    { id: '23', label: 'Pacifico', sample: 'TM', html: 'TM', family: 'Pacifico' },
    { id: '24', label: 'Oleo Script', sample: 'TM', html: 'TM', family: 'Oleo Script' },
    { id: '25', label: 'Sofia', sample: 'TM', html: 'TM', family: 'Sofia' },
    { id: '26', label: 'Cookie', sample: 'TM', html: 'TM', family: 'Cookie' },
    { id: '27', label: 'Kaushan Script', sample: 'TM', html: 'TM', family: 'Kaushan Script' },
    { id: '28', label: 'Yellowtail', sample: 'TM', html: 'TM', family: 'Yellowtail' },
    { id: '29', label: 'Damion', sample: 'TM', html: 'TM', family: 'Damion' },
    { id: '30', label: 'Norican', sample: 'TM', html: 'TM', family: 'Norican' },
    { id: '31', label: 'Rochester', sample: 'TM', html: 'TM', family: 'Rochester' },
    { id: '32', label: 'Leckerli One', sample: 'TM', html: 'TM', family: 'Leckerli One' },
    { id: '33', label: 'Pattaya', sample: 'TM', html: 'TM', family: 'Pattaya' },
    { id: '34', label: 'Lobster', sample: 'TM', html: 'TM', family: 'Lobster' },
    { id: '35', label: 'Agbalumo', sample: 'TM', html: 'TM', family: 'Agbalumo' },
    { id: '36', label: 'Galada', sample: 'TM', html: 'TM', family: 'Galada' },
    { id: '37', label: 'Fugaz One', sample: 'TM', html: 'TM', family: 'Fugaz One' },
    { id: '38', label: 'Julee', sample: 'TM', html: 'TM', family: 'Julee' },
    { id: '39', label: 'Akaya Kanadaka', sample: 'TM', html: 'TM', family: 'Akaya Kanadaka' },
    { id: '40', label: 'Akaya Telivigala', sample: 'TM', html: 'TM', family: 'Akaya Telivigala' },
    { id: '41', label: 'Yesteryear', sample: 'TM', html: 'TM', family: 'Yesteryear' },
    { id: '42', label: 'Oregano', sample: 'TM', html: 'TM', family: 'Oregano' },
    { id: '43', label: 'Rancho', sample: 'TM', html: 'TM', family: 'Rancho' },
    { id: '44', label: 'Chewy', sample: 'TM', html: 'TM', family: 'Chewy' },
    { id: '45', label: 'Cherry Cream Soda', sample: 'TM', html: 'TM', family: 'Cherry Cream Soda' },
    { id: '46', label: 'Grand Hotel', sample: 'TM', html: 'TM', family: 'Grand Hotel' },
    { id: '47', label: 'Playball', sample: 'TM', html: 'TM', family: 'Playball' },
    { id: '48', label: 'Montez', sample: 'TM', html: 'TM', family: 'Montez' },
    { id: '49', label: 'Arizonia', sample: 'TM', html: 'TM', family: 'Arizonia' },
    { id: '50', label: 'Euphoria Script', sample: 'TM', html: 'TM', family: 'Euphoria Script' },
    { id: '51', label: 'Quintessential', sample: 'TM', html: 'TM', family: 'Quintessential' },
    { id: '52', label: 'Felipa', sample: 'TM', html: 'TM', family: 'Felipa' },
    { id: '53', label: 'Fondamento', sample: 'TM', html: 'TM', family: 'Fondamento' },
    { id: '54', label: 'Almendra', sample: 'TM', html: 'TM', family: 'Almendra' },
    { id: '55', label: 'Sevillana', sample: 'TM', html: 'TM', family: 'Sevillana' }
  ],
  site: [
    { id: '00', label: 'Curated doll-whimsy mix', sample: 'Script + serif + handwritten', family: 'Newsreader', section: 'Selected mix' },
    { id: '01', label: 'Mali', sample: 'Robotics, projects, and notes', family: 'Mali', section: 'Handwritten + whimsical - 30' },
    { id: '02', label: 'Kalam', sample: 'Robotics, projects, and notes', family: 'Kalam' },
    { id: '03', label: 'Patrick Hand', sample: 'Robotics, projects, and notes', family: 'Patrick Hand' },
    { id: '04', label: 'Caveat', sample: 'Robotics, projects, and notes', family: 'Caveat' },
    { id: '05', label: 'Gochi Hand', sample: 'Robotics, projects, and notes', family: 'Gochi Hand' },
    { id: '06', label: 'Architects Daughter', sample: 'Robotics, projects, and notes', family: 'Architects Daughter' },
    { id: '07', label: 'Coming Soon', sample: 'Robotics, projects, and notes', family: 'Coming Soon' },
    { id: '08', label: 'Handlee', sample: 'Robotics, projects, and notes', family: 'Handlee' },
    { id: '09', label: 'Pangolin', sample: 'Robotics, projects, and notes', family: 'Pangolin' },
    { id: '10', label: 'Itim', sample: 'Robotics, projects, and notes', family: 'Itim' },
    { id: '11', label: 'Gaegu', sample: 'Robotics, projects, and notes', family: 'Gaegu' },
    { id: '12', label: 'Gamja Flower', sample: 'Robotics, projects, and notes', family: 'Gamja Flower' },
    { id: '13', label: 'Short Stack', sample: 'Robotics, projects, and notes', family: 'Short Stack' },
    { id: '14', label: 'Playpen Sans', sample: 'Robotics, projects, and notes', family: 'Playpen Sans' },
    { id: '15', label: 'Sriracha', sample: 'Robotics, projects, and notes', family: 'Sriracha' },
    { id: '16', label: 'Gloria Hallelujah', sample: 'Robotics, projects, and notes', family: 'Gloria Hallelujah' },
    { id: '17', label: 'Neucha', sample: 'Robotics, projects, and notes', family: 'Neucha' },
    { id: '18', label: 'Mansalva', sample: 'Robotics, projects, and notes', family: 'Mansalva' },
    { id: '19', label: 'Delius', sample: 'Robotics, projects, and notes', family: 'Delius' },
    { id: '20', label: 'Delius Swash Caps', sample: 'Robotics, projects, and notes', family: 'Delius Swash Caps' },
    { id: '21', label: 'Delius Unicase', sample: 'Robotics, projects, and notes', family: 'Delius Unicase' },
    { id: '22', label: 'Grandstander', sample: 'Robotics, projects, and notes', family: 'Grandstander' },
    { id: '23', label: 'Marck Script', sample: 'Robotics, projects, and notes', family: 'Marck Script' },
    { id: '24', label: 'Merienda', sample: 'Robotics, projects, and notes', family: 'Merienda' },
    { id: '25', label: 'Courgette', sample: 'Robotics, projects, and notes', family: 'Courgette' },
    { id: '26', label: 'Klee One', sample: 'Robotics, projects, and notes', family: 'Klee One' },
    { id: '27', label: 'Dekko', sample: 'Robotics, projects, and notes', family: 'Dekko' },
    { id: '28', label: 'Shantell Sans', sample: 'Robotics, projects, and notes', family: 'Shantell Sans' },
    { id: '29', label: 'Sniglet', sample: 'Robotics, projects, and notes', family: 'Sniglet' },
    { id: '30', label: 'Sour Gummy', sample: 'Robotics, projects, and notes', family: 'Sour Gummy' },
    { id: '31', label: 'Lora', sample: 'Robotics, projects, and notes', family: 'Lora', section: 'Professional - 30' },
    { id: '32', label: 'Libre Baskerville', sample: 'Robotics, projects, and notes', family: 'Libre Baskerville' },
    { id: '33', label: 'Source Serif 4', sample: 'Robotics, projects, and notes', family: 'Source Serif 4' },
    { id: '34', label: 'Merriweather', sample: 'Robotics, projects, and notes', family: 'Merriweather' },
    { id: '35', label: 'Crimson Pro', sample: 'Robotics, projects, and notes', family: 'Crimson Pro' },
    { id: '36', label: 'EB Garamond', sample: 'Robotics, projects, and notes', family: 'EB Garamond' },
    { id: '37', label: 'Newsreader', sample: 'Robotics, projects, and notes', family: 'Newsreader' },
    { id: '38', label: 'Spectral', sample: 'Robotics, projects, and notes', family: 'Spectral' },
    { id: '39', label: 'Alegreya', sample: 'Robotics, projects, and notes', family: 'Alegreya' },
    { id: '40', label: 'Cardo', sample: 'Robotics, projects, and notes', family: 'Cardo' },
    { id: '41', label: 'Cormorant Garamond', sample: 'Robotics, projects, and notes', family: 'Cormorant Garamond' },
    { id: '42', label: 'Playfair Display', sample: 'Robotics, projects, and notes', family: 'Playfair Display' },
    { id: '43', label: 'DM Serif Display', sample: 'Robotics, projects, and notes', family: 'DM Serif Display' },
    { id: '44', label: 'Fraunces', sample: 'Robotics, projects, and notes', family: 'Fraunces' },
    { id: '45', label: 'Vollkorn', sample: 'Robotics, projects, and notes', family: 'Vollkorn' },
    { id: '46', label: 'Noto Serif', sample: 'Robotics, projects, and notes', family: 'Noto Serif' },
    { id: '47', label: 'Roboto Slab', sample: 'Robotics, projects, and notes', family: 'Roboto Slab' },
    { id: '48', label: 'Bitter', sample: 'Robotics, projects, and notes', family: 'Bitter' },
    { id: '49', label: 'Arvo', sample: 'Robotics, projects, and notes', family: 'Arvo' },
    { id: '50', label: 'Zilla Slab', sample: 'Robotics, projects, and notes', family: 'Zilla Slab' },
    { id: '51', label: 'Nunito Sans', sample: 'Robotics, projects, and notes', family: 'Nunito Sans' },
    { id: '52', label: 'Manrope', sample: 'Robotics, projects, and notes', family: 'Manrope' },
    { id: '53', label: 'Montserrat', sample: 'Robotics, projects, and notes', family: 'Montserrat' },
    { id: '54', label: 'Raleway', sample: 'Robotics, projects, and notes', family: 'Raleway' },
    { id: '55', label: 'Work Sans', sample: 'Robotics, projects, and notes', family: 'Work Sans' },
    { id: '56', label: 'Source Sans 3', sample: 'Robotics, projects, and notes', family: 'Source Sans 3' },
    { id: '57', label: 'Lato', sample: 'Robotics, projects, and notes', family: 'Lato' },
    { id: '58', label: 'Karla', sample: 'Robotics, projects, and notes', family: 'Karla' },
    { id: '59', label: 'Mulish', sample: 'Robotics, projects, and notes', family: 'Mulish' },
    { id: '60', label: 'Quicksand', sample: 'Robotics, projects, and notes', family: 'Quicksand' },
    { id: '61', label: 'Charm', sample: 'Robotics, projects, and notes', family: 'Charm', section: 'Soft calligraphic - 20' },
    { id: '62', label: 'Laila', sample: 'Robotics, projects, and notes', family: 'Laila' },
    { id: '63', label: 'El Messiri', sample: 'Robotics, projects, and notes', family: 'El Messiri' },
    { id: '64', label: 'Gotu', sample: 'Robotics, projects, and notes', family: 'Gotu' },
    { id: '65', label: 'Macondo', sample: 'Robotics, projects, and notes', family: 'Macondo' },
    { id: '66', label: 'Yeseva One', sample: 'Robotics, projects, and notes', family: 'Yeseva One' },
    { id: '67', label: 'Amarante', sample: 'Robotics, projects, and notes', family: 'Amarante' },
    { id: '68', label: 'Belleza', sample: 'Robotics, projects, and notes', family: 'Belleza' },
    { id: '69', label: 'Quando', sample: 'Robotics, projects, and notes', family: 'Quando' },
    { id: '70', label: 'Caudex', sample: 'Robotics, projects, and notes', family: 'Caudex' },
    { id: '71', label: 'Eczar', sample: 'Robotics, projects, and notes', family: 'Eczar' },
    { id: '72', label: 'Kurale', sample: 'Robotics, projects, and notes', family: 'Kurale' },
    { id: '73', label: 'Mirza', sample: 'Robotics, projects, and notes', family: 'Mirza' },
    { id: '74', label: 'Rufina', sample: 'Robotics, projects, and notes', family: 'Rufina' },
    { id: '75', label: 'Rosarivo', sample: 'Robotics, projects, and notes', family: 'Rosarivo' },
    { id: '76', label: 'Cormorant Upright', sample: 'Robotics, projects, and notes', family: 'Cormorant Upright' },
    { id: '77', label: 'Averia Serif Libre', sample: 'Robotics, projects, and notes', family: 'Averia Serif Libre' },
    { id: '78', label: 'Gilda Display', sample: 'Robotics, projects, and notes', family: 'Gilda Display' },
    { id: '79', label: 'Solway', sample: 'Robotics, projects, and notes', family: 'Solway' },
    { id: '80', label: 'Trirong', sample: 'Robotics, projects, and notes', family: 'Trirong' }
  ]
};

const typeSelection = { brand: '03', site: '00' };

try {
  const savedTypeSelection = JSON.parse(window.localStorage.getItem('doll-whimsy-type-selection-v4') || '{}');
  ['site'].forEach(group => {
    if (typeChoices[group].some(choice => choice.id === savedTypeSelection[group])) {
      typeSelection[group] = savedTypeSelection[group];
    }
  });
} catch (_) { /* Local preview persistence is optional. */ }

function setTypeStudioOpen(open) {
  if (!typeStudio || !typeStudioToggle) return;
  typeStudio.hidden = !open;
  if (open) typeStudio.scrollTop = 0;
  typeStudioToggle.setAttribute('aria-expanded', String(open));
}

function renderTypeStudio() {
  if (!typeStudioOptions) return;
  const headings = {
    brand: 'TM menu icon - 55 options',
    site: 'Curated mix + 80 alternatives'
  };

  const backgroundOptions = `
    <section class="type-group background-group" aria-labelledby="background-group-title">
      <h3 id="background-group-title">Flat background - 12 coordinated blues</h3>
      <div class="background-choice-grid">
        ${backgroundChoices.map(choice => `
          <button type="button" class="background-choice" data-background-value="${choice.id}" aria-pressed="${backgroundSelection === choice.id}">
            <span class="background-swatch" style="--background-swatch:${choice.value}"></span>
            <span><strong>${choice.id}</strong>${choice.label}<small>${choice.value}</small></span>
          </button>`).join('')}
      </div>
    </section>`;

  const accentOptions = `
    <section class="type-group accent-group" aria-labelledby="accent-group-title">
      <h3 id="accent-group-title">Accent colour - 30 options</h3>
      <div class="accent-choice-grid">
        ${accentChoices.map(choice => `
          ${choice.section ? `<h4 class="type-subheading">${choice.section}</h4>` : ''}
          <button type="button" class="accent-choice" data-accent-value="${choice.id}" aria-pressed="${accentSelection === choice.id}">
            <span class="accent-swatch" style="--accent-swatch:${choice.value}"></span>
            <span><strong>${choice.id}</strong>${choice.label}<small>${choice.value}</small></span>
          </button>`).join('')}
      </div>
    </section>`;

  typeStudioOptions.innerHTML = accentOptions + backgroundOptions + Object.entries(typeChoices).filter(([group]) => group !== 'brand').map(([group, choices]) => `
    <section class="type-group" aria-labelledby="type-group-${group}">
      <h3 id="type-group-${group}">${headings[group]}</h3>
      <div class="type-choice-grid ${group}-choice-grid">
        ${choices.map(choice => `
          ${choice.section ? `<h4 class="type-subheading">${choice.section}</h4>` : ''}
          <button type="button" class="type-choice" data-type-group="${group}" data-type-value="${choice.id}" aria-pressed="${typeSelection[group] === choice.id}" style="--choice-font: '${choice.family}'">
            <span class="type-sample">${choice.sample}</span>
            <span class="type-label">${choice.id} &middot; ${choice.label}</span>
          </button>`).join('')}
      </div>
    </section>`).join('');
}

function applyTypeSelection() {
  body.dataset.brandStyle = typeSelection.brand;
  body.dataset.siteFont = typeSelection.site;
  body.dataset.backgroundStyle = backgroundSelection;

  const background = backgroundChoices.find(choice => choice.id === backgroundSelection);
  document.documentElement.style.setProperty('--site-bg', background.value);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', background.value);

  const accent = accentChoices.find(choice => choice.id === accentSelection);
  document.documentElement.style.setProperty('--pink', accent.value);

  const brand = typeChoices.brand.find(choice => choice.id === typeSelection.brand);
  brandLong.innerHTML = brand.html;
  brandShort.innerHTML = brand.html;

  if (typeStudioOptions) {
    typeStudioOptions.querySelectorAll('[data-type-group]').forEach(button => {
      const active = typeSelection[button.dataset.typeGroup] === button.dataset.typeValue;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    typeStudioOptions.querySelectorAll('[data-background-value]').forEach(button => {
      const active = backgroundSelection === button.dataset.backgroundValue;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    typeStudioOptions.querySelectorAll('[data-accent-value]').forEach(button => {
      const active = accentSelection === button.dataset.accentValue;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
}

renderTypeStudio();
applyTypeSelection();

const projects = [
  {
    id: 'surgy', number: '08',
    title: 'Surgy',
    summary: 'VR surgical training with custom finger sensing and force-feedback gloves.',
    image: '/surgy-glove-closeup.png', imagePosition: 'center', cardAspect: '441 / 573',
    achievements: ['1st Overall · cuHacking7'],
    detail: 'A VR surgical trainer with custom haptic gloves, finger-curl sensing, force feedback, and QNX edge monitoring.'
  },
  {
    id: 'deskclaw', number: '01',
    title: 'DeskClaw — Giving AI a Body',
    summary: 'Tracked rover, six-axis printed arm, voice control, and dual-camera computer vision.',
    image: '/deskclaw.jpeg', imagePosition: 'center', cardAspect: '2731 / 5697',
    achievements: ['Best Hardware Hack · GenAI Genisis', 'Overall Finalist · GenAI Genisis'],
    detail: 'An autonomous workshop assistant combining a tracked base, a six-axis 3D-printed arm, Gemini, Whisper, ElevenLabs, and YOLO11 dual-camera vision.'
  },
  {
    id: 'sleep-apnea', number: '02',
    title: 'Sleep Apnea Detector',
    summary: 'Wearable respiratory tracking with QNX processing and a SwiftUI alert interface.',
    image: '/sleepapneahardware.jpeg', imagePosition: 'center', cardAspect: '1170 / 2007',
    achievements: ['2nd · QNX Challenge · uOttaHack 8'],
    detail: 'A wearable respiratory tracker sends data through QNX on Raspberry Pi 5, a REST API, and a SwiftUI iOS app with anomaly alerts.'
  },
  {
    id: 'water-filter', number: '03',
    title: 'Water Filter System',
    summary: 'Two treatment columns built for an industrial fertilizer spill scenario.',
    image: '/columnAB.jpeg', imagePosition: 'center', cardAspect: '2040 / 2119',
    achievements: ['1st · Engineering Without Borders'],
    detail: 'Two subsurface columns were designed and built in five hours to remediate a simulated 20,000-litre industrial fertilizer spill.'
  },
  {
    id: 'spocket', number: '04',
    title: 'Spocket',
    summary: 'React and Gemini AI assistant for the School Notes workspace.',
    symbol: 'spocket', cardAspect: '3 / 4',
    achievements: [],
    detail: 'Spocket answers questions using the notes content, finds and explains relevant sections, and provides guided study tools inside Workspace.'
  },
  {
    id: 'wind-turbine', number: '05',
    title: 'Mini Power Generating Wind Turbine',
    summary: 'Offshore-style turbine designed and 3D-printed from scratch. Spins, generates, and lights an LED.',
    cardAspect: '280 / 260',
    achievements: [],
    detail: 'A functional miniature wind turbine designed in Fusion 360 and 3D printed around a DC generator capable of illuminating an LED.'
  },
  {
    id: 'sift', number: '06',
    title: 'Sift',
    summary: 'Paste a recipe link and get the ingredients and instructions instantly, without scrolling through the whole page.',
    symbol: 'sift', cardAspect: '280 / 330',
    achievements: [],
    detail: 'Sift removes the clutter from recipe pages, supports scaling and cooking interactions, and saves recipes to a private cookbook.'
  },
  {
    id: 'fuel-economy', number: '07',
    title: 'Fuel Economy Calculator',
    summary: 'Pick your car, plan a route, see the fuel cost, and split it between passengers in any country.',
    symbol: 'fuel', cardAspect: '280 / 360',
    achievements: [],
    detail: 'A worldwide route and fuel-cost planner with vehicle data, regional fuel prices, driving adjustments, and passenger splitting.'
  }
];

let approvedFuelTileScene = FUEL_TILE_SCENE;

function applyBundledProjectDetails() {
  const redesignDetails = window.REDESIGN_PROJECT_DETAILS || [];
  projects.forEach(project => {
    const detail = redesignDetails.find(item => item.id === project.id);
    if (!detail) return;
    project.description = detail.description;
    project.descriptionBullets = detail.descriptionBullets || [];
    project.sections = detail.sections || [];
    project.tags = detail.tags || [];
    project.photos = detail.photos || [];
    project.links = detail.links || [];
  });
}

function renderAchievementBadges(project) {
  return project.achievements
    .map(achievement => `<span class="achievement-badge ${project.achievementType || 'win'}">${achievement}</span>`)
    .join('');
}

function renderProjectMedia(project) {
  const badges = renderAchievementBadges(project);

  if (project.image) {
    return `<span class="project-media project-media-photo" aria-hidden="true" style="--project-image:url('${project.image}')">
      <img src="${project.image}" alt="" style="object-position:${project.imagePosition || 'center'}">
      <span class="achievement-stack">${badges}</span>
    </span>`;
  }

  if (project.symbol === 'spocket') {
    return `<span class="project-media project-media-symbol project-media-spocket" aria-hidden="true">
      <span class="project-symbol project-symbol-spocket">${SPOCKET_SVG}</span>
      <span class="achievement-stack">${badges}</span>
    </span>`;
  }

  if (project.symbol === 'sift') {
    return `<span class="project-media project-media-symbol project-media-sift" aria-hidden="true">
      <span class="sift-tile-mark">${SIFT_MARK_SVG}</span>
      <span class="achievement-stack">${badges}</span>
    </span>`;
  }

  if (project.symbol === 'fuel') {
    return `<span class="project-media project-media-symbol project-media-fuel" aria-hidden="true">
      ${approvedFuelTileScene}
      <span class="achievement-stack">${badges}</span>
    </span>`;
  }

  return '';
}

const isLocalPreview = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const isStaticPreview = isLocalPreview && window.location.port === '8000';

// Both Spocket entry points are intentional: the dedicated Study bubble belongs
// in Workspace, while the Spocket project keeps its own School Notes action.
const workspaceItems = [
  { title: 'School Notes', href: '/school-notes/?redesign=1' },
  { title: 'Expenses', href: '/expenses/' },
  { title: 'Projects', href: '/workspace/project-in-progress/' },
  { title: 'Road to CA', href: '/workspace/road-to-ca/' },
  { title: 'Study with Spocket', href: '/school-notes/?spocket=study&redesign=1' }
];

const projectDestinations = {
  spocket: [
    { label: 'Open School Notes', url: '/school-notes/?from=spocket-project&redesign=1' }
  ],
  sift: [
    { label: 'Open Sift', url: '/sift/' },
    { label: 'View project code on GitHub', url: 'https://github.com/taliamekh/sift' }
  ],
  'fuel-economy': [
    { label: 'Open Fuel Economy', url: '/fuel-economy/' },
    { label: 'View project code on GitHub', url: 'https://github.com/taliamekh/Fuel-Economy-Calculator' }
  ]
};

// Client keys remain private: only their SHA-256 hashes are shipped, matching
// the access behavior of the archived production portal.
const PORTALS = {
  'd2d3ba301d1368b06433532095853c6e3ea60d6e5f7de2e6239e15d00612bf54': '/portal/clients/orrery-build-3b8f2d.html',
  '300b4e64aa61e9bc5a2221681e46c931d92ae8482e44cc6a412a6fe6aa0a6e0a': '/portal/clients/meridian-robotics-7f3a9c.html',
  '805cf4d638d4eb29da2117a867473a01ec665a929f99d4277d3caf4c044ebc76': '/portal/clients/northwind-systems-9d2b41.html'
};
const PORTAL_REMEMBER_STORE = 'tm_portal_key';

const projectBentoClasses = {
  surgy: 'bento-tall',
  deskclaw: 'bento-feature',
  'sleep-apnea': 'bento-tall',
  'water-filter': 'bento-tall',
  spocket: 'bento-tall',
  'wind-turbine': 'bento-compact',
  // These illustration-first previews are approved as short bento tiles.
  sift: 'bento-medium',
  'fuel-economy': 'bento-medium'
};

const views = {
  home: () => `
    <section class="page home-page" aria-labelledby="home-title">
      <div class="home-frame">
        <img class="home-border" src="/site/assets/home-border-transparent.png" alt="" aria-hidden="true">
        <div class="home-composition">
          <div class="hero-copy">
            <h1 id="home-title" class="hero-name"><span>Talia</span> <span>Mekhayche</span></h1>
            <p class="hero-role">B.Eng. Mechanical at Carleton University</p>
            <div class="hero-actions">
              <button class="primary-action" type="button" data-go-page="projects">View my projects</button>
              <button class="text-action" type="button" data-go-page="contact">Contact me</button>
            </div>
          </div>
          <aside class="home-aside" aria-label="Portfolio highlights">
            <div class="stat"><strong>8</strong><span>featured projects</span></div>
            <div class="stat"><strong class="win-count">6<span class="win-multiplier">x</span></strong><span>hackathon + competition wins</span></div>
          </aside>
        </div>
      </div>
    </section>`,

  projects: () => `
    <section class="page projects-page" aria-labelledby="projects-title">
      <header class="page-heading projects-heading">
        <h1 id="projects-title">Projects</h1>
      </header>
      <div class="projects-layout">
        <div class="project-grid bento-grid">
          ${projects.map((project, index) => {
            const media = renderProjectMedia(project);
            return `
            <button type="button" class="project-card ${projectBentoClasses[project.id] || 'bento-tall'} ${media ? 'has-media' : 'no-media'}" data-project="${project.id}" style="--i:${index}">
              ${media}
              <span class="project-copy">
                ${media ? '' : `<span class="achievement-stack achievement-stack-inline">${renderAchievementBadges(project)}</span>`}
                <h2>${project.title}</h2>
                <p>${project.summary}</p>
              </span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </section>`,

  workspace: () => `
    <section class="page workspace-page" aria-labelledby="workspace-title">
      <header class="page-heading workspace-heading">
        <h1 id="workspace-title">Workspace</h1>
      </header>
      <div class="workspace-layout">
        <div class="workspace-grid">
          ${workspaceItems.map((item, index) => `
            <a class="workspace-card" href="${item.href}" target="_blank" rel="noopener" style="--i:${index}">
              <span class="workspace-title">${item.title}</span>
            </a>`).join('')}
        </div>
      </div>
      <div id="spocket-root" aria-label="Spocket Workspace assistant"></div>
    </section>`,

  portal: () => `
    <section class="page portal-page" aria-labelledby="portal-title">
      <div class="portal-layout">
        <div class="portal-copy">
          <h1 id="portal-title">Client <em>Portal</em></h1>
          <p>A private space for the projects I'm helping clients build. Enter your access key to open your project plan.</p>
          <button class="text-action" type="button" data-go-page="contact">Need access? Contact me</button>
        </div>
        <div class="portal-seal" aria-hidden="true"><span>TM</span></div>
        <form class="access-card" id="portal-form" autocomplete="off">
          <label for="portal-key">Access key</label>
          <div class="key-field">
            <input id="portal-key" name="access-key" type="password" placeholder="your-client-key" autocomplete="current-password">
            <button type="button" class="reveal-key" aria-pressed="false">Show</button>
          </div>
          <label class="remember-row"><input type="checkbox" checked> Remember me on this device</label>
          <button type="submit" class="primary-action">Enter portal</button>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>`,

  contact: () => `
    <section class="page contact-page" aria-labelledby="contact-title">
      <div class="contact-layout">
        <header class="contact-heading">
          <h1 id="contact-title">Get in touch</h1>
          <p>Open to <strong>internships</strong>, <strong>CO-OP positions</strong>, and interesting engineering collaborations.</p>
          <div class="availability"><span aria-hidden="true"></span>Available · 2026</div>
        </header>
        <div class="contact-methods">
          <button type="button" class="contact-card" data-copy-email>
            <span><small>Email</small><strong>taliamekhayche@gmail.com</strong></span>
            <span class="contact-action">Copy</span>
          </button>
          <a class="contact-card" href="https://www.linkedin.com/in/taliamekhayche/" target="_blank" rel="noopener">
            <span><small>LinkedIn</small><strong>Talia Mekhayche</strong></span>
            <span class="contact-action">Connect</span>
          </a>
        </div>
      </div>
    </section>`
};

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const match = raw.match(/^option-[1-5]\/(home|projects|workspace|portal|contact)$/);
  if (match) return { option: '1', page: match[1] };
  if (views[raw]) return { option: '1', page: raw };
  return { option: '1', page: 'home' };
}

function route(option, page, focus = false) {
  const nextOption = '1';
  const nextPage = views[page] ? page : 'home';
  const nextHash = `#option-${nextOption}/${nextPage}`;
  if (location.hash === nextHash) render(nextOption, nextPage, focus);
  else location.hash = nextHash;
}

function render(option, page, focus = false) {
  if (modal.classList.contains('workspace-lock-modal')) closeWorkspaceLock();
  unmountWorkspaceSpocket();
  currentOption = option;
  currentPage = page;
  body.dataset.option = option;
  body.dataset.page = page;
  body.classList.remove('sr-auth-unlocked');
  body.dataset.projectStyle = page === 'projects' ? 'bento' : scrapbookSelection;
  body.dataset.scrapbookMixed = 'false';
  pageContent.innerHTML = views[page]();

  navLinks.forEach(link => {
    const active = link.dataset.pageLink === page;
    link.classList.toggle('active', active);
    link.href = `#option-${option}/${link.dataset.pageLink}`;
    if (link.closest('.nav-links')) {
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  });

  bindPageInteractions(page);
  mainMenu.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (focus) pageContent.focus({ preventScroll: true });
}

function unmountWorkspaceSpocket() {
  spocketMountGeneration += 1;
  if (!spocketReactRoot) return;
  try { spocketReactRoot.unmount(); } catch (_) { /* The route may already have removed its mount node. */ }
  spocketReactRoot = null;
}

function mountWorkspaceSpocket() {
  const generation = ++spocketMountGeneration;
  let attempts = 0;

  function mountWhenReady() {
    if (generation !== spocketMountGeneration || currentPage !== 'workspace') return;
    const mount = document.getElementById('spocket-root');
    if (!mount) return;

    if (window.SpocketApp && window.React && window.ReactDOM && typeof window.ReactDOM.createRoot === 'function') {
      spocketReactRoot = window.ReactDOM.createRoot(mount);
      spocketReactRoot.render(window.React.createElement(window.SpocketApp));
      mount.dataset.spocketMounted = 'true';
      mount.dataset.spocketStatus = 'ready';
      return;
    }

    attempts += 1;
    if (attempts < 200) {
      window.setTimeout(mountWhenReady, 50);
    } else {
      mount.dataset.spocketStatus = 'error';
      console.error('[Spocket redesign] The shared assistant component did not become ready.');
    }
  }

  mountWhenReady();
}

let projectLayoutFrame = 0;

function queueProjectLayout() {
  window.cancelAnimationFrame(projectLayoutFrame);
  projectLayoutFrame = window.requestAnimationFrame(layoutProjectGrid);
}

function applyScrapbookComposition() {
  const composition = scrapbookCompositions[scrapbookSelection];
  pageContent.querySelectorAll('.project-card').forEach(card => {
    const settings = composition?.[card.dataset.project];
    if (!settings) {
      delete card.dataset.scrapForm;
      card.style.removeProperty('--scrap-span');
      card.style.removeProperty('--scrap-ratio');
      card.style.removeProperty('--scrap-rotate');
      return;
    }

    card.dataset.scrapForm = settings[0];
    card.style.setProperty('--scrap-span', settings[1]);
    card.style.setProperty('--scrap-ratio', settings[2]);
    card.style.setProperty('--scrap-rotate', settings[3]);
  });
}

function layoutProjectGrid() {
  const grid = pageContent.querySelector('.project-grid');
  if (!grid || grid.classList.contains('bento-grid')) return;

  const gridStyle = window.getComputedStyle(grid);
  const rowHeight = parseFloat(gridStyle.gridAutoRows) || 8;
  const rowGap = parseFloat(gridStyle.rowGap) || 16;

  grid.querySelectorAll('.project-card').forEach(card => {
    card.style.gridRowEnd = 'auto';
    const cardHeight = card.getBoundingClientRect().height;
    card.style.gridRowEnd = `span ${Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap))}`;
  });
}

function openModal(kicker, title, copy, actions = '') {
  lastFocused = document.activeElement;
  modal.classList.remove('workspace-lock-modal', 'project-detail-modal', 'project-detail-no-photos', 'project-detail-has-actions');
  modalKicker.textContent = kicker;
  modalTitle.textContent = title;
  modalCopy.textContent = copy;
  modalActions.innerHTML = actions || '<button type="button" class="primary-action" data-close-modal>Close</button>';
  modal.hidden = false;
  body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function rootAssetPath(path) {
  if (!path || /^(?:https?:|data:|\/)/.test(path)) return path;
  return `/${path.replace(/^\.\//, '')}`;
}

function renderProjectDetails(project) {
  const achievements = renderAchievementBadges(project);
  const paragraphs = (project.description || project.detail || '')
    .split('\n\n')
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('');
  const descriptionBullets = (project.descriptionBullets || []).length
    ? `<ul class="project-detail-list">${project.descriptionBullets.map(item => `<li>${item}</li>`).join('')}</ul>`
    : '';
  const sections = (project.sections || []).length
    ? `<div class="project-detail-sections">${project.sections.map(section => `
        <section class="project-detail-section">
          <h3>${section.label}</h3>
          <ul class="project-detail-list">${section.bullets.map(item => `<li>${item}</li>`).join('')}</ul>
        </section>`).join('')}</div>`
    : '';
  const photos = (project.photos || []).length
    ? `<div class="project-detail-photos">${project.photos.map(photo => `
        <figure>
          <button class="project-detail-photo-trigger" type="button" aria-label="Open larger image: ${photo.alt}">
            <img src="${rootAssetPath(photo.src)}" alt="${photo.alt}">
          </button>
          <figcaption>${photo.alt}</figcaption>
        </figure>`).join('')}</div>`
    : '';
  const tools = (project.tags || []).length
    ? `<section class="project-detail-tools" aria-labelledby="project-tools-title">
        <h3 id="project-tools-title">Tools used</h3>
        <div class="project-detail-tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      </section>`
    : '';

  return `<div class="project-detail-body">
    ${tools}
    ${achievements ? `<div class="project-detail-achievements">${achievements}</div>` : ''}
    <section class="project-detail-overview" aria-label="Project overview">${paragraphs}${descriptionBullets}</section>
    ${sections}
    ${photos}
  </div>`;
}

function openImageLightbox(trigger) {
  const image = trigger.querySelector('img');
  if (!image) return;
  lastImageFocused = trigger;
  imageLightboxImage.src = image.currentSrc || image.src;
  imageLightboxImage.alt = image.alt;
  imageLightboxCaption.textContent = image.alt;
  imageLightbox.hidden = false;
  imageLightbox.querySelector('.image-lightbox-close').focus();
}

function closeImageLightbox(restoreFocus = true) {
  if (imageLightbox.hidden) return;
  imageLightbox.hidden = true;
  imageLightboxImage.src = '';
  imageLightboxImage.alt = '';
  imageLightboxCaption.textContent = '';
  if (restoreFocus && lastImageFocused && document.contains(lastImageFocused)) lastImageFocused.focus();
  lastImageFocused = null;
}

function projectLinkLabel(link) {
  if (/github\.com/i.test(link.url)) return 'View project code on GitHub';
  if (/devpost\.com/i.test(link.url)) return 'View project on Devpost';
  return link.label;
}

function openProjectModal(project) {
  lastFocused = document.activeElement;
  modal.classList.remove('workspace-lock-modal');
  modal.classList.add('project-detail-modal');
  modalKicker.textContent = '';
  modalTitle.textContent = project.title;
  modalCopy.innerHTML = renderProjectDetails(project);

  const links = [...(project.links || []), ...(projectDestinations[project.id] || [])];
  modal.classList.toggle('project-detail-no-photos', !(project.photos || []).length);
  modal.classList.toggle('project-detail-has-actions', links.length > 0);
  modalActions.innerHTML = links.length
    ? `<div class="project-detail-actions-label">Project links</div>${links.map(link => `<a class="project-detail-link" href="${link.url}" target="_blank" rel="noopener">${projectLinkLabel(link)}</a>`).join('')}`
    : '';
  modal.hidden = false;
  body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  if (modal.hidden) return;
  if (modal.classList.contains('workspace-lock-modal')) return;
  closeImageLightbox(false);
  modal.hidden = true;
  modal.classList.remove('workspace-lock-modal', 'project-detail-modal', 'project-detail-no-photos', 'project-detail-has-actions');
  body.classList.remove('modal-open');
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
}

function closeWorkspaceLock() {
  if (!modal.classList.contains('workspace-lock-modal')) return;
  modal.hidden = true;
  modal.classList.remove('workspace-lock-modal');
  body.classList.remove('modal-open');
  pageContent.inert = false;
  pageContent.removeAttribute('aria-hidden');
}

function workspaceNextTarget() {
  const target = new URLSearchParams(window.location.search).get('next') || '';
  return /^(?:\/school-notes|\/expenses|\/workspace\/(?:project-in-progress|road-to-ca))(?:[/?#][\w\-./?=&%#]*)?$/.test(target)
    ? target
    : '';
}

function openWorkspaceLock(message = '') {
  lastFocused = document.activeElement;
  modal.className = 'modal workspace-lock-modal';
  modalKicker.textContent = '';
  modalTitle.textContent = 'Workspace access';
  modalCopy.textContent = '';
  modalActions.innerHTML = `
    <form class="workspace-auth-form" id="workspace-auth-form">
      <label class="modal-field" for="workspace-password">Password</label>
      <input id="workspace-password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit" class="primary-action">Unlock</button>
      <p class="form-status" role="status" aria-live="polite">${message}</p>
    </form>`;
  modal.hidden = false;
  body.classList.add('modal-open');
  pageContent.inert = true;
  pageContent.setAttribute('aria-hidden', 'true');
  modal.querySelector('#workspace-password').focus();

  modal.querySelector('#workspace-auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const data = new URLSearchParams(new FormData(form));
    const nextTarget = workspaceNextTarget();
    if (nextTarget) data.set('redirect', nextTarget);
    submit.disabled = true;
    status.textContent = 'Checking password…';
    try {
      const response = await fetch('/workspace/auth', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
        credentials: 'same-origin'
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to unlock Workspace.');
      body.classList.add('sr-auth-unlocked');
      closeWorkspaceLock();
      if (nextTarget) window.location.assign(nextTarget);
    } catch (error) {
      submit.disabled = false;
      status.textContent = error.message || 'Unable to unlock Workspace.';
      form.querySelector('#workspace-password').select();
    }
  });
}

async function initializeWorkspaceAccess() {
  if (isStaticPreview) {
    body.classList.add('sr-auth-unlocked');
    return;
  }

  try {
    const response = await fetch('/workspace/session', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const session = await response.json();
    if (currentPage !== 'workspace') return;
    if (session.ok) {
      body.classList.add('sr-auth-unlocked');
      const nextTarget = workspaceNextTarget();
      if (nextTarget) window.location.assign(nextTarget);
      return;
    }
    openWorkspaceLock(session.configured === false ? 'Workspace access is not configured yet.' : '');
  } catch (_) {
    if (currentPage !== 'workspace') return;
    openWorkspaceLock('Workspace access could not be checked. Please try again.');
  }
}

async function sha256hex(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function readRememberedPortal() {
  try { return window.localStorage.getItem(PORTAL_REMEMBER_STORE); } catch (_) { return null; }
}

function clearRememberedPortal() {
  try { window.localStorage.removeItem(PORTAL_REMEMBER_STORE); } catch (_) { /* Storage is optional. */ }
}

function bindPageInteractions(page) {
  pageContent.querySelectorAll('[data-go-page]').forEach(button => {
    button.addEventListener('click', () => route(currentOption, button.dataset.goPage, true));
  });

  if (page === 'projects') {
    pageContent.querySelectorAll('[data-scrapbook-style]').forEach(button => {
      button.addEventListener('click', () => {
        scrapbookSelection = button.dataset.scrapbookStyle;
        body.dataset.projectStyle = scrapbookSelection;
        body.dataset.scrapbookMixed = String(scrapbookSelection !== '6');
        applyScrapbookComposition();
        pageContent.querySelectorAll('[data-scrapbook-style]').forEach(option => {
          option.setAttribute('aria-pressed', String(option.dataset.scrapbookStyle === scrapbookSelection));
        });
        try { window.localStorage.setItem('doll-whimsy-scrapbook-v1', scrapbookSelection); } catch (_) { /* Optional. */ }
        queueProjectLayout();
        window.setTimeout(queueProjectLayout, 520);
      });
    });

    pageContent.querySelectorAll('[data-project]').forEach(card => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        card.addEventListener('mousemove', event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          const rotateY = (x - 0.5) * 3.5;
          const rotateX = (0.5 - y) * 3.5;
          card.classList.add('tilting');
          card.style.transform = `perspective(1800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
          card.classList.remove('tilting');
          card.style.transform = '';
        });
      }
      card.addEventListener('click', () => {
        const project = projects.find(item => item.id === card.dataset.project);
        openProjectModal(project);
      });
    });
  }

  if (page === 'workspace') {
    initializeWorkspaceAccess();
    mountWorkspaceSpocket();
  }

  if (page === 'portal') {
    const form = pageContent.querySelector('#portal-form');
    const key = pageContent.querySelector('#portal-key');
    const reveal = pageContent.querySelector('.reveal-key');
    const status = pageContent.querySelector('.form-status');
    const remember = form.querySelector('.remember-row input');
    const submit = form.querySelector('button[type="submit"]');
    const rememberedHash = readRememberedPortal();
    if (rememberedHash && PORTALS[rememberedHash]) {
      submit.textContent = 'Continue to saved portal';
      status.textContent = 'This browser remembers an active client portal.';
    } else if (rememberedHash) {
      clearRememberedPortal();
    }
    reveal.addEventListener('click', () => {
      const showing = key.type === 'text';
      key.type = showing ? 'password' : 'text';
      reveal.textContent = showing ? 'Show' : 'Hide';
      reveal.setAttribute('aria-pressed', String(!showing));
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const enteredKey = key.value.trim().toLowerCase();
      const saved = readRememberedPortal();
      if (!enteredKey && saved && PORTALS[saved]) {
        window.location.assign(PORTALS[saved]);
        return;
      }
      if (!enteredKey) {
        status.textContent = 'Enter an access key to continue.';
        key.focus();
        return;
      }
      if (!(window.crypto && window.crypto.subtle)) {
        status.textContent = 'Secure key checking requires HTTPS.';
        return;
      }
      submit.disabled = true;
      status.textContent = 'Checking key…';
      try {
        const hash = await sha256hex(enteredKey);
        const destination = PORTALS[hash];
        if (!destination) throw new Error("That key didn't match an active portal.");
        if (remember.checked) {
          try { window.localStorage.setItem(PORTAL_REMEMBER_STORE, hash); } catch (_) { /* Storage is optional. */ }
        } else {
          clearRememberedPortal();
        }
        status.textContent = 'Access granted — opening your portal…';
        window.setTimeout(() => window.location.assign(destination), 450);
      } catch (error) {
        submit.disabled = false;
        status.textContent = error.message || 'Could not verify the key.';
        key.select();
      }
    });
  }

  if (page === 'contact') {
    const copyButton = pageContent.querySelector('[data-copy-email]');
    const label = copyButton.querySelector('.contact-action');
    copyButton.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText('taliamekhayche@gmail.com'); } catch (_) { /* Local preview fallback. */ }
      label.textContent = 'Copied';
      window.setTimeout(() => { if (document.contains(label)) label.textContent = 'Copy'; }, 1600);
    });
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    route(currentOption, link.dataset.pageLink, true);
  });
});

menuToggle.addEventListener('click', () => {
  const opening = !mainMenu.classList.contains('open');
  mainMenu.classList.toggle('open', opening);
  menuToggle.setAttribute('aria-expanded', String(opening));
});

typeStudioToggle?.addEventListener('click', () => setTypeStudioOpen(typeStudio.hidden));
typeStudioClose?.addEventListener('click', () => {
  setTypeStudioOpen(false);
  typeStudioToggle?.focus();
});
typeStudioOptions?.addEventListener('click', event => {
  const backgroundButton = event.target.closest('[data-background-value]');
  if (backgroundButton) {
    backgroundSelection = backgroundButton.dataset.backgroundValue;
    applyTypeSelection();
    try { window.localStorage.setItem('doll-whimsy-background-v2', backgroundSelection); } catch (_) { /* Optional. */ }
    return;
  }

  const accentButton = event.target.closest('[data-accent-value]');
  if (accentButton) {
    accentSelection = accentButton.dataset.accentValue;
    applyTypeSelection();
    try { window.localStorage.setItem('doll-whimsy-accent-v3', accentSelection); } catch (_) { /* Optional. */ }
    return;
  }

  const button = event.target.closest('[data-type-group]');
  if (!button) return;
  typeSelection[button.dataset.typeGroup] = button.dataset.typeValue;
  applyTypeSelection();
  try { window.localStorage.setItem('doll-whimsy-type-selection-v4', JSON.stringify(typeSelection)); } catch (_) { /* Optional. */ }
});

modal.addEventListener('click', event => {
  const photoTrigger = event.target.closest('.project-detail-photo-trigger');
  if (photoTrigger) {
    openImageLightbox(photoTrigger);
    return;
  }
  if (event.target.closest('[data-close-modal]') && !modal.classList.contains('workspace-lock-modal')) closeModal();
});
imageLightbox.addEventListener('click', event => {
  if (event.target.closest('[data-close-image-lightbox]')) closeImageLightbox();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!imageLightbox.hidden) {
    closeImageLightbox();
    return;
  }
  if (modal.classList.contains('workspace-lock-modal')) return;
  closeModal();
  if (typeStudio && !typeStudio.hidden) setTypeStudioOpen(false);
});
window.addEventListener('resize', queueProjectLayout);
window.addEventListener('hashchange', () => {
  const next = parseHash();
  render(next.option, next.page, true);
});

function startPrototype() {
  applyBundledProjectDetails();
  const initial = parseHash();
  render(initial.option, initial.page);
  if (window.innerWidth > 640) setTypeStudioOpen(true);
  if (!location.hash) history.replaceState(null, '', '#option-1/home');
}

startPrototype();
