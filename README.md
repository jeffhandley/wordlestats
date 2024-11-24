# WordleStats - Enlightenment shortcuts for playing Wordle on iOS Safari

The WordleStats shortcuts can be added to iOS and used when playing the official [New York Times Wordle](https://www.nytimes.com/games/wordle/index.html) game in the Safari browser. WordleStats offers enhancements to the game experience and an enriched sharing experience.

## Shortcuts

### Share with WordleStats

Instead of using the Share button built into Wordle, the 'Share with WordleStats' shortcut can be used to enhance the content shared from the game. The enhancements include showing your all-time game statistics, current and max win streaks, and how many possible words remained after each of your guesses. The shortcut asks whether to share only the game, only your stats, or both.

Here's an example of what gets shared via WordleStats:

#Wordle 1,252 4/6*

⬛⬛⬛⬛⬛ 4,223 (3,850 new)
⬛🟨⬛⬛⬛ 375     (319 new)
⬛🟨🟨🟨⬛ 40       (35 new)
🟩🟩🟩🟩🟩

Games: 729 | Streak: 109 | Max: 151

1️⃣ 0
2️⃣ ⠿⠒ [4﹪] 31
3️⃣ ⠿⠿⠿⠿⠿⠿⠿⠿⠿ [27﹪] 198
4️⃣ ⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠗ [44﹪] 320+
5️⃣ ⠿⠿⠿⠿⠿⠿⠗ [20﹪] 144
6️⃣ ⠿ [3﹪] 24
⛔ ⠗ [2﹪] 12

### Check Guess with WordleStats

Do you wish that Wordle would warn you if a guess has already appeared as a previous solution? The 'Check Guess with WordleStats' shortcut does just that!

Enter your guess into the Wordle game and invoke the shortcut. A message will be shown indicating whether the pending guess has already been used. Alternatively, if you invoke the shortcut before entering your guess into the game, you can type your guess into a prompt first. This can be helpful if you want to be extra careful about entering your guess.

### Show Possibilities with WordleStats

After finishing a game, I love to see what other words were possibilities as I was narrowing it down to the solution. The 'Show Possibilities with WordleStats' shortcut figures this out and shows them on the screen. Words that have already appeared as Wordle solutions are indicated.

Note that this shortcut can be used to gain a cheat in the game. If you invoke this shortcut before the game is over, the remaining possibilities will be shown. While I don't use the shortcut in this manner, the capability is there.

Words are shown for each guess were 25 or fewer possibilities remained. There's an additional 'Show More Possibilities with WordleStats' shortcut that prompts for the maximum word count.

## How it Works

The WordleStats shortcuts use JavaScript to interact with the Wordle game in a non-invasive manner. None of the game play or actual game functionality is altered.

The game board state and player stats are extracted from the game's UI and by making web requests to the same data endpoints the game itself uses.

* https://www.nytimes.com/svc/wordle/v2/2024-11-23.json exposes the `solution`, `print_date`, `days_since_launch` (puzzle number) for the puzzle that day, along with an `id` and that puzzle's `editor`.
* The `id` value in that data is a reference number to retrieve the player's board state and stats as of that puzzle. For that date, the `id` value is `1098`, which is then used in the next web request.
* https://www.nytimes.com/svc/games/state/wordleV2/latests?puzzle_ids=1098 exposes the `boardState` and `legacyStats`.

Other game data might be included in the `games/state` response, depending on which NYTimes games you play. The requests to these addresses must be made using JavaScript injected into the Wordle game's page so that the requests include the appropriate cookies and referrer on the request.

In addition to loading data from the Wordle game itself, WordleStats also provides some of its own data. The full dictionary of legal Wordle words is saved in this repository at [`src/Stats/dictionary.json`](/jeffhandley/wordlestats/blob/main/src/Stats/dictionary.json). To power the WordleStats features that understand what words have already appeared as solutions, the history of all puzzles is also included in this repository at **SPOILER WARNING** [`src/PuzzleCollector/puzzles.json`](/jeffhandley/wordlestats/blob/main/src/PuzzleCollector/puzzles.json). Both of these sets of data are downloaded when running the shortcuts.

With this design for the shortcuts, permissions must be granted when using them for the first time. You will be prompted to allow the shortcut to download data from `https://raw.githubusercontent.com`, and also to interact with `https://www.nytimes.com/`. Both requests must be granted for the shortcuts to work.

If you'd like to review the JavaScript code that drives all of the functionality, check out [`src/Stats/loadWordleStats.js`](/jeffhandley/wordlestats/blog/main/src/Stats/loadWordleStats.js). Note that this code is written to be compatible with iOS Safari. Unfortunately, `async`/`await` and `fetch` are not available, so classic `XMLHttpRequest` and `JSON.parse` code is needed.

Each day's puzzle is collected into this repository using a GitHub Action that invokes the [`src/PuzzleCollector/Program.cs`](PuzzleCollector) console application written in C#/.NET.
