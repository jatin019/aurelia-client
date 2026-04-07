/**
 * FIRESTORE SEED SCRIPT
 * ─────────────────────
 * Run once to pre-populate:
 *   • reviews             (homepage review cards)
 *   • productDescriptions (product detail page tabs)
 *
 * Usage:
 *   1. npm install firebase-admin  (only needed for this script)
 *   2. Download your Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *      Save as serviceAccountKey.json in your project root
 *   3. node seedFirestore.js
 *
 * After seeding, you can edit any document directly in the Firebase Console
 * and changes appear live on the site instantly — no code deploy needed.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── REVIEWS ────────────────────────────────────────────────────────────────
// Collection: reviews
// Each doc: { stars, text, name, location, order }
// 'order' controls display sequence (ascending)

const REVIEWS = [
  {
    id: 'review-1',
    stars: 5,
    text: '"The quality of the diamond ring is absolutely breathtaking. It surpassed all my expectations and the customer service was impeccable. Truly a memorable experience."',
    name: 'Sarah Jenkins',
    location: 'New York, NY',
    order: 1,
  },
  {
    id: 'review-2',
    stars: 5,
    text: '"I purchased a pearl necklace for my wedding day. It\'s delicate, elegant, and I received so many compliments. I will treasure it forever as a family heirloom."',
    name: 'Emily Chen',
    location: 'Los Angeles, CA',
    order: 2,
  },
  {
    id: 'review-3',
    stars: 5,
    text: '"Their stackable rings are my new everyday essential. The craftsmanship is flawless and they hold up beautifully even with daily wear. Highly recommend!"',
    name: 'Jessica Taylor',
    location: 'London, UK',
    order: 3,
  },
];

// ─── PRODUCT DESCRIPTIONS ───────────────────────────────────────────────────
// Collection: productDescriptions
// Document ID = product id (1–16 for static products, or Firebase string ID)
// Each doc: { details, care, shipping }

const DESCRIPTIONS = [
  {
    id: '1',  // Heirloom Watch
    details:  'This Heirloom Watch is a masterpiece of horological artistry. Hand-assembled by our master craftsmen, it features a Swiss movement housed in a solid 18k gold case. Water resistant to 50m. Comes with a two-year warranty and luxury presentation box.',
    care:     'Wind the crown gently every 40 hours if not worn. Polish the case with a soft microfibre cloth. Avoid magnets and extreme temperatures. Service recommended every 3–5 years.',
    shipping: 'Fully insured express shipping within 1–2 business days. Signature required on delivery. Complimentary gift wrapping included. Free returns within 30 days.',
  },
  {
    id: '2',  // Gold Signet Ring
    details:  'Our Gold Signet Ring is crafted from solid 18k yellow gold and finished by hand. The flat table can be personalised with an engraving of your choice — initials, a date, or a monogram. A modern heirloom.',
    care:     'Remove before swimming or using harsh chemicals. Clean with warm soapy water and a soft brush. Polish with a gold cloth to restore shine.',
    shipping: 'Complimentary express shipping on all orders. Allow 3–5 business days if personalisation/engraving is selected. Free returns within 30 days (non-personalised items only).',
  },
  {
    id: '3',  // Diamond Tennis Bracelet
    details:  'Our Diamond Tennis Bracelet features 42 round brilliant-cut diamonds, each hand-set in 18k white gold. Total carat weight: 5.0ct. Every diamond is GIA-certified VS1 clarity, F–G colour.',
    care:     'Store flat in the provided box to prevent kinks. Clean with a jeweller\'s soft brush and mild soap. Have the clasp inspected annually to ensure security.',
    shipping: 'Fully insured shipping with tracking. Signature required. Complimentary luxury gift box included. Free returns within 30 days.',
  },
  {
    id: '4',  // Platinum Chronograph
    details:  'The Platinum Chronograph is our most prestigious timepiece. Featuring a COSC-certified Swiss movement, 60-hour power reserve, and a solid platinum case that develops a distinguished patina over time.',
    care:     'Service every 5 years to maintain peak performance. Store in the provided watch roll away from direct sunlight. Avoid contact with solvents and perfumes.',
    shipping: 'White-glove delivery service. Fully insured, signature required. Arrives in a numbered collector\'s box with certificate of authenticity.',
  },
  {
    id: '5',  // Sapphire Solitaire
    details:  'A vivid Ceylon blue sapphire — 3.2ct, natural, unheated — set in a sleek 18k white gold solitaire setting. Accompanied by a GRS certificate confirming its untreated origin.',
    care:     'Sapphires are extremely durable but avoid ultrasonic cleaners if the stone is fracture-filled. Clean with warm water and a soft brush. Store separately to prevent scratching.',
    shipping: 'Express insured shipping, 1–2 business days. Presented in our signature velvet ring box with certificate. Free returns within 30 days.',
  },
  {
    id: '6',  // Cuban Link Chain
    details:  'A bold 10mm Cuban link chain in solid 18k yellow gold. Each link is hand-polished to a high mirror finish. Available in 18", 20", and 22" lengths. Lobster clasp closure.',
    care:     'Avoid contact with chlorine and saltwater. Wipe clean after each wear. Store flat or hung to prevent tangling.',
    shipping: 'Standard express shipping, 1–3 business days. Arrives in a branded pouch. Free returns within 30 days.',
  },
  {
    id: '7',  // Classic Diamond Ring
    details:  'A timeless round brilliant-cut diamond — 1.5ct, E colour, VVS2 clarity — set in a classic six-prong 18k white gold solitaire. GIA certified. The ring that never goes out of style.',
    care:     'Have prongs checked annually. Clean with warm water and mild dish soap. Avoid abrasive cleaning products that can dull the metal.',
    shipping: 'Fully insured express shipping, complimentary ring sizing service. Free returns within 30 days.',
  },
  {
    id: '8',  // Pearl Drop Earrings
    details:  'South Sea pearl drops (10–11mm, AA+ grade) suspended from diamond-set 18k white gold hooks. Each pearl is individually matched for lustre and roundness. Presented in a velvet pouch.',
    care:     'Pearls are organic — avoid perfume, hairspray and acids. Wipe with a slightly damp soft cloth after wearing. Store separately from metal jewellery.',
    shipping: 'Express shipping, 1–2 business days. Arrives in our signature gift box. Free returns within 30 days.',
  },
  {
    id: '9',  // Eternity Pearl Drops
    details:  'A modern take on classic pearl earrings — freshwater pearls (9mm) cluster-set with pavé diamonds in 18k rose gold for an ethereal, romantic effect.',
    care:     'Keep away from water and strong light. Wipe gently after each wear. Store in the provided soft pouch.',
    shipping: 'Express insured shipping. Presented in a gift-ready box. Free returns within 30 days.',
  },
  {
    id: '10', // Onyx Statement Necklace
    details:  'A dramatic collar necklace featuring hand-cut black onyx tablets bezel-set in oxidised sterling silver. A bold, architectural piece for those who wear jewellery as art.',
    care:     'Onyx is sensitive to heat and acids. Clean with a dry soft cloth only. Store individually to prevent surface scratches.',
    shipping: 'Standard express shipping, 2–3 business days. Arrives in a structured jewellery box. Free returns within 30 days.',
  },
  {
    id: '11', // Vintage Emerald Ring
    details:  'A 4.1ct Colombian emerald — vivid green, minor inclusions typical of natural emeralds — set in an Art Deco-inspired 18k gold mounting with baguette diamond shoulders. AGL certified.',
    care:     'Emeralds are sensitive to pressure and ultrasonic cleaning. Clean with a soft, dry cloth. Store separately. Re-oil treatment recommended every 2–3 years.',
    shipping: 'White-glove insured delivery, signature required. Arrives with gemstone certificate. Free returns within 30 days.',
  },
  {
    id: '12', // Minimalist Gold Choker
    details:  'An 18k yellow gold tube choker in our signature gauge — substantial enough to catch the light, delicate enough to layer. Adjustable from 14" to 16" via lobster clasp.',
    care:     'Polish with a gold cloth to maintain brilliance. Store hanging to prevent kinks. Avoid contact with chlorine.',
    shipping: 'Express shipping, 1–2 business days. Arrives in a velvet pouch. Free returns within 30 days.',
  },
  {
    id: '13', // Rose Gold Cuff
    details:  'A sculptural open cuff in 18k rose gold, hand-hammered to create a subtle texture that catches the light. One size, adjustable. Designed to be worn alone or stacked.',
    care:     'Rose gold develops a warm patina over time — this is normal and beautiful. Clean with a soft polishing cloth. Avoid harsh chemicals.',
    shipping: 'Express shipping, 1–2 business days. Arrives in a branded gift box. Free returns within 30 days.',
  },
  {
    id: '14', // Freshwater Pearl Choker
    details:  'A strand of perfectly matched freshwater pearls (8.5–9mm, AAA grade) on a hand-knotted silk thread with an 18k gold clasp. A wardrobe staple for generations.',
    care:     'Re-stringing recommended every 2 years with regular wear. Wipe with a damp cloth after wearing. Store flat in the provided pouch.',
    shipping: 'Express shipping, 1–2 business days. Arrives in our classic pearl box. Free returns within 30 days.',
  },
  {
    id: '15', // 18k Gold Bangle
    details:  'A solid 18k yellow gold bangle — 4mm wide, high-polish finish. Substantial weight (18g) gives it a luxurious feel on the wrist. Inside diameter 63mm. A lifetime investment.',
    care:     'Polish with a gold cloth when needed. Store separately to avoid surface scratching. Avoid contact with household cleaners.',
    shipping: 'Express shipping, 1–2 business days. Arrives in a luxury bangle box. Free returns within 30 days.',
  },
  {
    id: '16', // Moonstone Ring
    details:  'A rainbow moonstone cabochon (7×9mm) exhibiting a phenomenal blue adularescence, bezel-set in 18k white gold with a thin, comfortable band. Each stone is unique.',
    care:     'Moonstone is relatively soft (6–6.5 Mohs). Avoid hard knocks. Clean with warm water and a very soft cloth. Store separately.',
    shipping: 'Express shipping, 1–2 business days. Arrives in a velvet ring box. Free returns within 30 days.',
  },
];

async function seed() {
  console.log('🌱 Seeding Firestore...\n');
  const batch = db.batch();

  // Seed reviews
  for (const review of REVIEWS) {
    const { id, ...data } = review;
    batch.set(db.collection('reviews').doc(id), data);
    console.log(`  ✓ Review: ${data.name}`);
  }

  // Seed product descriptions
  for (const desc of DESCRIPTIONS) {
    const { id, ...data } = desc;
    batch.set(db.collection('productDescriptions').doc(id), data);
    console.log(`  ✓ Description for product id: ${id}`);
  }

  await batch.commit();
  console.log('\n✅ All done! Open Firebase Console to edit content live.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});