# JuegAlmi — "Cartucho" design system (Stitch brief)

Mobile app for JuegAlmi, a neighbourhood shop in Spain that sells and rents video games, sells and repairs consoles, and sells and repairs phones/tablets. ALL UI COPY IN SPANISH (Spain), prices like "59,99 €".

## Signature: the notch ("muesca")
Every card, hero banner, image container and bottom sheet has its TOP-RIGHT corner CUT at 45° (chamfer, like a game cartridge, SD card or SIM card). Other three corners rounded 16px. Card notch 16px, hero notch 24px. Buttons, inputs and chips are NOT notched (rounded 12px buttons, pill chips). Price tags are small tag-shaped labels with a monospace price.

## Signature 2: the health bar ("barra de vida")
Progress of repairs and rentals is shown as a SEGMENTED bar (4 to 5 chunky segments, 8px tall, 4px gaps), like a video game health bar. Filled segments use the status color.

## Colors (light)
- Background #FBF8F3 (warm paper), surfaces #FFFFFF, sunken/fields #F1ECF8, borders #D8D0E5, field borders #857D9C
- Ink text #1C1530, secondary text #574E6E
- Primary "coin yellow" #FFC629 — ONLY as fill for the main CTA and active indicators, text on it is #1C1530. Never yellow text on light backgrounds.
- Brand violet #5B2EC2 — links, active tab text/indicator, active icons, accents. Soft violet #EDE5FF.
- Rental cyan #0B6E78 (soft #DDF4F5) — everything about renting.
- Status: success #1A7A49/#DDF3E6, warning #8F5300/#FFEDC7, error #BE2636/#FDE3E5, info #2450C8/#E2E9FF, neutral #5E5872/#ECE9F1.

## Colors (dark)
Background #120D20, surface #1C1630, surface-2 #272042, border #3E355E, text #F4F0FB, secondary text #BDB4D2, primary yellow #FFC629 (text on it #1C1530), brand violet #B9A0FF, rental cyan #5BD5DE, success #5BD594, warning #FFBE5C, error #FF7A86, info #8AAEFF. No shadows in dark: use lighter surfaces for elevation.

## Typography
- Headlines and product names: Bricolage Grotesque 700/800, tight tracking.
- Body, labels, buttons: DM Sans 400/600.
- Prices, order references (#PED-0042), countdowns: JetBrains Mono 700 ("cash-register ticket").
- Scale: display 36/40, h-large 28/34, h-medium 22/28, title 18/24, body 16/24 and 14/20, label 14/20 semibold, small label 12/16.

## Layout & components
- 4px spacing grid, 16px side margins, 48px min touch targets, edge-to-edge with safe areas.
- Top app bar 64px: hamburger (navigation drawer), JuegAlmi wordmark ("Jueg" in ink, "Almi" in violet on light / yellow on dark, logo = small yellow notched cartridge), cart icon with yellow badge, round avatar.
- Big search field (56px, sunken fill, magnifier + yellow mic button on the right for voice search).
- Category tabs under the search: "Videojuegos · Móviles y tablets · Consolas", active tab = violet text + 3px violet indicator.
- Google Play-like home: horizontal carousels of notched product cards (image 4:3 with skeleton placeholder, name, brand, monospace price tag; rentable games show a cyan "Alquiler 3,50 €/día" tag).
- Primary button: full width 52px, yellow fill, ink text, 12px radius. Secondary: violet outline. Tertiary: violet text.
- Chips: pill, sunken fill; selected = violet soft fill + violet text + check icon.
- Status pills: soft background + strong text + small icon (never color alone).
- Icons: Material Symbols Rounded, 24px, outlined; filled when active.
- Flat design, soft subtle shadows in light only. NO gradients, NO neon glows, NO glassmorphism, NO star ratings, NO favourites/hearts, NO "Exclusivo" badges.
