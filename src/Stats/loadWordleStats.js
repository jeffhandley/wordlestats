let getNumberBlock = (num) =>
  num == 1 ? '1️⃣':
  num == 2 ? '2️⃣':
  num == 3 ? '3️⃣':
  num == 4 ? '4️⃣':
  num == 5 ? '5️⃣':
  num == 6 ? '6️⃣':
             '⛔';

function loadWordleStats(callback) {
  window.wordleStats = window.wordleStats || {};

  if (!callback || typeof callback != 'function') {
    callback = () => {};
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().substr(0, 10);

  if (!window.wordleStats.dictionary) {
    const dictionaryUrl = `https://raw.githubusercontent.com/jeffhandley/wordle-stats/refs/heads/main/src/Stats/dictionary.json?${nowIso}`;

    const fetchDictionary = new XMLHttpRequest();
    const fetchDictionaryError = () => callback(`Failed to fetch the dictionary from '${dictionaryUrl}'`);
    fetchDictionary.onerror = fetchDictionaryError;
    fetchDictionary.onload = () => {
      if (fetchDictionary.readyState != XMLHttpRequest.DONE || fetchDictionary.status != 200) {
        return fetchDictionaryError();
      }

      window.wordleStats.dictionary = JSON.parse(fetchDictionary.responseText);
      dictionaryContinuation();
    };

    fetchDictionary.open('GET', dictionaryUrl);
    fetchDictionary.send();
  }
  else {
    dictionaryContinuation();
  }

  function dictionaryContinuation() {
    if (!window.wordleStats.puzzleHistory) {
      const puzzleHistoryUrl = `https://raw.githubusercontent.com/jeffhandley/wordle-stats/refs/heads/main/src/PuzzleCollector/puzzles.json?${nowIso}`;
      const fetchPuzzleHistory = new XMLHttpRequest();
      const fetchPuzzleHistoryError = () => callback(`Failed to fetch puzzle history from '${puzzleHistoryUrl}'`);
      fetchPuzzleHistory.onerror = fetchPuzzleHistoryError;
      fetchPuzzleHistory.onload = () => {
        if (fetchPuzzleHistory.readyState != XMLHttpRequest.DONE || fetchPuzzleHistory.status != 200) {
          return fetchPuzzleHistoryError();
        }

        window.wordleStats.puzzleHistory = JSON.parse(fetchPuzzleHistory.responseText);
        puzzleHistoryContinuation();
      };

      fetchPuzzleHistory.open('GET', puzzleHistoryUrl);
      fetchPuzzleHistory.send();
    }
    else {
      puzzleHistoryContinuation();
    }

    function puzzleHistoryContinuation() {
      const lastPuzzle = window.wordleStats.puzzleHistory[0];
      const displayElement = document.querySelector("button[aria-label='Subscribe to Games'] span");

      if (displayElement) {
        displayElement.innerText = `${lastPuzzle.print_date} (#${lastPuzzle.days_since_launch})`;
      }

      if (!window.wordleStats.todaysPuzzle) {
        const todaysPuzzleUrl = `https://www.nytimes.com/svc/wordle/v2/${todayIso}.json`;
        const fetchTodaysPuzzle = new XMLHttpRequest();
        const fetchTodaysPuzzleError = () => callback(`Failed to fetch today's puzzle from '${todaysPuzzleUrl}'`);
        fetchTodaysPuzzle.onerror = fetchTodaysPuzzleError;
        fetchTodaysPuzzle.onload = () => {
          if (fetchTodaysPuzzle.readyState != XMLHttpRequest.DONE || fetchTodaysPuzzle.status != 200) {
            return fetchTodaysPuzzleError();
          }

          const todaysPuzzleData = JSON.parse(fetchTodaysPuzzle.responseText);

          window.wordleStats.todaysPuzzle = {
            solution: todaysPuzzleData.solution,
            puzzleId: todaysPuzzleData.id,
            puzzleNum: todaysPuzzleData.days_since_launch,
            puzzleDate: todaysPuzzleData.print_date
          };

          todaysPuzzleContinuation();
        };

        fetchTodaysPuzzle.open('GET', todaysPuzzleUrl);
        fetchTodaysPuzzle.send();
      }
      else {
        todaysPuzzleContinuation();
      }

      function todaysPuzzleContinuation() {
        const { solution, puzzleId, puzzleNum, puzzleDate } = window.wordleStats.todaysPuzzle;
        const statsUrl = `https://www.nytimes.com/svc/games/state/wordleV2/latests?puzzle_ids=${puzzleId}`;
        const fetchStats = new XMLHttpRequest();
        const fetchStatsError = () => callback(`Failed to fetch stats from '${statsUrl}'`);
        fetchStats.onerror = fetchStatsError;
        fetchStats.onload = () => {
          if (fetchStats.readyState != XMLHttpRequest.DONE || fetchStats.status != 200) {
            return fetchStatsError();
          }

          const statsJson = JSON.parse(fetchStats.responseText);

          const {
              states: [ { game_data: game }],
              player: { stats: { wordle: { legacyStats: stats } } }
          } = statsJson;

          const gameWon = (game.status == 'WIN');
          const guesses = game.boardState.filter(guess => guess != '');
          const guessPercentages = getPercentages(stats.guesses);

          window.wordleStats.getBoard = (optGuesses, optSolution) =>
            getBoard(optGuesses || guesses, optSolution || solution).board;

          window.wordleStats.getBoardText = (useHashtag) =>
            (useHashtag ? '#' : '') + `Wordle ${puzzleNum.toLocaleString()} ${(gameWon ? guesses.length : "X")}/6\n\n` +
            getBoard(guesses, solution).board;

          window.wordleStats.boardText = window.wordleStats.getBoardText();

          window.wordleStats.getStats = () =>
            [1, 2, 3, 4, 5, 6, 'fail']
            .map(num => getNumberBlock(num) + ' ' + getBar(stats.guesses, guessPercentages, num))
            .join('\n');

          window.wordleStats.getStatsText = () =>
            `Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}\n\n` +
            window.wordleStats.getStats();

          window.wordleStats.statsText = window.wordleStats.getStatsText();

          window.wordleStats.getBoardAndStatsText = () =>
            window.wordleStats.getBoardText(true) + '\n\n' +
            window.wordleStats.getStatsText();

          window.wordleStats.boardAndStatsText = window.wordleStats.getBoardAndStatsText();

          window.wordleStats.getPossibilities = (optGuesses, optSolution) => {
            optGuesses = (optGuesses || guesses).map(g => g.toLowerCase().trim());
            optSolution = (optSolution || solution).toLowerCase().trim();
            const { possibilities } = getBoard(optGuesses, optSolution);

            const totalPossibilities = possibilities[0].length;
            const newPossibilities = totalPossibilities - window.wordleStats.puzzleHistory.length;

            const possibilitiesTitle = `Possible Words: ${totalPossibilities.toLocaleString()} (${newPossibilities.toLocaleString()} new)`;

            const possibilitiesText = possibilities.map((p, i) => ({
              ...p,
              text: (i == 0 ? '' : `${getNumberBlock(i)} ${optGuesses[i - 1].toUpperCase()}`) +
                (optGuesses[i - 1] == optSolution ? '' : ` : ${p.length.toLocaleString()}` + (!p.newWords ? '' : ` (${p.newWords.length} new)`)) +
                (optGuesses[i - 1] == optSolution || !p.words || p.length > 20 ? '' : `\n${p.words.map(w => !p.usedWords || p.usedWords.indexOf(w) == -1 ? w : `~${w}~`).join(', ')}\n`)
            })).filter((p, i) => i > 0).map(p => p.text).join('\n');

            return {
              title: possibilitiesTitle,
              text: possibilitiesText
            };
          }

          window.wordleStats.getCurrentGuess = () =>
            [...document.querySelectorAll("div[aria-label^='Row ']:has(div[data-state='empty'],div[data-state='tbd'])")]
            .map(guess => guess.innerText.replace(/\n/g,'')).filter(guess => !!guess).map(guess => guess.toLowerCase())[0];

          window.wordleStats.checkGuess = (guess) => {
            guess = guess.toLowerCase().trim();

            const { days_since_launch: lastPuzzleNum, print_date: lastPuzzleDate } = window.wordleStats.puzzleHistory[0];
            const match = window.wordleStats.puzzleHistory.filter(p => p.solution == guess)[0];

            const guessCheckTitle = `As of #${lastPuzzleNum.toLocaleString()} (${lastPuzzleDate})`;

            if (match) {
              const { solution, days_since_launch: puzzleNum, print_date: puzzleDate } = match;

              return {
                title: guessCheckTitle,
                text: `"${solution.toUpperCase()}" was #${puzzleNum.toLocaleString()} (${puzzleDate}).\n\nDo not play it.`
              };
            }
            else {
              return {
                title: guessCheckTitle,
                text: `"${guess.toUpperCase()}" has not been used.`
              };
            }
          };

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

            window.wordleStats.stats = window.wordleStats.stats || [];
            window.wordleStats.stats[num] = `${full}${part}${percent}${space}${count.toLocaleString()}${plus}`;

            return window.wordleStats.stats[num];
          }

          function getBoard(guesses, answer) {
            guesses = guesses.map(g => g.toLowerCase().trim());
            answer = answer.toLowerCase().trim();

            const alphabet = '[abcdefghijklmnopqrstuvwxyz]';
            const letterMatches = Array(5).fill(alphabet);

            const possibilities = [{ length: window.wordleStats.dictionary.length}];

            const boardText = guesses.map((guess, guessNum) => {
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

              const remainingWords = window.wordleStats.dictionary.filter(word => patterns.map(p => word.match(p)).reduce((a, e) => a && e));
              let possibilitiesText = '';

              possibilitiesText = `${remainingWords.length.toLocaleString()}`;

              possibilities[guessNum + 1] = { length: remainingWords.length };

              if (guess != answer) {
                possibilities[guessNum + 1].words = remainingWords.sort();

                if (!!wordleStats.puzzleHistory && wordleStats.puzzleHistory.length > 0) {
                  const solutions = wordleStats.puzzleHistory.map(p => p.solution.toLowerCase());
                  const usedPossibilities = remainingWords.filter(p => solutions.indexOf(p.toLowerCase()) > -1);
                  const newPossibilities = remainingWords.filter(p => solutions.indexOf(p.toLowerCase()) == -1);

                  if (newPossibilities.length != remainingWords.length) {
                    possibilitiesText = `${remainingWords.length.toLocaleString().padEnd(4)} ${(`(${newPossibilities.length.toLocaleString()} new)`.padStart(10))}`;

                    possibilities[guessNum + 1].newWords = newPossibilities;
                    possibilities[guessNum + 1].usedWords = usedPossibilities;
                  }
                }
              }

              possibilities[guessNum + 1].possibilitiesText = possibilitiesText;

              return `${board.join('')}${(possibilitiesText && guess != answer ? ` ${possibilitiesText}` : '')}`;
            }).join('\n');

            return {
              board: boardText,
              possibilities
            };
          }
        }

        fetchStats.open('GET', statsUrl);
        fetchStats.send();
      }
    }
  }
}
