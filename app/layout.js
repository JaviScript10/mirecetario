const APPEARANCE_CSS = `
  :root {
    --color-cream: #FAF5EC;
    --color-paper: #FFFCF7;
    --color-ink: #2C241D;
    --color-ink-soft: #6B5E51;
    --color-ink-faint: #A69A8B;
    --color-line: #EBE0CF;
    --color-clay: #C1613C;
    --color-clay-dark: #A34E2F;
    --color-clay-tint: #F3DDCC;
    --color-olive: #7C8450;
    --color-olive-tint: #E6E7D4;
    --color-gold: #D7A24A;
  }
  html[data-theme="dark"] {
    --color-cream: #1E1A15;
    --color-paper: #262019;
    --color-ink: #F2EAE0;
    --color-ink-soft: #C9BBAC;
    --color-ink-faint: #8C8074;
    --color-line: #3A322A;
    --color-clay: #E08A5E;
    --color-clay-dark: #F0A87C;
    --color-clay-tint: #4A3626;
    --color-olive: #A8B57A;
    --color-olive-tint: #333827;
    --color-gold: #E0B268;
  }
  html[data-accent="oliva"] { --color-clay: var(--color-olive); --color-clay-dark: #5A6234; --color-clay-tint: var(--color-olive-tint); }
  html[data-theme="dark"][data-accent="oliva"] { --color-clay-dark: #C4D19A; }
  html[data-accent="azul"] { --color-clay: #4C7A9E; --color-clay-dark: #37596F; --color-clay-tint: #D9E6EE; }
  html[data-theme="dark"][data-accent="azul"] { --color-clay: #7FB0D6; --color-clay-dark: #A9CEE8; --color-clay-tint: #223642; }
  html[data-accent="rosa"] { --color-clay: #B85C7A; --color-clay-dark: #8F4159; --color-clay-tint: #F3DCE3; }
  html[data-theme="dark"][data-accent="rosa"] { --color-clay: #E092A9; --color-clay-dark: #F0B4C4; --color-clay-tint: #3E2830; }

  html[data-fontsize="grande"] { zoom: 1.12; }
  html[data-fontsize="xl"] { zoom: 1.25; }

  html[data-font="moderna"] * { font-family: 'Poppins', sans-serif !important; }
`;

export const metadata = {
  title: "Mi Recetario",
  description: "Tu biblioteca personal de recetas — CiberByte",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: APPEARANCE_CSS }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
