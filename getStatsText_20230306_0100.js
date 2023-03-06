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

  function getBoard() {
    var guessLine = /^[⬛🟨🟩]{5}/;
    
    var guessLines = (boardShare ?? "").trim().split("\n").filter(line => line.match(guessLine));
    if (guessLines.length == 0) return "";

    return "\n" + guessLines.join("\n") + "\n";
  }

  function getBar(guesses, num) {
    let count = guesses[num];
    let percent = Math.round(100 * count / stats.gamesPlayed);

    let fours = "⠛".repeat(Math.floor(percent / 4));
    let remainder = percent % 4;
    let dots = "";

    if (count > 0) switch (remainder) {
      case 0: dots = "⠀"; break;
      case 1: dots = "⠁"; break;
      case 2: dots = "⠃"; break;
      case 3: dots = "⠋"; break;
    }

    let plus = (num == "fail" ? !gameWon : (game.currentRowIndex == num)) ? "+" : "";
    return `${fours}${dots}${count}${plus}`;
  }

  return `Wordle ${puzzleNum} ${(gameWon ? guesses.length : "X")}/6${settings.hardMode ? "*" : ""}
${getBoard()}
Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, 1)}
2️⃣ ${getBar(stats.guesses, 2)}
3️⃣ ${getBar(stats.guesses, 3)}
4️⃣ ${getBar(stats.guesses, 4)}
5️⃣ ${getBar(stats.guesses, 5)}
6️⃣ ${getBar(stats.guesses, 6)}
*️⃣ ${getBar(stats.guesses, "fail")}`;
}
