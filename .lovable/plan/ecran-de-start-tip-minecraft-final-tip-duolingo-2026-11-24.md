# Ecran de start tip Minecraft + final tip Duolingo

## 1. Ecran de start (la fiecare deschidere / refresh)
- Ecran pe tot ecranul, în stilul meniului principal din Minecraft:
  - fundal cu insulele 3D care se rotesc încet în spate (camera orbitează lumea), ușor estompat;
  - titlul mare „SPARK ISLES” cu litere pixelate, cu umbră în relief;
  - un mesaj galben înclinat care pulsează (ca „splash text”), ex. „Daily Python!”, ales aleator dintr-o listă scurtă;
  - **un singur buton mare**: „Make the daily challenge”, în stilul butoanelor de piatră din Minecraft.
- La apăsare: ecranul dispare cu o tranziție scurtă și jocul începe direct (fără fereastra de ajutor separată; indicațiile de mișcare apar ca un mic mesaj care dispare singur).

## 2. Ecran final (după ultima insulă)
- Când termini insula 6, în loc de fereastra „Island cleared!” apare un ecran de sărbătoare pe tot ecranul, ca la Duolingo:
  - confetti pixelate care cad pe tot ecranul, plus o explozie de stele;
  - un personaj/insignă care sare („Daily challenge complete!”);
  - statistici animate care cresc numeric: insule terminate (6/6), exerciții rezolvate (10), timp total;
  - mesajul „Come back tomorrow for a new challenge!” și un buton „Back to menu” care revine la ecranul de start (progres resetat).
- Animațiile sunt făcute doar cu CSS (fără biblioteci noi) și respectă setarea „reduce motion” a sistemului.

## Detalii tehnice
- `Game.tsx`: stare nouă `phase: "title" | "playing" | "finished"`; contorizare timp de la start și număr de exerciții (din `ISLANDS`).
- Componente noi: `src/game/TitleScreen.tsx`, `src/game/FinishScreen.tsx`. În `Scene.tsx`, prop `attract` care orbitează camera și oprește input-ul cât timp e afișat ecranul de start.
- Tokenuri noi în `src/styles.css` (culori confetti, keyframes `splash-pulse`, `confetti-fall`, `pop-in`), fără culori hardcodate în componente.
- Progresul rămâne doar în memorie (regula existentă); butonul „Sign in” și contorul săptămânal rămân în HUD în timpul jocului.
- Verificare: Playwright — ecran de start, click pe buton, simulare finalizare, captură ecran final.
