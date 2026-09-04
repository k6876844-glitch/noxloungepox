import { getDB, STORES, newId } from './db'
import { bulkPutProducts } from './products'

// Bump when SAMPLE_PRODUCTS changes. On load, a catalogue still made up only
// of an older sample menu is replaced with this one. A catalogue that has been
// edited (any item added / changed / removed) is left alone. See seedIfEmpty().
export const MENU_VERSION = 4

// SKUs of every sample item ever shipped. Used to tell "untouched sample menu"
// (safe to replace) from "the user has curated this" (leave it alone).
const KNOWN_SAMPLE_SKUS = new Set([
  // v1 grocery shop
  '6009510', '6001240', '6001241', '6002100', '6002200', '6002201', '6003100',
  '6002300', '6004100', '6005100', '6005200', '6006100', '6006200', '6002400',
  '6007100', '6008100', '6009100', '6009200', '6004200', 'AIR050',
  // v2 club (mixed)
  'BR-TCD', 'BR-GNS', 'SP-JWB', 'SP-JMS', 'SP-GLB', 'SP-SMV', 'SP-CPM', 'SP-HNS',
  'BT-JWB', 'BT-JMS', 'BT-ABS', 'BT-HNS', 'SD-SOD', 'SD-RBL', 'SD-TNC', 'SD-WTR',
  'KT-WNG', 'KT-BHJ', 'KT-SMS', 'EN-COV', 'EN-VIP',
])

// Sample drinks list for a Nairobi club / bar. Alcohol only. Prices in KES and
// VAT-inclusive. "(tot)" = single measure poured at the bar; "bottle" = sealed
// bottle sold whole. Stock on poured measures is a large running count the bar
// tops up; sealed bottles track for real.
const SAMPLE_PRODUCTS = [
  // Beer & ciders
  { name: 'Tusker Lager 500ml', price: 350, sku: 'BR-TSK', stock: 120, category: 'Beer' },
  { name: 'Tusker Malt 500ml', price: 380, sku: 'BR-TML', stock: 60, category: 'Beer' },
  { name: 'Tusker Cider 500ml', price: 380, sku: 'BR-TCD', stock: 72, category: 'Beer' },
  { name: 'White Cap 500ml', price: 350, sku: 'BR-WCP', stock: 96, category: 'Beer' },
  { name: 'Pilsner 500ml', price: 330, sku: 'BR-PLS', stock: 72, category: 'Beer' },
  { name: 'Balozi 500ml', price: 330, sku: 'BR-BLZ', stock: 48, category: 'Beer' },
  { name: 'Guinness 500ml', price: 380, sku: 'BR-GNS', stock: 60, category: 'Beer' },
  { name: 'Heineken 330ml', price: 400, sku: 'BR-HNK', stock: 84, category: 'Beer' },
  { name: 'Corona 330ml', price: 450, sku: 'BR-CRN', stock: 48, category: 'Beer' },
  { name: 'Smirnoff Ice 275ml', price: 350, sku: 'BR-SMI', stock: 60, category: 'Beer' },
  { name: 'Snapp 275ml', price: 350, sku: 'BR-SNP', stock: 60, category: 'Beer' },

  // Wine & sparkling
  { name: 'House Red (glass)', price: 400, sku: 'WN-HRG', stock: 200, category: 'Wine' },
  { name: 'House White (glass)', price: 400, sku: 'WN-HWG', stock: 200, category: 'Wine' },
  { name: '4th Street Sweet Red — bottle', price: 1800, sku: 'WN-4SR', stock: 18, category: 'Wine' },
  { name: 'Nederburg Cabernet — bottle', price: 2500, sku: 'WN-NDB', stock: 10, category: 'Wine' },
  { name: 'Robertson Chardonnay — bottle', price: 2400, sku: 'WN-RBC', stock: 10, category: 'Wine' },
  { name: 'Prosecco — bottle', price: 3500, sku: 'WN-PRO', stock: 8, category: 'Wine' },
  { name: 'Moët & Chandon — bottle', price: 12000, sku: 'WN-MOET', stock: 4, category: 'Wine' },

  // Whisky
  { name: 'Johnnie Walker Red (tot)', price: 350, sku: 'WH-JWR', stock: 300, category: 'Whisky' },
  { name: 'Johnnie Walker Black (tot)', price: 500, sku: 'WH-JWB', stock: 300, category: 'Whisky' },
  { name: 'Jameson (tot)', price: 450, sku: 'WH-JMS', stock: 300, category: 'Whisky' },
  { name: "Jack Daniel's (tot)", price: 500, sku: 'WH-JCK', stock: 300, category: 'Whisky' },
  { name: 'Chivas Regal 12 (tot)', price: 600, sku: 'WH-CHV', stock: 200, category: 'Whisky' },
  { name: 'Glenfiddich 12 (tot)', price: 700, sku: 'WH-GLN', stock: 150, category: 'Whisky' },
  { name: 'Johnnie Walker Black — bottle', price: 6500, sku: 'WH-JWB-B', stock: 12, category: 'Whisky' },
  { name: 'Jameson — bottle', price: 5500, sku: 'WH-JMS-B', stock: 10, category: 'Whisky' },
  { name: "Jack Daniel's — bottle", price: 6500, sku: 'WH-JCK-B', stock: 8, category: 'Whisky' },

  // Vodka
  { name: 'Smirnoff Vodka (tot)', price: 300, sku: 'VK-SMV', stock: 300, category: 'Vodka' },
  { name: 'Absolut (tot)', price: 350, sku: 'VK-ABS', stock: 300, category: 'Vodka' },
  { name: 'Grey Goose (tot)', price: 700, sku: 'VK-GGS', stock: 120, category: 'Vodka' },
  { name: 'Smirnoff Vodka — bottle', price: 2500, sku: 'VK-SMV-B', stock: 12, category: 'Vodka' },
  { name: 'Absolut — bottle', price: 4500, sku: 'VK-ABS-B', stock: 8, category: 'Vodka' },

  // Gin
  { name: "Gilbey's Gin (tot)", price: 300, sku: 'GN-GLB', stock: 300, category: 'Gin' },
  { name: 'Tanqueray (tot)', price: 450, sku: 'GN-TNQ', stock: 200, category: 'Gin' },
  { name: 'Bombay Sapphire (tot)', price: 450, sku: 'GN-BMB', stock: 200, category: 'Gin' },
  { name: "Gilbey's Gin — bottle", price: 2200, sku: 'GN-GLB-B', stock: 12, category: 'Gin' },
  { name: 'Tanqueray — bottle', price: 4200, sku: 'GN-TNQ-B', stock: 8, category: 'Gin' },

  // Rum
  { name: 'Captain Morgan (tot)', price: 320, sku: 'RM-CPM', stock: 300, category: 'Rum' },
  { name: 'Bacardi (tot)', price: 350, sku: 'RM-BCD', stock: 200, category: 'Rum' },
  { name: 'Malibu (tot)', price: 350, sku: 'RM-MLB', stock: 200, category: 'Rum' },

  // Brandy & cognac
  { name: 'Viceroy Brandy (tot)', price: 300, sku: 'BY-VCR', stock: 300, category: 'Brandy & Cognac' },
  { name: 'Martell VS (tot)', price: 750, sku: 'BY-MTL', stock: 120, category: 'Brandy & Cognac' },
  { name: 'Hennessy VS (tot)', price: 800, sku: 'BY-HNS', stock: 200, category: 'Brandy & Cognac' },
  { name: 'Hennessy VS — bottle', price: 12000, sku: 'BY-HNS-B', stock: 5, category: 'Brandy & Cognac' },

  // Liqueurs
  { name: 'Amarula (tot)', price: 350, sku: 'LQ-AMR', stock: 200, category: 'Liqueurs' },
  { name: 'Baileys (tot)', price: 400, sku: 'LQ-BLY', stock: 200, category: 'Liqueurs' },
  { name: 'Southern Comfort (tot)', price: 400, sku: 'LQ-SCF', stock: 150, category: 'Liqueurs' },

  // Cocktails
  { name: 'Mojito', price: 650, sku: 'CK-MOJ', stock: 300, category: 'Cocktails' },
  { name: 'Margarita', price: 700, sku: 'CK-MRG', stock: 300, category: 'Cocktails' },
  { name: 'Pina Colada', price: 700, sku: 'CK-PNC', stock: 300, category: 'Cocktails' },
  { name: 'Cosmopolitan', price: 700, sku: 'CK-CSM', stock: 300, category: 'Cocktails' },
  { name: 'Long Island Iced Tea', price: 850, sku: 'CK-LIT', stock: 300, category: 'Cocktails' },
  { name: 'Dawa', price: 500, sku: 'CK-DAW', stock: 300, category: 'Cocktails' },

  // Shots
  { name: 'Tequila shot', price: 350, sku: 'SH-TQL', stock: 400, category: 'Shots' },
  { name: 'Sambuca shot', price: 350, sku: 'SH-SMB', stock: 400, category: 'Shots' },
  { name: 'Jägermeister shot', price: 400, sku: 'SH-JGR', stock: 400, category: 'Shots' },
  { name: 'Jägerbomb', price: 550, sku: 'SH-JGB', stock: 300, category: 'Shots' },
  { name: 'B-52', price: 500, sku: 'SH-B52', stock: 300, category: 'Shots' },
]

