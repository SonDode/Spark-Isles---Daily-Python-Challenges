# Spark Isles: exercițiu zilnic de Python (MVP)

Jocul rămâne la fel (6 insule, poduri, săteni), dar devine un antrenament de Python pentru începători, în stilul Duolingo. Fiecare insulă are alt tip de exercițiu. Dispar toate referirile la Java și Spark.

## Insulele și exercițiile

| Insula | Tip | Număr |
|---|---|---|
| 1 | Single choice (un singur răspuns corect) | 3 |
| 2 | Multiple choice (bifezi toate variantele corecte, apoi „Verifică”) | 3 |
| 3 | Reordonează liniile de cod (maxim 6 linii, amestecate aleator) | 3 |
| 4 | Spot the bug (dai click pe linia greșită) | 3 |
| 5 | Fill in the blanks (scrii cuvântul lipsă în cod) | 3 |
| 6 | Mix final: câte unul din fiecare tip de mai sus | 5 |

Temele sunt de nivel începător: variabile, if, for/range, stringuri, liste, dicționare, funcții.

## Cum se joacă fiecare tip
- **Single choice**: ca acum, apeși o variantă.
- **Multiple choice**: bifezi una sau mai multe variante, apoi apeși „Verifică”. E corect doar dacă ai bifat exact variantele bune.
- **Reorder**: liniile apar amestecate. Fiecare linie are butoane ▲ ▼ (merg și pe telefon). „Verifică” compară ordinea cu cea corectă; codul nu se rulează.
- **Spot the bug**: codul apare pe linii numerotate și apeși pe linia cu greșeala.
- **Fill in the blanks**: codul are 1–2 căsuțe goale. Scrii răspunsul și apeși „Verifică”. Spațiile de la început și de la sfârșit nu contează. Poți accepta mai multe variante scrise corect (de ex. `'` sau `"`).

După fiecare răspuns vezi „Corect!” plus o explicație scurtă, sau „Nu chiar” cu buton de „Mai încearcă”, exact ca acum.

## Alte schimbări pe ecran
- Subtitlul devine „Daily Python practice”. Se actualizează și mesajul de bun venit, mesajul de final și titlul paginii.
- Progresul salvat rămâne valid, pentru că insulele păstrează aceleași numere.
- Textele jocului rămân în engleză.

## Detalii tehnice
- `src/game/sim/content.ts`: `Challenge` devine o uniune discriminată după `kind`:
  - `single {prompt, code?, options, answer:number}`
  - `multi {prompt, code?, options, answers:number[]}`
  - `reorder {prompt, lines:string[]}` (ordinea din date e cea corectă)
  - `bug {prompt, lines, bugLine:number}`
  - `fill {prompt, template:string /* ___ marchează golurile */, blanks:string[][] /* variante acceptate */}`
  Totul e hardcodat, cu exact 3/3/3/3/3/5 exerciții.
- Funcții pure noi în `src/game/sim/check.ts`: `checkAnswer(challenge, response)` și `shuffleLines` (amestecarea nu întoarce niciodată ordinea corectă).
- Teste vitest în `check.test.ts`: multi cere exact setul corect, reorder compară ordinea, fill ignoră spațiile și acceptă variantele, iar numărul de exerciții pe insulă e 3/3/3/3/3/5.
- `src/game/Game.tsx`: dialogul de quiz e mutat într-o componentă `ChallengeView` care afișează interfața potrivită fiecărui tip. Starea `picked` devine un răspuns generic.
- Meta în `index.tsx`, `juego.tsx`, `__root.tsx`.
