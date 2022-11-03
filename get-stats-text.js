fetch("https://www.nytimes.com/svc/games/state/wordle/latest")
    .then(response => response.json())
    .then(data => {
        let {game_data: {game, settings, stats}} = data;

        let puzzleNum = game.id;
        let solution = game.status == "WIN" ? game.boardState[game.currentRowIndex - 1] : null;
        let guesses = game.boardState.filter(guess => !!guess);
        
        function getBlocks(guess, num) {
          return guess.map(l => l == "correct" ? "🟩" : (l == "present" ? "🟨" : "⬛️")).join("");
        }

        function getBoard(guesses) {
          return guesses.filter(guess => !!guess).map(getBlocks).join("\n");
        }

        function getBar(guesses, num) {
          let count = guesses[num];
          let eights = "⣿".repeat(Math.floor(count/8));
          let remainder = count % 8;
          let dots = "";

          if (count > 0) {
            switch (remainder) {
              case 0:
                  dots = " ";
                  break;
              case 1:
                  dots = "⠁";
                  break;
              case 2:
                  dots = "⠃";
                  break;
              case 3:
                  dots = "⠇";
                  break;
              case 4:
                  dots = "⡇";
                  break;
              case 5:
                  dots = "⡏";
                  break;
              case 6:
                  dots = "⡟";
                  break;
              case 7:
                  dots = "⡿";
                  break;
            }
          }

          let plus = (num == "fail" ? (game.status != "WIN") : (game.currentRowIndex == num)) ? "+" : "";
          return `${eights}${dots}${count}${plus}`;
        }

        let share = //`Wordle ${puzzleNum} ${game.currentRowIndex}/6${settings.hardMode ? "*" : ""}
`

Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, 1)}
2️⃣ ${getBar(stats.guesses, 2)}
3️⃣ ${getBar(stats.guesses, 3)}
4️⃣ ${getBar(stats.guesses, 4)}
5️⃣ ${getBar(stats.guesses, 5)}
6️⃣ ${getBar(stats.guesses, 6)}
*️⃣ ${getBar(stats.guesses, "fail")}`;

        completion(share);
    });
