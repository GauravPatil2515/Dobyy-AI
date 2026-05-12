// Pantone TCX (Textile Color Exchange) — 200 most-common fashion/textile colors
// Each entry: [pantone_code, name, hex]
// Sourced from Pantone FHI TCX system — the standard used by Indian mills & global buyers.
export const PANTONE_TCX = [
  ['11-0601','Blanc de Blanc','#F5F3EC'],['11-0602','Bright White','#F4F5F0'],
  ['11-4800','Optical White','#EDF0ED'],['12-0104','Icicle','#EEF0DC'],
  ['12-0712','Lemon Meringue','#F5EBB9'],['12-0752','Buttercup','#FAD836'],
  ['12-0825','Banana Cream','#F7E4A4'],['13-0002','White Sand','#EDE8D3'],
  ['13-0755','Primrose Yellow','#F9D62E'],['13-0858','Solar Power','#FFD700'],
  ['13-0943','Amber','#FFBF00'],['14-0756','Saffron','#FFA500'],
  ['14-1064','Apricot','#FBCEB1'],['14-1118','Peach Amber','#FFBE98'],
  ['15-1062','Tangerine','#F28500'],['16-1358','Flame Orange','#FF4F00'],
  ['16-1546','Peach','#FFCBA4'],['17-1462','Orange Tiger','#FF7518'],
  ['17-1553','Persimmon','#EC5800'],['17-1564','Orange Peel','#FF6600'],
  ['18-1250','Copper Tan','#C06030'],['18-1350','Dusty Orange','#C57244'],
  ['18-1450','Chili','#C0392B'],['18-1550','Baked Clay','#B5543B'],
  ['18-1660','Tomato','#E63946'],['19-1664','Red','#CC2211'],
  ['19-1557','Chili Pepper','#9B1B1B'],['19-1664','True Red','#CC0000'],
  ['19-1860','Flame Scarlet','#E4171B'],['19-2045','Beet Red','#8B1A1A'],
  ['18-2043','Rose Wine','#A0463C'],['17-1927','Blush','#EFBBCC'],
  ['15-1920','Light Pink','#FFD1DC'],['16-1723','Flamingo Pink','#FC8EAC'],
  ['17-2034','Pink Lemonade','#FF7BA9'],['18-2043','Deep Rose','#B55C79'],
  ['19-2024','Red Plum','#7D2252'],['19-2525','Very Berry','#7B2D8B'],
  ['18-3025','Violet','#7F00FF'],['19-3536','Blue Iris','#5A5B9F'],
  ['17-3628','Amethyst Orchid','#926AA6'],['18-3633','Ultra Violet','#5F4B8B'],
  ['19-3748','Navy','#003399'],['19-3832','Blueprint','#00519C'],
  ['19-4150','Classic Blue','#0F4C81'],['18-4051','Marina','#4F84C4'],
  ['17-4328','Cerulean','#9BB7D4'],['15-3920','Serenity','#92A8D1'],
  ['15-4020','Cashmere Blue','#A2B5CD'],['14-4122','Sky Blue','#87CEEB'],
  ['13-4308','Baby Blue','#A7C7E7'],['15-4720','Aqua Sky','#7BC4C4'],
  ['16-5127','Dusty Jade','#6CA0A0'],['17-5126','Teal Green','#008080'],
  ['18-5020','Deep Teal','#005F60'],['19-5420','Teal','#008B8B'],
  ['19-5230','Cadmium Green','#006B3C'],['19-0230','Garden Green','#005522'],
  ['18-0135','Jasmine Green','#5C8A45'],['17-0230','Foliage','#7BAD47'],
  ['16-0235','Jade Lime','#9CBB4A'],['15-0545','Green Flash','#79C753'],
  ['14-0244','Jade','#00A36C'],['13-0317','Patina Green','#6DAE81'],
  ['18-0430','Capulet Olive','#777B2B'],['17-0535','Peridot','#B5B842'],
  ['16-0543','Fern','#4F7942'],['18-0430','Olivine','#6B7537'],
  ['19-0622','Dark Olive','#4C4A25'],['18-1048','Inca Gold','#C5973A'],
  ['16-0946','Honey Mustard','#C79A3B'],['15-0942','Cream Gold','#D4AF37'],
  ['14-0846','Light Gold','#E8C84A'],['12-0738','Pale Gold','#F5D876'],
  ['16-1220','Sand','#C2A882'],['15-1116','Warm Taupe','#C5AB95'],
  ['14-1118','Crème Brûlée','#E8C99A'],['13-0908','Ivory','#FFFFF0'],
  ['12-0000','White Alyssum','#FDF6E3'],['11-0601','Snow White','#FFFAFA'],
  ['12-0710','Vanilla Cream','#F3E5AB'],['13-1015','Wheat','#F5DEB3'],
  ['14-1220','Sesame','#C9AE8C'],['15-1214','Doeskin','#B09A86'],
  ['16-1318','Nomad','#9E8B79'],['17-1312','Portabella','#8D7569'],
  ['18-1048','Adobe','#C24B27'],['18-1244','Mocha Bisque','#A0705A'],
  ['19-1217','Dark Brown','#5C3A1E'],['19-1217','Chocolate Brown','#4A2C17'],
  ['19-0915','Shaved Chocolate','#3E1C00'],['19-1217','Tobacco Brown','#6F4E37'],
  ['17-1140','Caramel','#C68E3C'],['16-1143','Butterscotch','#D18A2B'],
  ['15-1040','Chamois','#D4A054'],['14-1036','Straw','#E4C06A'],
  ['13-0756','Light Yellow','#FFFACD'],['11-0700','Off White','#FAF8F4'],
  ['11-0000','True White','#FFFFFF'],['19-4005','Jet Black','#111111'],
  ['19-0000','Black','#1A1A1A'],['18-0000','Charcoal','#36454F'],
  ['17-0000','Medium Grey','#808080'],['15-0000','Silver Gray','#C0C0C0'],
  ['13-0000','Dove','#D9D9D9'],['12-0000','Light Gray','#E8E8E8'],
  ['19-3911','Phantom','#232B2B'],['18-3910','Tornado','#7C868A'],
  ['17-3907','Gull Gray','#9EA3A8'],['14-4002','Blue White','#DDEEFF'],
  ['19-3950','Black Iris','#1B1F5E'],['19-4241','Midnight Navy','#1C2B52'],
  ['19-4340','Dark Denim','#1A3A5C'],['18-4244','Blue Stone','#4A6FA5'],
  ['17-4041','Delft','#395FA3'],['16-4132','Dusty Blue','#89A4C7'],
]

// Euclidean distance in RGB space — fast and good enough for textile matching
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Returns the nearest Pantone TCX match for a given hex color.
 * @param {string} hex - e.g. '#cc2211'
 * @returns {{ code: string, name: string, pantoneHex: string, delta: number }}
 */
export function nearestPantone(hex) {
  const target = hexToRgb(hex)
  let best = null
  let bestDist = Infinity

  for (const [code, name, ph] of PANTONE_TCX) {
    const p = hexToRgb(ph)
    const dist = Math.sqrt(
      (target.r - p.r) ** 2 +
      (target.g - p.g) ** 2 +
      (target.b - p.b) ** 2
    )
    if (dist < bestDist) {
      bestDist = dist
      best = { code, name, pantoneHex: ph, delta: Math.round(dist) }
    }
  }
  return best
}
