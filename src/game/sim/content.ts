// Hardcoded beginner Python practice: one pass through six islands, one exercise type per island.
interface Base { prompt: string; explain: string }
export interface SingleChallenge extends Base { kind: "single"; code?: string; options: string[]; answer: number }
export interface MultiChallenge extends Base { kind: "multi"; code?: string; options: string[]; answers: number[] }
/** `lines` is the correct order; the UI shuffles it. */
export interface ReorderChallenge extends Base { kind: "reorder"; lines: string[] }
export interface BugChallenge extends Base { kind: "bug"; lines: string[]; bugLine: number }
/** `___` in the template marks each blank; `blanks[i]` lists accepted answers for blank i. */
export interface FillChallenge extends Base { kind: "fill"; template: string; blanks: string[][] }
export type Challenge = SingleChallenge | MultiChallenge | ReorderChallenge | BugChallenge | FillChallenge;

export interface Island {
  id: number; name: string; topic: string; villager: string; intro: string; grass: string;
  challenges: Challenge[];
}

export const ISLANDS: Island[] = [
  {
    id: 0, name: "Island 1 · Choice Cove", topic: "Single choice", villager: "Forge Keeper",
    intro: "Warm up! Pick the one right answer.", grass: "#6aa84f",
    challenges: [
      { kind: "single", prompt: "What does this print?", code: "x = 7\ny = 2\nprint(x // y)", options: ["3.5", "3", "4", "1"], answer: 1, explain: "`//` is floor division: 7 // 2 is 3." },
    ],
  },
  {
    id: 1, name: "Island 2 · Many Meadow", topic: "Multiple choice", villager: "Snake Shepherd",
    intro: "Here more than one answer can be right. Tick them all!", grass: "#7cb342",
    challenges: [
      { kind: "multi", prompt: "Which of these create a list?", options: ["[1, 2, 3]", "list(range(3))", "(1, 2, 3)", "{1, 2, 3}"], answers: [0, 1], explain: "Square brackets and list() make lists; () is a tuple and {} here is a set." },
    ],
  },
  {
    id: 2, name: "Island 3 · Order Canyon", topic: "Reorder the lines", villager: "Dunder Smith",
    intro: "The lines got scrambled! Put them back in order.", grass: "#8bc34a",
    challenges: [
      { kind: "reorder", prompt: "Sum the numbers 1 to 5 and print the result.", lines: ["total = 0", "for n in range(1, 6):", "    total += n", "print(total)"], explain: "Start at 0, add inside the loop, print after it." },
    ],
  },
  {
    id: 3, name: "Island 4 · Bug Tundra", topic: "Spot the bug", villager: "Hint Hermit",
    intro: "Something is broken. Tap the line with the bug.", grass: "#9ccc65",
    challenges: [
      { kind: "bug", prompt: "Which line has the bug?", lines: ["age = 18", "if age >= 18", '    print("adult")'], bugLine: 1, explain: "An if line must end with a colon." },
    ],
  },
  {
    id: 4, name: "Island 5 · Blank Caves", topic: "Fill in the blanks", villager: "Line Tracer",
    intro: "Type the missing pieces of code.", grass: "#689f38",
    challenges: [
      { kind: "fill", prompt: "Print each item in the list.", template: "colors = [\"red\", \"blue\"]\n___ c in colors:\n    print(c)", blanks: [["for"]], explain: "`for item in list:` loops over every item." },
    ],
  },
  {
    id: 5, name: "Island 6 · Python Summit", topic: "Final mix", villager: "Committer Owl",
    intro: "The final test: one of every kind. Show what you've learned!", grass: "#558b2f",
    challenges: [
      { kind: "single", prompt: "What does this print?", code: 's = "hello"\nprint(s[1:3])', options: ["he", "el", "ell", "hel"], answer: 1, explain: "Slicing [1:3] takes indexes 1 and 2." },
      { kind: "multi", prompt: "Which lines add 4 to the end of nums = [1, 2, 3]?", options: ["nums.append(4)", "nums.add(4)", "nums += [4]", "nums.push(4)"], answers: [0, 2], explain: "Lists use append() or +=; add() and push() don't exist on lists." },
      { kind: "reorder", prompt: "Count down from 3 and then print 'Go!'.", lines: ["n = 3", "while n > 0:", "    print(n)", "    n -= 1", 'print("Go!")'], explain: "Print and decrease inside the loop, then 'Go!' after it." },
      { kind: "bug", prompt: "This should print Ana's age. Which line breaks?", lines: ['ages = {"Ana": 30}', 'print(ages["ana"])'], bugLine: 1, explain: "Dictionary keys are case-sensitive: \"ana\" isn't \"Ana\"." },
      { kind: "fill", prompt: "Print 'big' when x is over 10, otherwise 'small'.", template: "if x > 10:\n    print(\"big\")\n___:\n    print(\"small\")", blanks: [["else"]], explain: "`else:` runs when the if condition is false." },
    ],
  },
];
