/**
 * Génération des images-récompenses originales par univers via l'API Gemini
 * (gemini-3-pro-image, alias « Nano Banana Pro / 2 »).
 *
 * Usage :
 *   node scripts/generate-universe-images.mjs all
 *   node scripts/generate-universe-images.mjs kawaii chiens
 *
 * - Clé API : lue dans le coffre local C:/secrets/keys.env (prioritaire),
 *   sinon variable d'environnement GEMINI_API_KEY.
 * - Sortie : images_rewards/<Dossier>/NN-sujet.webp (1024×1024, q82).
 * - Reprise : une image déjà présente sur disque n'est pas régénérée —
 *   supprimer un fichier raté puis relancer suffit.
 * - Ensuite : `npm run sync-assets` pour brancher les pools dans l'app.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// --- Clé API ---------------------------------------------------------------
function loadApiKey() {
  // Le coffre local prime : une variable d'environnement GEMINI_API_KEY périmée
  // peut traîner dans le shell et masquer la clé valide (constaté le 02/07/2026).
  const envPath = 'C:/secrets/keys.env'  // coffre local hors OneDrive (cf. ref-secrets.md)
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^GEMINI_API_KEY=(.+)$/m)
    if (m) {
      const vaultKey = m[1].trim()
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== vaultKey) {
        console.warn('[clé API] variable d\'environnement GEMINI_API_KEY ignorée — le coffre C:/secrets/keys.env prime')
      }
      return vaultKey
    }
  }
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  console.error('GEMINI_API_KEY introuvable (C:/secrets/keys.env ou env)')
  process.exit(1)
}
const API_KEY = loadApiKey()
const MODEL = 'gemini-3-pro-image'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

// --- Contraintes communes (anti-slop, enfants 5-10) -------------------------
const COMMON_SUFFIX =
  'Square 1:1 composition, subject perfectly centered with comfortable margins. ' +
  'Joyful, wholesome, perfectly child-friendly for ages 5 to 10. ' +
  'Masterful professional quality, rich detail, flawless anatomy and hands, no deformities. ' +
  'Absolutely no text, no letters, no numbers, no logo, no watermark, no signature, no frame, no border.'

// --- Univers ---------------------------------------------------------------
const UNIVERSES = {
  kpop: {
    folder: 'KPop',
    style:
      'Premium 3D animated movie still in the style of a top-tier CGI animation feature film: ' +
      'a completely original stylized K-pop idol character (NOT a real person), expressive big eyes, ' +
      'flawless stylized hair, glittering stage outfit with original design. ' +
      'Spectacular concert stage with neon volumetric lighting in magenta, violet and electric blue, ' +
      'bokeh crowd of glowing lightsticks, sparkling confetti. Cinematic rim light, glossy materials, ' +
      'shallow depth of field, vibrant yet harmonious colors.',
    subjects: [
      'A girl idol with pastel pink twin-tails hitting a confident dance point pose, silver sparkling jacket',
      'A boy idol with electric blue hair mid-jump, holding a microphone, stage smoke around his sneakers',
      'A girl idol with violet braids singing into a vintage gold microphone, eyes closed with emotion',
      'A duo of girl and boy idols striking a back-to-back finale pose under falling confetti',
      'A girl idol with mint green bob playing a glossy white electric guitar, petals flying',
      'A boy idol with silver hair playing a neon-lit keytar, grinning at the crowd',
      'A girl idol drummer behind a translucent crystal drum kit, drumsticks crossed in the air',
      'A boy idol breakdancing in a freeze pose, cap backwards, neon floor lights',
      'A girl idol making finger-heart hands, wearing a holographic bomber jacket',
      'A trio of idols in matching outfits doing a synchronized wave move',
      'A girl idol DJ behind a glowing turntable booth, headphones with cat ears',
      'A boy idol catching a falling sparkling star prop, one knee on stage',
      'A girl idol with sunset orange ponytail twirling, dress spinning with light trails',
      'A boy idol rapper with a chrome microphone, confident wink, purple stage fog',
      'A girl idol singing on a rising platform above clouds of dry ice',
      'A boy idol with teal curls doing the moonwalk, spotlight circle on the floor',
      'A girl idol violinist with an electric violin glowing neon pink',
      'A boy and girl idol duet sharing one microphone stand, gentle smiles',
      'A girl idol in a school-uniform stage outfit jumping with a peace sign',
      'A boy idol leader pointing to the sky, cape-like long coat flowing',
      'A girl idol with galaxy-dyed hair blowing a kiss that becomes tiny hearts of light',
      'A boy idol drummer tossing a drumstick high, catching lights',
      'A girl idol dancing in rain of golden glitter, umbrella prop with fairy lights',
      'A boy idol with rose gold hair playing an acoustic guitar on a stool, soft spotlight',
      'A five-member idol group silhouette finale pose with fireworks of light behind',
      'A girl idol hitting a high note, light beams radiating from behind her',
      'A boy idol skateboarding across the stage with LED wheels, guitar on his back',
      'A girl idol with cherry red hair holding a glowing lightstick toward the camera',
      'A boy idol conducting the crowd like an orchestra, ocean of lightsticks below',
      'A girl idol backstage moment, sparkling jacket over shoulder, victory smile with confetti in her hair',
    ],
  },

  kawaii: {
    folder: 'Kawaii',
    style:
      'High-end Japanese kawaii sticker art: chubby rounded character with thick clean outlines, ' +
      'soft pastel palette (cream, blush pink, mint, baby blue, butter yellow), subtle gradients, ' +
      'glossy blush cheeks, tiny contented smile, soft drop shadow, plain soft pastel background, ' +
      'premium die-cut sticker quality.',
    subjects: [
      'A chubby capybara relaxing in a steaming onsen with a yuzu fruit balanced on its head, sakura petals floating',
      'A capybara sipping a giant boba milk tea with both paws, eyes closed in bliss',
      'A mama capybara with a tiny baby capybara stacked on her back, both smiling',
      'A capybara with a little yellow bird perched on its head, sharing a leaf',
      'A capybara lying flat like a loaf on a picnic blanket, strawberry on its tummy',
      'A sleepy capybara curled on a fluffy cloud, nightcap and tiny star mobile',
      'A capybara wearing a tiny straw hat, gardening a single sunflower',
      'A kitten sitting inside a teacup, paw raised, surrounded by macarons',
      'A shiba inu balancing a stack of fluffy pancakes with butter on its head',
      'A baby penguin hugging a swirl of soft-serve ice cream bigger than itself',
      'A pink axolotl in a bubble bath with a rubber duck on its head',
      'A hamster sushi chef with a tiny bandana, presenting a salmon nigiri',
      'A bunny in a crescent moon, nibbling a star-shaped mochi',
      'A red panda wrapped like a burrito in a strawberry-print blanket',
      'A baby seal with big sparkly eyes hugging a tiny snowball friend',
      'Two otters floating on water holding hands, hearts above them',
      'A duckling under a leaf umbrella in soft rain, puddle reflections',
      'A frog wearing a tiny mushroom hat, sitting on a lily pad with a flower',
      'A hedgehog carrying a daisy on its back like a parasol',
      'A polar bear cub holding a steaming mug of cocoa with marshmallows',
      'A corgi loaf with a tiny crown, lying on a velvet cushion',
      'A cat shaped like a dumpling sleeping in a bamboo steamer basket',
      'A baby whale spouting tiny stars instead of water',
      'An alpaca with rainbow yarn wrapped around its fluffy wool',
      'A little mouse waving from the window of a mushroom house',
      'A bumblebee with a honey pot, dripping golden heart-shaped drops',
      'A turtle with a sakura tree growing from its shell, petals drifting',
      'A baby owl in striped pajamas holding a tiny pillow, sleepy eyes',
      'A panda hugging a giant onigiri rice ball with seaweed belt',
      'A strawberry cow (pink with strawberry spots) drinking milk from a tiny bottle',
    ],
  },

  chiens: {
    folder: 'Chiens',
    style:
      'Award-winning professional pet photography, ultra photo-realistic: 85mm portrait lens look, ' +
      'shallow depth of field with creamy bokeh, crisp detail in fur texture and sparkling eyes, ' +
      'beautiful natural light, heartwarming adorable expression, true-to-life colors, realistic anatomy.',
    subjects: [
      'A golden retriever puppy sitting in autumn leaves, golden hour backlight',
      'A fluffy samoyed smiling widely in fresh snow, snowflakes on its fur',
      'A corgi running on a sandy beach at sunset, ears flying',
      'A dalmatian puppy with a red ball between its paws, studio softbox lighting',
      'A beagle puppy in a meadow of white daisies, nose dotted with pollen',
      'A siberian husky close-up portrait, striking blue eyes, soft winter light',
      'A labrador puppy peeking out of a wicker basket with a plaid blanket',
      'A border collie catching a frisbee mid-air, grass field, frozen motion',
      'A french bulldog with a tiny bow tie, sitting proudly, charcoal studio background',
      'An australian shepherd standing in a mountain wildflower field, wind in its coat',
      'A cavalier king charles spaniel lying on a picnic blanket beside a flower basket',
      'A pug wrapped snugly in a cream knitted blanket, only face showing',
      'A german shepherd puppy with one ear flopping, head tilted, curious eyes',
      'A jack russell terrier jumping over a rain puddle, droplets sparkling',
      'A bernese mountain dog sitting in soft falling snow, majestic and calm',
      'A shiba inu under a blooming cherry blossom tree, petals on its head',
      'A cocker spaniel shaking off water by a lake, droplets in a golden halo',
      'A great dane gently looking at a butterfly perched on its nose',
      'A long-haired chihuahua sitting beside a flower pot, window light',
      'A poodle puppy with a perfect fluffy haircut, pastel studio backdrop',
      'A dachshund in a mustard knit sweater walking through autumn leaves',
      'A saint bernard puppy sitting in an alpine meadow, mountains behind',
      'Three husky puppies sleeping in a pile, soft morning light',
      'A golden retriever proudly carrying a stick out of a lake, water trail',
      'An alaskan malamute howling at a pink sunset sky, silhouette rim light',
      'A papillon close-up with butterfly-shaped ears perfectly lit',
      'A boxer puppy chasing soap bubbles in a backyard, evening sun',
      'An old english sheepdog in a windy green field, fur flowing',
      'An akita inu sitting in red maple leaves, noble profile portrait',
      'A scruffy mixed-breed puppy wearing a tiny green adoption-day bandana, joyful grin',
    ],
  },

  'super-heros': {
    folder: 'Super-Heros',
    style:
      'Premium 3D animated feature film still from an original superhero universe for kids: ' +
      'a young hero with stylized proportions, expressive friendly face, sleek completely original ' +
      'supersuit (bold two-tone colors, original emblem-free chest design, flowing cape), dynamic pose, ' +
      'dramatic cinematic lighting, vibrant city skyline or sky scene, volumetric clouds, ' +
      'subtle lens flare, high-detail materials. Original designs not resembling any existing franchise.',
    subjects: [
      'A girl hero flying above a sunset city, trailing a ribbon of golden light',
      'A boy speedster mid-run with blue motion streaks, sneakers glowing',
      'A girl hero hovering cross-legged, levitating glowing books around her',
      'A boy hero gently lifting a school bus with one hand, kids cheering inside',
      'A girl hero rescuing a kitten from a tree, soft cape billowing',
      'A boy hero creating an ice slide between rooftops, arms spread',
      'A girl hero projecting a shimmering bubble shield around her friends',
      'A boy hero with wind power swirling autumn leaves into a friendly vortex',
      'A girl hero making giant sunflowers grow through cracked pavement',
      'A small hero riding a giant friendly bumblebee above a park',
      'A stretchy boy hero reaching across a street to return a lost balloon',
      'A girl hero half-invisible, shimmering outline, playful wink',
      'A boy gadget hero with a backpack jetpack, goggles up, hovering',
      'Three kid heroes standing on a rooftop at sunrise, capes synchronized',
      'A girl hero with her small round robot sidekick projecting a heart hologram',
      'A boy hero standing tall on a skyscraper antenna, cape rippling, moonlit',
      'A girl hero diving to catch a falling ice cream cone for a little kid',
      'A boy hero lifting a boulder over his head with a proud grin',
      'A girl hero on night patrol, eyes glowing softly like flashlights',
      'A snow hero boy building an ice ramp for sledding children',
      'A girl hero planting a tree that instantly blossoms above the street',
      'A boy hero with magnet power collecting scrap metal into a heart shape',
      'A girl hero surfing on a flying manta-ray drone above the bay',
      'A boy hero whistling, summoning a flock of pigeons forming an arrow',
      'A girl hero juggling water spheres with fish swimming inside',
      'A boy hero charging a glowing jump, cracks of light under his boots',
      'A girl hero painting a real rainbow bridge across two buildings',
      'A boy hero with echo power, sound waves visible as golden rings',
      'A duo of twin heroes bumping fists, energy ring expanding from the impact',
      'A girl hero landing in a classic three-point pose, dust and sparkles',
    ],
  },

  'animaux-imaginaires': {
    folder: 'Animaux-Imaginaires',
    style:
      'Premium collectible fantasy creature art: an ultra-cute imaginary animal, soft painterly 3D render ' +
      'with fluffy fur detail, big glossy adorable eyes, gentle magical glow, dreamy pastel habitat ' +
      'background with bokeh light particles, enchanting and huggable, masterful original character design.',
    subjects: [
      'A baby fox with translucent dragonfly wings resting on a giant mushroom',
      'A bunny-axolotl hybrid with pink frilly gills and long soft ears',
      'A cloud-sheep whose wool is a real cumulus, raining tiny sparkles',
      'An owl-cat with feathered ears and a striped tail, perched on a crescent moon lamp',
      'A turtle with a miniature crystal garden growing on its shell',
      'A fluffy baby griffin chasing its own tail feather',
      'A moth-puppy with velvet wings and a softly glowing lantern tail',
      'A fawn with small rainbow antlers that glow like aurora',
      'An otter-mermaid with a pearlescent tail holding a starfish',
      'A hedgehog whose quills are tiny golden stars, curled by a candle',
      'A flying baby whale with balloon-like fins among pink clouds',
      'A squirrel with maple-leaf wings gliding between lanterns',
      'A tiny frog wearing a living mushroom crown, sitting on moss',
      'A luminous jellyfish-kitten floating with tentacle ribbons',
      'A panda-bumblebee with fuzzy stripes, napping inside a flower',
      'A snow leopard cub whose spots ripple with northern lights',
      'A seahorse-pony with a curled tail, mane of seafoam',
      'A chameleon that blushes in rainbow waves when happy',
      'A badger-bear cub holding a jar of glowing honey fireflies',
      'A pocket-sized yeti gently holding one pink flower',
      'A peacock-fox whose tail is a fan of drifting fireflies',
      'A dragon hatchling sleeping in a porcelain teacup, steam halo',
      'A raccoon with a galaxy-pattern mask and starry paws',
      'A lamb with cloud wool drifting slightly above a moonlit meadow',
      'A platypus-fairy with dragonfly wings carrying a dewdrop',
      'A caterpillar like a tiny train with glowing lantern segments',
      'An arctic fox with translucent crystal ears catching light',
      'A koala-sloth hanging from a rainbow arc, slow happy smile',
      'A baby kraken with bows on each tentacle, hugging an anchor plushie',
      'A phoenix chick with warm ember down, hatching from a golden egg',
    ],
  },

  creatures: {
    folder: 'Creatures',
    style:
      'Official key art of an original monster-collecting anime game: completely original pocket creature ' +
      'design (must NOT resemble any existing franchise creature), clean cel shading, crisp lineart, ' +
      'appealing rounded forms, expressive eyes, elemental power effects, dynamic pose, ' +
      'simple radial energy background matching its element, professional trading-card art quality.',
    subjects: [
      'A small lion cub creature with a mane of slow-flowing magma, ember sparks',
      'A lynx creature with antenna whiskers crackling with friendly lightning',
      'A chameleon creature with a sprouting leaf tail and bud horns, forest energy',
      'A round owl creature with icicle feather tufts, frosty breath swirl',
      'A tortoise creature with a mossy mountain shell and tiny waterfall',
      'A falcon creature wearing rings of cloud around its wings, wind element',
      'A crystal beetle creature with a prism horn refracting light beams',
      'A shadow rabbit creature with star-speckled ears, night energy',
      'A coral seadragon pup creature with bubble fins, water element',
      'A bear cub creature with glowing mushroom caps growing on its back',
      'An electric flying-squirrel creature with spark-glider membranes',
      'A puppy creature with obsidian plates and warm lava paw prints',
      'A fennec creature with an hourglass-shaped sand tail, desert element',
      'A koi fish creature swimming through air with storm cloud fins',
      'A serpent creature made of ivy with a blooming flower head',
      'A penguin creature with aurora ribbons trailing from its flippers',
      'A mole creature with magnet claws, floating metal pebbles around it',
      'A manatee creature blowing perfect bubble rings, calm sea energy',
      'A moth creature with wings of glowing embers, leaving warm light dust',
      'A ram creature with cracked granite horns regrowing golden seams',
      'A gecko creature with neon stripe patterns that light up at dusk',
      'A ferret creature spiraling inside its own mini tornado, playful',
      'A baby mammoth creature with glacier-blue ice tusks, snow flurry',
      'A sunflower sprite creature with a smiling solar core face',
      'A young gorilla creature with drum-shaped fists making sound rings',
      'A heron creature standing on mist, fog swirling like a scarf',
      'A hedgehog creature with charcoal quills re-igniting into embers',
      'A dragonfly creature with stained-glass prism wings',
      'A wolf pup creature with a mane of rolling ocean waves',
      'A goat kid creature grazing on a floating island chunk, gravity element',
    ],
  },

  dinosaures: {
    folder: 'Dinosaures',
    style:
      'Award-winning wildlife photography, ultra photo-realistic: a living dinosaur photographed in its ' +
      'natural prehistoric habitat as if by a National Geographic photographer, telephoto lens look, ' +
      'crisp detail in skin scales and feather texture, beautiful dramatic natural light, true-to-life ' +
      'colors, realistic anatomy grounded in modern paleontology. Majestic and awe-inspiring yet ' +
      'perfectly friendly for children: peaceful behavior, no hunting, no gore, no blood, no open jaws ' +
      'lunging at the camera.',
    subjects: [
      'A majestic Tyrannosaurus rex standing on a misty ridge at golden sunrise, calm side profile portrait',
      'A Triceratops family grazing in a sunlit fern meadow, baby close to its mother',
      'A feathered Velociraptor tilting its head curiously, iridescent plumage detail',
      'A towering Brachiosaurus reaching into treetops, low angle against blue sky and clouds',
      'A Stegosaurus drinking at a calm river at dusk, back plates glowing in warm light',
      'An armored Ankylosaurus walking through a prehistoric forest clearing, dappled light',
      'A Parasaurolophus calling at sunset, dramatic rim light on its long crest',
      'A Spinosaurus wading through a shallow river, sail reflecting in the water',
      'A tiny dinosaur hatchling emerging from its egg in a fern nest, soft morning light',
      'A herd of Diplodocus crossing a vast plain under a pink evening sky',
      'A Pteranodon soaring above ocean cliffs, wings spread wide against the sun',
      'A baby Triceratops sniffing a prehistoric flower, close-up with a big gentle eye',
      'Two Pachycephalosaurus facing each other on a rocky hill in morning fog',
      'A colorful Dilophosaurus with striking double crests standing among giant ferns',
      'A flock of Gallimimus running across a dusty plain, backlit dust clouds',
      'A herd of gentle giant Argentinosaurus at a watering hole, sunset reflections',
      'A Carnotaurus portrait with textured brow horns, calm gaze, stormy sky behind',
      'A Therizinosaurus peacefully reaching for leaves with its long claws',
      'A Mosasaurus breaching the ocean surface, water spray frozen in sunlight',
      'A Plesiosaurus gliding underwater through sunbeams and silver fish',
      'A Quetzalcoatlus standing tall like a giraffe on an open plain, golden hour',
      'An Iguanodon standing in a blooming magnolia forest, soft spring light',
      'A tiny Compsognathus perched on a mossy log, macro wildlife shot',
      'A Corythosaurus with a colorful crest in a cypress swamp, mirror reflection',
      'A Maiasaura gently guarding its nest of eggs, tender parental scene',
      'An Oviraptor with striking plumage brooding its nest among sand dunes',
      'A Kentrosaurus among red rocks, tail spikes backlit by the low sun',
      'A young Allosaurus splashing through a puddle after rain, playful energy',
      'A Protoceratops peeking from behind a sand dune at sunrise, curious look',
      'A feather-coated Yutyrannus in light snowfall, majestic winter portrait',
    ],
  },

  papeterie: {
    folder: 'Papeterie',
    style:
      'Premium e-commerce product photography of completely original cute Italian-style stationery ' +
      '(original design, not from any existing brand): a single hero product perfectly lit on a soft ' +
      'pastel seamless studio background, gentle soft shadow, crisp macro detail, glossy smooth ' +
      'materials, rounded chubby character shapes with tiny happy faces, pastel palette (blush pink, ' +
      'mint, lilac, butter yellow, sky blue, cream), irresistibly cute and giftable, catalog-quality ' +
      'lighting.',
    subjects: [
      'A mint green gel pen topped with a chubby smiling panda head, resting on a pastel notebook',
      'A lilac gel pen topped with a sleepy koala head, tiny hearts pattern on the barrel',
      'A baby pink gel pen topped with a happy unicorn head with a little golden horn',
      'A sky blue gel pen topped with a round penguin head, standing in a glass pen pot',
      'A butter yellow gel pen topped with a smiling avocado character',
      'A peach gel pen topped with a friendly smiling shark head, wave pattern on the barrel',
      'A pastel rainbow pen shaped like a unicorn with a flowing mane cap',
      'A coral gel pen topped with a blushing llama head with tiny pompoms',
      'A white gel pen topped with a chubby cat head, paw prints on the barrel',
      'A lavender gel pen topped with a baby dinosaur head with tiny soft spikes',
      'A cream gel pen topped with a round bee character with translucent wings',
      'A rose gel pen topped with an elegant flamingo head',
      'A seafoam gel pen topped with a turtle wearing a tiny party hat',
      'A honey yellow gel pen topped with a round hamster head holding a seed',
      'A powder blue gel pen topped with a narwhal head with a pearly spiral horn',
      'A blush pink gel pen topped with a ladybug character with heart-shaped spots',
      'A fluffy pencil case shaped like a smiling capybara with a pastel zipper',
      'A set of fruit-shaped erasers with tiny smiling faces — peach, watermelon slice and lemon — arranged on pastel paper',
      'A notebook with a plush unicorn cover and iridescent page edges, slightly fanned open',
      'A pastel pink mini stapler shaped like a smiling whale with a tiny bubbles pattern',
      'Paper clips shaped like tiny colorful cats scattered on a mint desk mat',
      'A roll of washi tape with a cute cloud and rainbow pattern, partially unrolled',
      'A pair of kid-safe scissors with a toucan-shaped handle in tropical pastel colors',
      'A set of highlighters shaped like pastel ice pops standing in a row',
      'A pencil sharpener shaped like a tiny mint and cream camper van',
      'A sticky note dispenser shaped like a sleeping fox curled around its notes',
      'A glue stick with a smiling octopus cap and a lavender body',
      'A folding ruler with a caterpillar design, each segment a different pastel color',
      'A backpack charm of a fluffy pompom bunny holding a tiny pencil',
      'A desk organizer shaped like a pastel castle filled with colorful animal-topped pens',
    ],
  },
}

// --- Génération --------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms))

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 4)
    .join('-')
}

async function generateImage(prompt, attempt = 1) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '1:1', imageSize: '1K' },
    },
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
      const wait = Math.min(60000, 2000 * 2 ** attempt)
      console.log(`  HTTP ${res.status}, retry ${attempt}/5 dans ${wait / 1000}s`)
      await sleep(wait)
      return generateImage(prompt, attempt + 1)
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
  if (!part) {
    if (attempt <= 3) {
      console.log(`  Pas d'image dans la réponse, retry ${attempt}/3`)
      await sleep(2000)
      return generateImage(prompt, attempt + 1)
    }
    throw new Error('Aucune image retournée: ' + JSON.stringify(json).slice(0, 300))
  }
  return Buffer.from(part.inlineData.data, 'base64')
}

async function processUniverse(key) {
  const u = UNIVERSES[key]
  const destDir = path.join(ROOT, 'images_rewards', u.folder)
  fs.mkdirSync(destDir, { recursive: true })

  const jobs = u.subjects.map((subject, i) => ({
    subject,
    filename: `${String(i + 1).padStart(2, '0')}-${slugify(subject)}.webp`,
  }))

  const pending = jobs.filter(j => !fs.existsSync(path.join(destDir, j.filename)))
  console.log(`\n=== ${key} (${u.folder}) : ${jobs.length} images, ${pending.length} à générer ===`)

  let done = 0
  let failed = 0
  const CONCURRENCY = 3
  const queue = [...pending]

  async function worker(id) {
    while (queue.length > 0) {
      const job = queue.shift()
      const outPath = path.join(destDir, job.filename)
      const prompt = `${u.style}\n\nSubject: ${job.subject}.\n\n${COMMON_SUFFIX}`
      try {
        const raw = await generateImage(prompt)
        await sharp(raw)
          .resize(1024, 1024, { fit: 'cover' })
          .webp({ quality: 82 })
          .toFile(outPath)
        done++
        console.log(`  [w${id}] ✓ ${job.filename} (${done}/${pending.length})`)
      } catch (err) {
        failed++
        console.error(`  [w${id}] ✗ ${job.filename}: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)))
  console.log(`=== ${key} terminé : ${done} générées, ${failed} échecs ===`)
  return { key, done, failed }
}

// --- Main --------------------------------------------------------------------
const args = process.argv.slice(2)
const keys = args.includes('all') || args.length === 0 ? Object.keys(UNIVERSES) : args
for (const k of keys) {
  if (!UNIVERSES[k]) {
    console.error(`Univers inconnu: ${k}. Disponibles: ${Object.keys(UNIVERSES).join(', ')}, all`)
    process.exit(1)
  }
}

console.log(`Modèle: ${MODEL} — univers: ${keys.join(', ')}`)
const results = []
for (const k of keys) {
  results.push(await processUniverse(k))
}
console.log('\n--- Bilan ---')
for (const r of results) console.log(`${r.key}: ${r.done} ok, ${r.failed} échecs`)
