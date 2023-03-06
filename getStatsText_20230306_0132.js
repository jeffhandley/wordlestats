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

  function getPercentages(guesses) {
    let percentages = guesses.map(g => Math.floor(100 * g / stats.gamesPlayed);
    let totalPercentage = percentages.reduce((t, p) => t + p, 0);
    let light = guesses.map(g => { let p = 100 * g / stats.gamesPlayed; return p - Math.floor(p); });
    light.sort();
    light.reverse();

    for (let bump = 0; bump < 100 - totalPercentage; bump++) {
        percentages[bump < 7 ? bump : "fail"]++;
    }
    
    return percentages;
  }

  function getBar(guesses, percentages, num) {
    let count = guesses[num];
    let percent = guessPercentages[num];

    let full = "█".repeat(Math.floor(percent / 2));
    let half = percent % 2;
    let dots = "";

    if (count > 0) switch (half) {
      case 0: dots = "⠀"; break;
      case 1: dots = "▌"; break;
    }

    let plus = (num == "fail" ? !gameWon : (game.currentRowIndex == num)) ? "+" : "";
    return `${full}${half}${count}${plus} (${percent}%)`;
  }

  return `Wordle ${puzzleNum} ${(gameWon ? guesses.length : "X")}/6${settings.hardMode ? "*" : ""}
${getBoard()}
Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, guessPercentages, 1)}
2️⃣ ${getBar(stats.guesses, guessPercentages,  2)}
3️⃣ ${getBar(stats.guesses, guessPercentages,  3)}
4️⃣ ${getBar(stats.guesses, guessPercentages,  4)}
5️⃣ ${getBar(stats.guesses, guessPercentages,  5)}
6️⃣ ${getBar(stats.guesses, guessPercentages,  6)}
*️⃣ ${getBar(stats.guesses, guessPercentages, "fail")}`;
}
