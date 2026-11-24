import React, { useEffect, useRef, useState } from 'react'

/** Example inserted by the "Charger l'exemple" button of the lyrics guide. */
export const HELP_EXAMPLE = `Titre: Grâce infinie
Auteur : Jean Dupont

1-
Ta grâce est plus grande
Que toutes mes fautes
Ta main me relève
Quand je tombe/
Et me rend la joie

[Refrain]
Grâce infinie, grâce infinie
Je chante ton nom`

interface HelpModalProps {
  onClose: () => void
  onLoadExample: (example: string) => void
}

/* ---------- Small presentational helpers ---------- */

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="px-1.5 py-0.5 rounded border border-surface-line dark:border-surface-line-dark bg-surface-app dark:bg-surface-app-dark text-[11px] font-mono font-medium whitespace-nowrap">
    {children}
  </kbd>
)

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1 py-0.5 rounded bg-surface-app dark:bg-surface-app-dark border border-surface-line dark:border-surface-line-dark text-[12px] font-mono">
    {children}
  </code>
)

const Pre = ({ children }: { children: string }) => (
  <pre className="my-3 p-3 rounded-lg bg-surface-app dark:bg-surface-app-dark border border-surface-line dark:border-surface-line-dark text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre">
    {children}
  </pre>
)

const Title = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold mb-1">{children}</h3>
)

const Lead = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-surface-mute dark:text-surface-mute-dark mb-4 leading-relaxed">{children}</p>
)

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-semibold uppercase tracking-wide text-surface-mute dark:text-surface-mute-dark mt-5 mb-2">{children}</h4>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed my-2">{children}</p>
)

const Note = ({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: React.ReactNode }) => (
  <div
    className={`my-3 px-3 py-2.5 rounded-lg text-[13px] leading-relaxed border ${
      tone === 'warn'
        ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-100'
        : 'bg-brand-soft border-brand/20 text-surface-ink dark:bg-surface-line-dark dark:border-surface-line-dark dark:text-surface-ink-dark'
    }`}
  >
    {children}
  </div>
)

