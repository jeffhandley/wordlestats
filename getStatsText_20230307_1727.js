function getStatsText(boardShare) {
  let req = new XMLHttpRequest();
  req.open("GET", "https://www.nytimes.com/svc/games/state/wordle/latest", false);
  req.send();
  
  let data = JSON.parse(req.responseText);
  let {game_data: {game, settings, stats}} = data;
  let puzzleNum = game.dayOffset;
  let gameWon = (game.status == "WIN");
  let solution = gameWon ? game.boardState[game.currentRowIndex - 1] : null;
  let guesses = game.boardState.filter(guess => !!guess);
  let guessPercentages = getPercentages(stats.guesses);

  function getBoard() {
    var guessLine = /^[⬛🟨🟩]{5}/;
    
    var guessLines = (boardShare ?? "").trim().split("\n").filter(line => line.match(guessLine));
    if (guessLines.length == 0) return "";

    return "\n" + guessLines.join("\n") + "\n";
  }

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
    
    return `${full}${part}${percent}${space}${count}${plus}`;
  }

  return `Wordle ${puzzleNum} ${(gameWon ? guesses.length : "X")}/6${settings.hardMode ? "*" : ""}
${getBoard()}
Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, guessPercentages, 1)}
2️⃣ ${getBar(stats.guesses, guessPercentages, 2)}
3️⃣ ${getBar(stats.guesses, guessPercentages, 3)}
4️⃣ ${getBar(stats.guesses, guessPercentages, 4)}
5️⃣ ${getBar(stats.guesses, guessPercentages, 5)}
6️⃣ ${getBar(stats.guesses, guessPercentages, 6)}
*️⃣ ${getBar(stats.guesses, guessPercentages, "fail")}`;
}
