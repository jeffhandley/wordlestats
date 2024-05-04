function getStatsText(callback, boardShare) {
  const today = new Date().toISOString().substr(0, 10);
  const puzzleUrl = `https://www.nytimes.com/svc/wordle/v2/${today}.json`;
  const puzzleReq = new XMLHttpRequest(); puzzleReq.open('GET', puzzleUrl);
  puzzleReq.onload = () => puzzleReq.readyState == XMLHttpRequest.DONE && puzzleReq.status == 200 && puzzleDataLoaded();
  puzzleReq.send();

  function puzzleDataLoaded() {
    const puzzleData = JSON.parse(puzzleReq.responseText);
    const puzzleNum = puzzleData['id'];

    const statsUrl = `https://www.nytimes.com/svc/games/state/wordleV2/latests?puzzle_ids=${puzzleNum}`;
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

        const statsText = `#Wordle ${puzzleNum.toLocaleString()} ${(gameWon ? guesses.length : "X")}/6${game.hardMode ? " (hard mode)" : ""}
${getBoard()}
Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, guessPercentages, 1)}
2️⃣ ${getBar(stats.guesses, guessPercentages, 2)}
3️⃣ ${getBar(stats.guesses, guessPercentages, 3)}
4️⃣ ${getBar(stats.guesses, guessPercentages, 4)}
5️⃣ ${getBar(stats.guesses, guessPercentages, 5)}
6️⃣ ${getBar(stats.guesses, guessPercentages, 6)}
*️⃣ ${getBar(stats.guesses, guessPercentages, "fail")}`;

        callback(statsText);

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

  function getBoard() {
    var guessLine = /^[⬛🟨🟩]{5}/;

    var guessLines = (boardShare ?? "").trim().split("\n").filter(line => line.match(guessLine));
    if (guessLines.length == 0) return "";

    return "\n" + guessLines.join("\n") + "\n";
  }
}
