const RAW = {
  'forest green':'#1a5c1a','dark green':'#1a4a1a','olive green':'#6b8e23',
  'dark blue':'#1a2a5a','sky blue':'#4499dd','dark red':'#8b0000',
  'dark grey':'#555555','dark gray':'#555555','light blue':'#add8e6',
  'light green':'#90ee90','light pink':'#ffb6c1',
  'navy':'#003399','red':'#cc2211','crimson':'#b22222',
  'blue':'#2255cc','green':'#005522','black':'#111111','white':'#ffffff',
  'cream':'#fffdd0','yellow':'#ffcc00','gold':'#cc9900','orange':'#cc6600',
  'purple':'#660099','violet':'#8800cc','pink':'#ee66aa','rose':'#cc3366',
  'grey':'#888888','gray':'#888888','silver':'#c0c0c0',
  'brown':'#663300','tan':'#c8a96e','camel':'#c19a6b',
  'teal':'#006666','cyan':'#0099aa','maroon':'#800000',
  'magenta':'#cc00cc','lime':'#66cc00','coral':'#ff6b6b',
  'indigo':'#3f00ff','beige':'#f5f5dc','khaki':'#c3b091','burgundy':'#800020',
}
export const COLOR_MAP = Object.fromEntries(
  Object.entries(RAW).sort((a, b) => b[0].length - a[0].length)
)
export const RAW_COLORS = RAW