const Table = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div className="my-3 overflow-x-auto rounded-lg border border-surface-line dark:border-surface-line-dark">
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr className="bg-surface-app dark:bg-surface-app-dark text-left">
          {head.map(h => (
            <th key={h} className="px-3 py-2 font-semibold border-b border-surface-line dark:border-surface-line-dark">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="align-top">
            {row.map((cell, j) => (
              <td
                key={j}
                className={`px-3 py-2 leading-relaxed ${i < rows.length - 1 ? 'border-b border-surface-line dark:border-surface-line-dark' : ''}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Steps = ({ items }: { items: { title: string; body: React.ReactNode }[] }) => (
  <ol className="space-y-3 my-3">
    {items.map((it, i) => (
      <li key={it.title} className="flex gap-3">
        <span className="shrink-0 w-6 h-6 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <div className="text-sm leading-relaxed">
          <div className="font-semibold">{it.title}</div>
          <div className="text-surface-mute dark:text-surface-mute-dark">{it.body}</div>
        </div>
      </li>
    ))}
  </ol>
)

/* ---------- Guide sections ---------- */

interface HelpSection {
  id: string
  label: string
  render: (ctx: { onLoadExample: (example: string) => void }) => React.ReactNode
}

const SECTIONS: HelpSection[] = [
  {
    id: 'start',
    label: 'Démarrage rapide',
    render: () => (
      <>
        <Title>Démarrage rapide</Title>
        <Lead>De votre texte à une présentation PowerPoint en quatre étapes.</Lead>
        <Steps
          items={[
            {
              title: 'Saisir le texte',
              body: <>Collez vos paroles ou votre texte dans « Texte source ». L'aperçu se met à jour en temps réel.</>
            },
            {
              title: 'Structurer les diapositives',
              body: (
                <>
                  Une ligne vide, <Code>---</Code>, un marqueur de section (<Code>1-</Code>, <Code>[Refrain]</Code>, <Code>fiv:</Code>, <Code>fiverenana:</Code>) ou un <Code>/</Code> en fin de ligne démarre ou termine une diapositive. Le texte qui suit un marqueur sur la même ligne passe à la ligne suivante. « Normaliser » regroupe les lignes par 1, 2 ou 3.
                </>
              )
            },
            {
              title: 'Mettre en forme',
              body: <>Choisissez le format, la police, la taille (ou « Taille max auto »), l'alignement et les couleurs.</>
            },
            {
              title: 'Exporter',
              body: <>« Copier la diapo (image) » copie l'aperçu complet, prêt à coller. « Copier tout (.pptx) » crée et ouvre une présentation PowerPoint avec toutes les diapos.</>
            }
          ]}
        />
        <Note>
          Le bouton « ⚠ diapo à vérifier » apparaît en haut de l'écran lorsqu'une diapositive déborde de la zone de sécurité. Cliquez dessus pour y accéder directement.
        </Note>
      </>
    )
  },
  {
    id: 'lyrics',
    label: 'Paroles et sections',
    render: ({ onLoadExample }) => (
      <>
        <Title>Paroles : sections, titre et sauts de diapositive</Title>
        <Lead>Structurez un chant avec des marqueurs de section : chaque couplet ou refrain devient sa propre diapositive.</Lead>

        <SubTitle>Marqueurs de section</SubTitle>
        <P>
          Le marqueur doit être <strong>seul sur sa ligne</strong> ; les paroles se placent sur les lignes suivantes. Chaque marqueur démarre une nouvelle diapositive et s'affiche en première ligne (désactivable).
        </P>
        <Table
          head={['Type', 'Exemples saisis', 'Affiché']}
          rows={[
            ['Numéro + tiret', <><Code>1-</Code> <Code>1 -</Code> <Code>2 –</Code></>, <><Code>1 -</Code> <Code>2 -</Code></>],
            ['Numéro + point ou parenthèse', <><Code>3.</Code> <Code>4)</Code></>, <><Code>3.</Code> <Code>4)</Code></>],
            ['Entre crochets', <><Code>[Verset 1]</Code> <Code>[Refrain]</Code></>, <>Verset 1, Refrain</>],
            ['Numéro + crochets', <Code>1 - [Verset 1]</Code>, <>1 - Verset 1</>],
            ['Mot-clé', <><Code>Couplet 2</Code> <Code>Refrain:</Code> <Code>Pont</Code></>, <>tel quel (sans « : »)</>]
          ]}
        />
        <P>
          Mots-clés reconnus : verset, couplet, strophe, refrain, pont, bridge, chorus, verse, intro, outro, coda, interlude, pré-refrain, pre-chorus.
        </P>
        <Note tone="warn">
          <Code>1- Première ligne</Code> (marqueur suivi de texte) n'est pas un marqueur : cela évite de confondre « 1 - 2 - 3 soleil » avec un marqueur. Placez-le sur sa propre ligne.
        </Note>

        <SubTitle>Titre du chant</SubTitle>
        <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
          <li><strong>Automatique</strong> : tout ce qui précède le premier marqueur forme la diapositive de titre (titre, auteur, tonalité…).</li>
          <li><strong>Explicite</strong> : préfixez une ligne par <Code>Titre:</Code> (ou <Code>Title:</Code>, <Code>Chant:</Code>, <Code>Cantique:</Code>, <Code>Hymne:</Code>). Seule cette ligne devient titre.</li>
          <li>Dès qu'un texte contient des marqueurs, l'option « Première ligne = titre » est ignorée.</li>
        </ul>

        <SubTitle>Forcer une fin de diapositive avec « / »</SubTitle>
        <P>
          Un <Code>/</Code> à la fin d'une ligne termine la diapositive après cette ligne ; il n'est pas affiché. Une ligne contenant uniquement <Code>/</Code> produit le même effet. Un <Code>/</Code> au milieu d'une ligne (« et/ou ») n'a aucun effet.
        </P>

        <SubTitle>Afficher ou masquer les marqueurs</SubTitle>
        <P>
          La case « Afficher les marqueurs » (paramètres) est cochée par défaut. Décochée, les marqueurs servent uniquement à découper les diapositives. Si un couplet occupe plusieurs diapositives, seule la première porte le marqueur.
        </P>

        <SubTitle>Exemple</SubTitle>
        <Pre>{HELP_EXAMPLE}</Pre>
        <button type="button" className="btn" onClick={() => onLoadExample(HELP_EXAMPLE)}>
          Charger l'exemple dans l'éditeur
        </button>
      </>
    )
  },
  {
    id: 'normalize',
    label: 'Normaliser le texte',
    render: () => (
      <>
        <Title>Normaliser le texte</Title>
        <Lead>Le bouton « Normaliser » regroupe les lignes en diapositives homogènes.</Lead>
        <Table
          head={['Option', 'Effet']}
          rows={[
            [<strong>Lignes par diapo</strong>, <>1, 2 ou 3 lignes de paroles par diapositive.</>],
            [<strong>Conserver les couplets existants</strong>, <>Respecte les lignes vides et les <Code>---</Code> déjà présents. Décochez pour tout regrouper à nouveau.</>]
          ]}
        />
        <SubTitle>Ce qui est toujours conservé</SubTitle>
        <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
          <li>Les marqueurs de section, séparés du texte s'il est sur la même ligne, les lignes <Code>Titre:</Code> et la zone de titre.</li>
          <li>Les sauts forcés <Code>/</Code>, qui deviennent une coupure de diapositive.</li>
          <li>Un marqueur ne compte pas dans le nombre de lignes : il s'affiche sur la même ligne que le premier mot sur la diapo, tout en restant séparé dans le texte normalisé.</li>
        </ul>
        <Note>Relancer « Normaliser » sur un texte déjà normalisé ne change rien.</Note>
      </>
    )
  },
  {
    id: 'layout',
    label: 'Mise en page',
    render: () => (
      <>
        <Title>Mise en page et personnalisation</Title>
        <Lead>Tous les réglages s'appliquent à l'aperçu et à l'export.</Lead>
        <Table
          head={['Réglage', 'Description']}
          rows={[
            [<strong>Format de diapositive</strong>, <>Écran large (16:9) ou Standard (4:3).</>],
            [<strong>Police</strong>, <>Calibri, Arial, Segoe UI, Times New Roman ou Georgia.</>],
            [<strong>Taille (pt)</strong>, <>Taille fixe pour toutes les diapositives.</>],
            [<strong>⤢ Taille max auto</strong>, <>Calcule, pour chaque diapositive, la plus grande taille (de 10 à 100 pt) qui tient sans débordement.</>],
            [<strong>Position verticale</strong>, <>Auto (les diapositives courtes sont centrées), Toujours centré ou Toujours en haut.</>],
            [<strong>Alignement</strong>, <>Gauche, Centré, Droite ou Justifié.</>],
            [<strong>Interligne</strong>, <>Espacement entre les lignes.</>],
            [<strong>Couleurs</strong>, <>Palettes prédéfinies ou couleur personnalisée pour le texte et le fond.</>],
            [<strong>Première ligne = titre</strong>, <>Une première ligne courte (moins de 60 caractères, sans point final) devient le titre. Non applicable aux textes avec marqueurs.</>],
            [<strong>Tout en gras</strong>, <>Applique le gras à l'ensemble du texte.</>]
          ]}
        />
        <Note>
          Les préférences sont enregistrées automatiquement. Le mode clair/sombre se change avec le bouton lune/soleil de l'en-tête.
        </Note>
      </>
    )
  },
  {
    id: 'export',
    label: 'Export et copie',
    render: () => (
      <>
        <Title>Exporter vers PowerPoint</Title>
        <Lead>Copiez une diapo comme image ou créez une présentation PowerPoint complète.</Lead>
        <Table
          head={['Action', 'Résultat']}
          rows={[
            [<strong>Copier tout (.pptx)</strong>, <>Crée et ouvre un fichier PowerPoint natif contenant toutes les diapos mises en forme. Son nom reprend le titre ou le premier texte de la première diapo.</>],
            [<strong>Copier la diapo (image)</strong>, <>Copie l'aperçu complet comme image dans le presse-papiers; collez-le dans PowerPoint. Raccourci : <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>C</Kbd>.</>]
          ]}
        />
        <Note>Avant d'exporter, vérifiez les diapositives signalées par « ⚠ diapo à vérifier » : elles dépassent la zone de sécurité.</Note>
      </>
    )
  },
  {
    id: 'shortcuts',
    label: 'Raccourcis clavier',
    render: () => (
      <>
        <Title>Raccourcis clavier</Title>
        <Lead>Gagnez du temps avec ces raccourcis.</Lead>
        <Table
          head={['Raccourci', 'Action']}
          rows={[
            [<><Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>C</Kbd></>, <>Copier la diapo sélectionnée comme image</>],
            [<Kbd>F1</Kbd>, <>Ouvrir ou fermer l'aide</>],
            [<Kbd>Échap</Kbd>, <>Fermer l'aide</>],
            [<><Kbd>↑</Kbd> <Kbd>↓</Kbd></>, <>Changer de rubrique dans l'aide</>]
          ]}
        />
      </>
    )
  },
  {
    id: 'faq',
    label: 'Dépannage',
    render: () => {
      const faq: { q: string; a: React.ReactNode }[] = [
        {
          q: 'Mon marqueur (1-, Refrain…) apparaît comme une ligne de texte ordinaire.',
          a: <>Il doit être seul sur sa ligne, avec les paroles en dessous. <Code>1- Texte</Code> sur une même ligne n'est pas reconnu.</>
        },
        {
          q: 'Une ligne devient un titre alors que je ne le souhaite pas.',
          a: <>Décochez « Première ligne = titre », ou vérifiez qu'aucun texte parasite ne précède le premier marqueur (cette zone est toujours un titre).</>
        },
        {
          q: 'Le marqueur ne doit pas apparaître sur la diapositive.',
          a: <>Décochez « Afficher les marqueurs » dans les paramètres : il ne servira plus qu'au découpage.</>
        },
        {
          q: '« Normaliser » ne change rien.',
          a: <>Le texte est déjà normalisé. Pour regrouper à nouveau, décochez « Conserver les couplets existants ».</>
        },
        {
          q: 'Une diapositive est signalée « à vérifier ».',
          a: <>Elle contient trop de texte pour la taille choisie. Réduisez la taille, activez « Taille max auto » ou scindez-la avec une ligne vide ou un <Code>/</Code>.</>
        }
      ]
      return (
        <>
          <Title>Dépannage</Title>
          <Lead>Réponses aux situations les plus courantes.</Lead>
          <dl className="space-y-4">
            {faq.map(item => (
              <div key={item.q}>
                <dt className="text-sm font-semibold">{item.q}</dt>
                <dd className="text-sm text-surface-mute dark:text-surface-mute-dark leading-relaxed mt-0.5">{item.a}</dd>
              </div>
            ))}
          </dl>
        </>
      )
    }
  }
]

/* ---------- Modal ---------- */

export default function HelpModal({ onClose, onLoadExample }: HelpModalProps) {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Move focus into the dialog and restore it on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  // Escape closes, Tab stays inside the dialog.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [activeId])

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % SECTIONS.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + SECTIONS.length) % SECTIONS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = SECTIONS.length - 1
    if (next < 0) return
    e.preventDefault()
    const id = SECTIONS[next].id
    setActiveId(id)
    tabRefs.current[id]?.focus()
  }

  const active = SECTIONS.find(s => s.id === activeId) ?? SECTIONS[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="card w-full max-w-4xl h-[min(86vh,700px)] flex flex-col overflow-hidden !shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-surface-line dark:border-surface-line-dark">
          <div>
            <h2 id="help-title" className="text-base font-semibold">Centre d'aide</h2>
            <p className="text-xs text-surface-mute dark:text-surface-mute-dark mt-0.5">Guides d'utilisation de Text2Slide</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="btn !w-9 !px-0" aria-label="Fermer l'aide" title="Fermer (Échap)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Rubriques d'aide"
            className="sm:w-56 shrink-0 flex sm:flex-col gap-1 p-3 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-surface-line dark:border-surface-line-dark bg-surface-app/60 dark:bg-surface-app-dark/60"
          >
            {SECTIONS.map((s, i) => {
              const selected = s.id === activeId
              return (
                <button
                  key={s.id}
                  ref={el => { tabRefs.current[s.id] = el }}
                  id={`help-tab-${s.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="help-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(s.id)}
                  onKeyDown={e => handleTabKeyDown(e, i)}
                  className={`text-left whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                    selected
                      ? 'bg-brand-soft text-brand dark:bg-surface-line-dark dark:text-brand-dark'
                      : 'text-surface-mute dark:text-surface-mute-dark hover:bg-brand-soft/60 dark:hover:bg-surface-line-dark/60'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          <div
            ref={panelRef}
            id="help-panel"
            role="tabpanel"
            aria-labelledby={`help-tab-${active.id}`}
            tabIndex={0}
            className="flex-1 min-w-0 overflow-y-auto px-6 py-5 focus:outline-none"
          >
            {active.render({ onLoadExample })}
          </div>
        </div>
      </div>
    </div>
  )
}
