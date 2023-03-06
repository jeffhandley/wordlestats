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
  let totalGuesses = guesses.reduce((a, g) => a + g, 0);

  function getBoard() {
    var guessLine = /^[⬛🟨🟩]{5}/;
    
    var guessLines = (boardShare ?? "").trim().split("\n").filter(line => line.match(guessLine));
    if (guessLines.length == 0) return "";

    return "\n" + guessLines.join("\n") + "\n";
  }

  function getBar(guesses, num) {
    let count = guesses[num];
    let percent = Math.round(100 * count / totalGuesses);

    let eights = "⣿".repeat(Math.floor(percent / 8));
    let remainder = percent % 8;
    let dots = "";

    if (count > 0) switch (remainder) {
      case 0: dots = "⠀"; break;
      case 1: dots = "⠁"; break;
      case 2: dots = "⠃"; break;
      case 3: dots = "⠇"; break;
      case 4: dots = "⡇"; break;
      case 5: dots = "⡏"; break;
      case 6: dots = "⡟"; break;
      case 7: dots = "⡿"; break;
    }

    let plus = (num == "fail" ? !gameWon : (game.currentRowIndex == num)) ? "+" : "";
    return `${eights}${dots}${count} (${percent}%) ${plus}`;
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
