function loadWordleStats(callback) {
  window.wordleStats = window.wordleStats || {};

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

          const boardText = `Wordle ${puzzleNum.toLocaleString()} ${(gameWon ? guesses.length : "X")}/6

${getBoard(guesses, solution)}`;

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

          window.wordleStats.boardText = boardText;
          window.wordleStats.statsText = statsText;

          window.wordleStats.possibilities = window.wordleStats.possibilities.map((p, i) => ({
            ...p,
            text: i == 0 ? `Possible Words: ${p.length.toLocaleString()}\n` : (i == 1 ? '1️⃣' : (i == 2 ? '2️⃣' : (i == 3 ? '3️⃣' : (i == 4 ? '4️⃣' : (i == 5 ? '5️⃣' : '6️⃣'))))) +
              ` ${guesses[i - 1].toUpperCase()}` + (guesses[i - 1] == solution ? '' : ` : ${p.length.toLocaleString()}` + (!p.newWords ? '' : ` (${p.newWords.length} new)`)) +
              (guesses[i - 1] == solution || !p.words || p.length > 20 ? '' : `\n${p.words.map(w => !p.usedWords || p.usedWords.indexOf(w) == -1 ? w : `~${w}~`).join(', ')}\n`)
          }));

          const possibilitiesToShow = window.wordleStats.possibilities.map(p => p.text);
          window.wordleStats.possibilitiesText = possibilitiesToShow.join('\n');

          window.wordleStats.getCurrentGuess = function getCurrentGuess() {
            return [
              ...document.querySelectorAll("div[aria-label^='Row ']:has(div[data-state='empty'],div[data-state='tbd'])")
            ].map(guess => guess.innerText.replace(/\n/g,'')).filter(guess => !!guess).map(guess => guess.toLowerCase())[0];
          };

          window.wordleStats.checkGuess = function checkGuess(guess) {
            guess = guess.toLowerCase();

            const { days_since_launch: lastPuzzleNum, print_date: lastPuzzleDate } = window.wordleStats.puzzleHistory[0];
            const match = window.wordleStats.puzzleHistory.filter(p => p.solution == guess)[0];

            const title = `As of #${lastPuzzleNum.toLocaleString()} (${lastPuzzleDate})`;

            if (match) {
              const { solution, days_since_launch: puzzleNum, print_date: puzzleDate } = match;

              return {
                title,
                text: `"${solution.toUpperCase()}" was #${puzzleNum.toLocaleString()} (${puzzleDate}).\n\nDo not play it.`
              };
            }
            else {
              return {
                title,
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
            const alphabet = '[abcdefghijklmnopqrstuvwxyz]';
            const letterMatches = Array(5).fill(alphabet);

            window.wordleStats.possibilities = [{ length: window.wordleStats.dictionary.length}];

            return guesses.map((guess, guessNum) => {
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

              const possibilities = window.wordleStats.dictionary.filter(word => patterns.map(p => word.match(p)).reduce((a, e) => a && e));
              let possibilitiesText = '';

              possibilitiesText = `${possibilities.length.toLocaleString()}`;

              window.wordleStats = window.wordleStats || {};
              window.wordleStats.possibilities[guessNum + 1] = { length: possibilities.length };

              if (possibilities.length <= 20 && guess != answer) {
                window.wordleStats.possibilities[guessNum + 1].words = possibilities.sort();

                if (!!wordleStats.puzzleHistory && wordleStats.puzzleHistory.length > 0) {
                  const solutions = wordleStats.puzzleHistory.map(p => p.solution.toLowerCase());
                  const usedPossibilities = possibilities.filter(p => solutions.indexOf(p.toLowerCase()) > -1);
                  const newPossibilities = possibilities.filter(p => solutions.indexOf(p.toLowerCase()) == -1);

                  if (newPossibilities.length != possibilities.length) {
                    possibilitiesText = `${possibilities.length.toLocaleString().padEnd(2)} ${(`(${newPossibilities.length.toLocaleString()} new)`.padStart(8))}`;

                    window.wordleStats.possibilities[guessNum + 1].newWords = newPossibilities;
                    window.wordleStats.possibilities[guessNum + 1].usedWords = usedPossibilities;
                  }
                }
              }

              window.wordleStats.possibilities[guessNum + 1].possibilitiesText = possibilitiesText;

              window.wordleStats.board = window.wordleStats.board || [];
              window.wordleStats.board[guessNum + 1] = board.join('');

              return `${board.join('')}${(possibilitiesText && guess != answer ? ` ${possibilitiesText}` : '')}`;
            }).join('\n');
          }
        }

        fetchStats.open('GET', statsUrl);
        fetchStats.send();
      }
    }
  }
}