function withMeta(list) {
  const now = new Date().toISOString()
  return list.map((p) => ({ ...p, id: newId(), createdAt: now, updatedAt: now }))
}

async function loadSampleMenu(db) {
  const tx = db.transaction([STORES.PRODUCTS, STORES.PENDING_SYNC], 'readwrite')
  await tx.objectStore(STORES.PRODUCTS).clear()
  await tx.objectStore(STORES.PENDING_SYNC).clear()
  await tx.done
  await bulkPutProducts(withMeta(SAMPLE_PRODUCTS))
  await db.put(STORES.SETTINGS, { key: 'menuVersion', value: MENU_VERSION })
}

export async function seedIfEmpty() {
  const db = await getDB()
  const products = await db.getAll(STORES.PRODUCTS)

  if (products.length === 0) {
    await bulkPutProducts(withMeta(SAMPLE_PRODUCTS))
    await db.put(STORES.SETTINGS, { key: 'menuVersion', value: MENU_VERSION })
    return true
  }

  const stored = await db.get(STORES.SETTINGS, 'menuVersion')
  if ((stored?.value ?? 0) >= MENU_VERSION) return false

  // The catalogue predates this menu version. Replace it only if it's still an
  // untouched sample set — every item's SKU is one we shipped. If the user has
  // added or renamed anything, leave it and just record the version.
  const currentSkus = new Set(SAMPLE_PRODUCTS.map((p) => p.sku))
  const untouched = products.every(
    (p) => KNOWN_SAMPLE_SKUS.has(p.sku) || currentSkus.has(p.sku),
  )

  if (untouched) {
    await loadSampleMenu(db)
  } else {
    await db.put(STORES.SETTINGS, { key: 'menuVersion', value: MENU_VERSION })
  }
  return untouched
}

/**
 * Wipe the catalogue and sales/queue, then load the sample menu again.
 * Used by the "Reset sample menu" button in Settings.
 */
export async function resetToSampleMenu() {
  const db = await getDB()
  await db.clear(STORES.SALES)
  await loadSampleMenu(db)
}
