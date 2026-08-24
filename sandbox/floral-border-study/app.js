const showcase = document.querySelector('#showcase');
const ornamentLayer = document.querySelector('#ornament-layer');
const optionLabel = document.querySelector('#option-label');
const replayButton = document.querySelector('#replay-bloom');
const optionButtons = [...document.querySelectorAll('[data-option]')];

const optionNames = {
  1: 'Corner bloom',
  2: 'Top trail',
  3: 'Side climb',
  4: 'Split garden',
  5: 'Drifting lilies'
};

const ornaments = {
  1: `
    <svg class="ornament option-1-a" viewBox="0 0 620 310" preserveAspectRatio="xMinYMin meet">
      <path class="stem" pathLength="1" style="--delay:.05s" d="M-15 52 C96 30 147 43 225 85 C307 129 386 111 473 58 C518 31 563 23 632 30"/>
      <path class="tendril" pathLength="1" style="--delay:.28s" d="M174 65 C142 24 103 27 112 60 C118 82 151 75 153 50"/>
      <path class="stem" pathLength="1" style="--delay:.2s" d="M226 84 C199 129 172 171 116 218 C84 245 67 273 67 321"/>
      <path class="connector" pathLength="1" style="--delay:.35s" d="M155 187 C183 183 203 194 219 215"/>
      <path class="connector" pathLength="1" style="--delay:.42s" d="M101 233 C131 233 149 249 158 272"/>
      <g class="bloom" style="--delay:.58s" transform="translate(180 72) rotate(-18)"><use href="#lily-side" width="150" height="150"/></g>
      <g class="bud" style="--delay:.78s" transform="translate(190 172) rotate(45)"><use href="#lily-bud" width="72" height="90"/></g>
      <g class="leaf-cluster" style="--delay:.72s" transform="translate(78 201) rotate(-15)"><use href="#leaf-pair" width="105" height="82"/></g>
    </svg>
    <svg class="ornament option-1-b" viewBox="0 0 340 250" preserveAspectRatio="xMaxYMax meet">
      <path class="stem" pathLength="1" style="--delay:.08s" d="M352 224 C282 220 245 197 219 156 C194 116 160 91 94 78 C54 70 24 47 -8 13"/>
      <path class="tendril" pathLength="1" style="--delay:.36s" d="M245 194 C273 163 305 171 298 198 C293 218 268 215 265 195"/>
      <g class="bloom" style="--delay:.62s" transform="translate(112 52) rotate(18)"><use href="#lily-open" width="128" height="128"/></g>
    </svg>`,
  2: `
    <svg class="ornament option-2-a" viewBox="0 0 720 290" preserveAspectRatio="xMaxYMin meet">
      <path class="stem" pathLength="1" style="--delay:.03s" d="M735 44 C638 22 579 35 518 82 C456 130 394 135 319 95 C247 57 178 39 89 68 C50 81 17 80 -18 66"/>
      <path class="tendril" pathLength="1" style="--delay:.18s" d="M586 51 C600 17 634 11 644 34 C653 57 625 69 612 49"/>
      <path class="connector" pathLength="1" style="--delay:.28s" d="M438 122 C462 151 483 174 519 190"/>
      <path class="connector" pathLength="1" style="--delay:.36s" d="M303 87 C278 122 250 142 210 152"/>
      <g class="bloom" style="--delay:.5s" transform="translate(391 87) rotate(24)"><use href="#lily-open" width="150" height="150"/></g>
      <g class="bud" style="--delay:.67s" transform="translate(180 116) rotate(-58)"><use href="#lily-bud" width="76" height="96"/></g>
      <g class="leaf-cluster" style="--delay:.74s" transform="translate(520 145) rotate(16)"><use href="#leaf-pair" width="104" height="82"/></g>
    </svg>
    <svg class="ornament option-2-b" viewBox="0 0 280 240" preserveAspectRatio="xMinYMax meet">
      <path class="stem" pathLength="1" style="--delay:.05s" d="M-6 232 C49 218 91 187 111 145 C130 105 159 76 216 58 C245 49 267 31 286 8"/>
      <g class="bud" style="--delay:.54s" transform="translate(84 93) rotate(-30)"><use href="#lily-bud" width="76" height="96"/></g>
      <g class="leaf-cluster" style="--delay:.68s" transform="translate(145 38) rotate(-12)"><use href="#leaf-pair" width="98" height="78"/></g>
    </svg>`,
  3: `
    <svg class="ornament option-3-a" viewBox="0 0 310 680" preserveAspectRatio="xMinYMid meet">
      <path class="stem" pathLength="1" style="--delay:.02s" d="M34 705 C63 631 61 559 39 489 C13 405 47 343 102 287 C157 231 178 171 148 104 C134 72 134 38 158 -18"/>
      <path class="tendril" pathLength="1" style="--delay:.22s" d="M58 491 C101 473 116 438 91 426 C69 416 52 439 72 455"/>
      <path class="connector" pathLength="1" style="--delay:.31s" d="M96 296 C142 304 179 322 213 357"/>
      <path class="connector" pathLength="1" style="--delay:.38s" d="M146 114 C109 139 87 161 77 197"/>
      <g class="bloom" style="--delay:.52s" transform="translate(121 303) rotate(28)"><use href="#lily-open" width="155" height="155"/></g>
      <g class="bloom" style="--delay:.72s" transform="translate(37 121) rotate(-45)"><use href="#lily-side" width="130" height="130"/></g>
      <g class="leaf-cluster" style="--delay:.82s" transform="translate(39 513) rotate(72)"><use href="#leaf-pair" width="100" height="80"/></g>
    </svg>
    <svg class="ornament option-3-b" viewBox="0 0 390 270" preserveAspectRatio="xMaxYMin meet">
      <path class="stem" pathLength="1" style="--delay:.04s" d="M402 34 C330 28 293 44 257 83 C218 125 168 135 111 109 C70 91 31 91 -12 111"/>
      <path class="tendril" pathLength="1" style="--delay:.27s" d="M301 61 C327 25 360 34 356 61 C353 82 329 81 324 62"/>
      <g class="bud" style="--delay:.56s" transform="translate(202 72) rotate(55)"><use href="#lily-bud" width="76" height="96"/></g>
      <g class="leaf-cluster" style="--delay:.69s" transform="translate(82 76) rotate(8)"><use href="#leaf-pair" width="100" height="80"/></g>
    </svg>`,
  4: `
    <svg class="ornament option-4-a" viewBox="0 0 540 300" preserveAspectRatio="xMinYMin meet">
      <path class="stem" pathLength="1" style="--delay:.04s" d="M-12 39 C76 28 137 48 186 91 C237 136 298 143 365 107 C417 79 471 62 551 78"/>
      <path class="connector" pathLength="1" style="--delay:.27s" d="M182 88 C170 139 146 177 105 208"/>
      <path class="tendril" pathLength="1" style="--delay:.34s" d="M335 120 C361 152 392 151 397 126 C401 108 380 99 367 116"/>
      <g class="bloom" style="--delay:.52s" transform="translate(61 149) rotate(-29)"><use href="#lily-side" width="145" height="145"/></g>
      <g class="leaf-cluster" style="--delay:.67s" transform="translate(377 54) rotate(10)"><use href="#leaf-pair" width="108" height="85"/></g>
    </svg>
    <svg class="ornament option-4-b" viewBox="0 0 610 300" preserveAspectRatio="xMaxYMax meet">
      <path class="stem" pathLength="1" style="--delay:.03s" d="M622 251 C548 262 494 243 448 207 C390 161 330 151 263 181 C188 216 111 221 -12 185"/>
      <path class="connector" pathLength="1" style="--delay:.25s" d="M448 207 C478 169 498 138 500 101"/>
      <path class="connector" pathLength="1" style="--delay:.34s" d="M262 181 C237 144 207 124 168 116"/>
      <g class="bloom" style="--delay:.55s" transform="translate(425 51) rotate(12)"><use href="#lily-open" width="150" height="150"/></g>
      <g class="bud" style="--delay:.72s" transform="translate(130 72) rotate(-60)"><use href="#lily-bud" width="76" height="96"/></g>
      <g class="leaf-cluster" style="--delay:.79s" transform="translate(280 155) rotate(-14)"><use href="#leaf-pair" width="105" height="82"/></g>
    </svg>`,
  5: `
    <svg class="ornament option-5-a" viewBox="0 0 700 300" preserveAspectRatio="xMidYMin meet">
      <path class="stem" pathLength="1" style="--delay:.03s" d="M-15 104 C87 79 169 88 236 126 C302 163 363 156 424 112 C492 63 570 45 714 74"/>
      <path class="tendril" pathLength="1" style="--delay:.2s" d="M165 99 C135 60 96 66 103 94 C108 115 136 114 143 96"/>
      <path class="connector" pathLength="1" style="--delay:.31s" d="M425 112 C441 154 471 186 514 205"/>
      <path class="connector" pathLength="1" style="--delay:.39s" d="M300 151 C280 187 253 208 214 220"/>
      <g class="bloom" style="--delay:.52s" transform="translate(451 149) rotate(34)"><use href="#lily-open" width="150" height="150"/></g>
      <g class="bloom" style="--delay:.69s" transform="translate(155 178) rotate(-34)"><use href="#lily-side" width="128" height="128"/></g>
      <g class="leaf-cluster" style="--delay:.79s" transform="translate(535 42) rotate(2)"><use href="#leaf-pair" width="108" height="85"/></g>
    </svg>
    <svg class="ornament option-5-b" viewBox="0 0 350 520" preserveAspectRatio="xMaxYMid meet">
      <path class="stem" pathLength="1" style="--delay:.05s" d="M365 505 C304 449 283 389 292 318 C302 239 276 185 218 143 C170 108 143 65 148 -15"/>
      <path class="tendril" pathLength="1" style="--delay:.29s" d="M293 326 C255 306 230 323 240 346 C249 366 276 358 276 337"/>
      <path class="connector" pathLength="1" style="--delay:.36s" d="M221 145 C252 130 279 130 308 143"/>
      <g class="bud" style="--delay:.57s" transform="translate(270 98) rotate(62)"><use href="#lily-bud" width="76" height="96"/></g>
      <g class="leaf-cluster" style="--delay:.7s" transform="translate(225 347) rotate(58)"><use href="#leaf-pair" width="100" height="80"/></g>
    </svg>`
};

function replayBloom() {
  showcase.classList.remove('is-animating');
  void showcase.offsetWidth;
  showcase.classList.add('is-animating');
}

function setOption(option, updateHash = true) {
  const selected = ornaments[option] ? Number(option) : 1;
  showcase.dataset.option = String(selected);
  ornamentLayer.innerHTML = ornaments[selected];
  optionLabel.textContent = `Option 0${selected} · ${optionNames[selected]}`;
  optionButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.option) === selected)));
  if (updateHash) history.replaceState(null, '', `#option-${selected}`);
  replayBloom();
}

optionButtons.forEach(button => button.addEventListener('click', () => setOption(button.dataset.option)));
replayButton.addEventListener('click', replayBloom);

const initialOption = location.hash.match(/option-(\d)/)?.[1] || '1';
setOption(initialOption, false);
