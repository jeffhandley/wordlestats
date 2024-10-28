function getStats(callback) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().substr(0, 10);
  const puzzleUrl = `https://www.nytimes.com/svc/wordle/v2/${today}.json`;
  const puzzleReq = new XMLHttpRequest(); puzzleReq.open('GET', puzzleUrl);
  puzzleReq.onload = () => puzzleReq.readyState == XMLHttpRequest.DONE && puzzleReq.status == 200 && puzzleDataLoaded();
  puzzleReq.send();

  function puzzleDataLoaded() {
    const puzzleData = JSON.parse(puzzleReq.responseText);
    const { id: puzzleId, days_since_launch: puzzleNum } = puzzleData;

    const statsUrl = `https://www.nytimes.com/svc/games/state/wordleV2/latests?puzzle_ids=${puzzleId}`;
    const statsReq = new XMLHttpRequest(); statsReq.open('GET', statsUrl);

    statsReq.onload = () =>
      statsReq.readyState == XMLHttpRequest.DONE && statsReq.status == 200 && (function statsDataLoaded() {
        const statsData = JSON.parse(statsReq.responseText);

        const {
            states: [ { game_data: game }],
            player: { stats: { wordle: { legacyStats: stats } } }
        } = statsData;

        const gameWon = (game.status == 'WIN');
        const { solution } = puzzleData;
        const guesses = game.boardState.filter(guess => guess != '');
        const guessPercentages = getPercentages(stats.guesses);

        const statsText = `#Wordle ${puzzleNum.toLocaleString()} ${(gameWon ? guesses.length : "X")}/6

${getBoard(guesses, solution)}

Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, guessPercentages, 1)}
2️⃣ ${getBar(stats.guesses, guessPercentages, 2)}
3️⃣ ${getBar(stats.guesses, guessPercentages, 3)}
4️⃣ ${getBar(stats.guesses, guessPercentages, 4)}
5️⃣ ${getBar(stats.guesses, guessPercentages, 5)}
6️⃣ ${getBar(stats.guesses, guessPercentages, 6)}
⛔ ${getBar(stats.guesses, guessPercentages, "fail")}`;

        window.wordleStats = window.wordleStats || {};
        window.wordleStats.statsText = statsText;

        callback(window.wordleStats);

        function getPercentages(guessStats) {
          let percentages = Object.keys(guessStats)
            .map(g => ({key: g, value: Math.floor(100 * guessStats[g] / stats.gamesPlayed)}))
            .reduce((a, p) => ({ ...a, [p.key]: p.value }), {} );

          let totalPercentage = Object.keys(percentages).reduce((t, p) => t + percentages[p], 0);

          while (totalPercentage < 100) {
            let light = Object.keys(percentages)
              .map(g => { let p = 100 * guessStats[g] / stats.gamesPlayed; return { key: g, value: p - Math.floor(p) }; })
              .sort((a, b) => a.value < b.value ? -1 : a.value == b.value ? 0 : 1);

            while (light.length > 0 && totalPercentage++ < 100) {
              percentages[light.pop().key]++;
            }
          }

          return percentages;
        }

        function getBar(guesses, percentages, num) {
          let count = guesses[num];
          let percentage = guessPercentages[num];

          let full = "⠿".repeat(Math.floor(percentage / 3));
          let part = "";

          // https://www.fileformat.info/info/unicode/block/braille_patterns/list.htm
          switch (percentage % 3) {
            case 0: part = ""; break;
            case 1: part = "⠒"; break;
            case 2: part = "⠗"; break;
          }

          let percent = count > 0 ? ` [${percentage}﹪]` : "";
          let space = count > 0 ? " " : "";
          let plus = (num == "fail" ? !gameWon : (game.currentRowIndex == num)) ? "+" : "";

          return `${full}${part}${percent}${space}${count.toLocaleString()}${plus}`;
        }
      })();

    statsReq.send();
  }

  function getBoard(guesses, answer) {
    const alphabet = '[abcdefghijklmnopqrstuvwxyz]';
    const letterMatches = Array(5).fill(alphabet);

    return guesses.map(guess => {
      const board = Array(5).fill('⬛'),
            guessLetterUsed = Array(5).fill(false),
            answerLetterUsed = Array(5).fill(false),
            letterCounts = {};

      for (let correct = 0; correct < answer.length && correct < guess.length; correct++) {
        if (answer[correct] == guess[correct]) {
          board[correct] = '🟩';
          guessLetterUsed[correct] = true;
          answerLetterUsed[correct] = true;
          letterMatches[correct] = answer[correct];
          letterCounts[answer[correct]] = ((letterCounts[answer[correct]]) ?? 0) + 1;
        }
      }

      for (let g = 0; g < guess.length; g++) {
        if (!guessLetterUsed[g]) {
          for (let a = 0; a < answer.length; a++) {
            if (!answerLetterUsed[a] && answer[a] == guess[g]) {
              board[g] = '🟨';
              guessLetterUsed[g] = true;
              answerLetterUsed[a] = true;

              // Disallow this letter in this place
              letterMatches[g] = letterMatches[g].replace(guess[g], '');

              // Keep track of how many times each letter must appear
              letterCounts[guess[g]] = ((letterCounts[guess[g]]) ?? 0) + 1;

              break; // only capture the first match
            }
          }

          // if this letter is incorrect, then rule it out from this space
          // and if the letter doesn't appear elsewhere, rule it out completely
          if (!guessLetterUsed[g]) {
            letterMatches[g] = letterMatches[g].replace(guess[g], '');

            if ((letterCounts[guess[g]] ?? 0) == 0) {
              for (let l = 0; l < letterMatches.length; l++) {
                letterMatches[l] = letterMatches[l].replace(guess[g], '');
              }
            }
          }
        }
      }

      const patterns = [
        new RegExp(`^${letterMatches.join('')}$`),
        ...[...Object.keys(letterCounts)].map(l => l.repeat(letterCounts[l]).split('').join('.*'))
      ];

      const possibilities = dictionary.filter(word => patterns.map(p => word.match(p)).reduce((a, e) => a && e));
      let newPossibilities = [...possibilities];
      let possibilitiesText = '';

      if (guess != answer) {
        window.wordleStats = window.wordleStats || {};
        window.wordleStats.possibilities = possibilities;
        possibilitiesText = ` ${possibilities.length.toLocaleString()}`;

        if (!!wordleStats.puzzles && wordleStats.puzzles.length > 0) {
          const solutions = wordleStats.puzzles.map(p => p.solution.toLowerCase());
          newPossibilities = newPossibilities.filter(p => solutions.indexOf(p.toLowerCase()) == -1);
          possibilitiesText = ` ${newPossibilities.length.toLocaleString()}/${possibilities.length.toLocaleString()}`;

          window.wordleStats.newPossibilities = newPossibilities;
        }
      }

      return `${board.join('')}${possibilitiesText}`;
    }).join('\n');
  }
}
