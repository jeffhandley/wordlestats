using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;

DateOnly firstPuzzle = new(2021, 6, 19);
string answerUrlRoot = "https://www.nytimes.com/svc/wordle/v2/";
string puzzlesFile = "./puzzles.json";

DateTime utcNow = DateTime.UtcNow;
TimeZoneInfo pst = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
DateOnly todayPST = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcNow, pst));

Puzzle[] savedPuzzles = [];

if (File.Exists(puzzlesFile))
{
    string puzzlesJson = File.ReadAllText(puzzlesFile);
    savedPuzzles = JsonSerializer.Deserialize<Puzzle[]>(puzzlesJson) ?? [];
}

using HttpClient client = new HttpClient();

List<Puzzle> downloadedPuzzles = new();
int count = 0;

for (DateOnly date = firstPuzzle; date <= todayPST && count < 100; date = date.AddDays(1))
{
    if (!savedPuzzles.Any(p => p.print_date == date))
    {
        HttpResponseMessage response = await client.GetAsync($"{answerUrlRoot}/{date.ToString("yyyy-MM-dd")}.json");
        count++;

        if (response.IsSuccessStatusCode)
        {
            string puzzleJson = await response.Content.ReadAsStringAsync();
            Puzzle? puzzle = JsonSerializer.Deserialize<Puzzle>(puzzleJson);

            if (puzzle is not null)
            {
                downloadedPuzzles.Add(puzzle);
                Console.WriteLine($"{count, -4}: Collected puzzle {date.ToString("yyyy-MM-dd")}");
            }
        }
        else
        {
            Console.WriteLine($"{count, -4}: Failed to download puzzle {date.ToString("yyyy-MM-dd")}");
        }
    }
}

downloadedPuzzles.AddRange(savedPuzzles);

string newPuzzlesJson = JsonSerializer.Serialize(downloadedPuzzles.OrderByDescending(p => p.print_date))
    .Replace("{", "\n  { ")
    .Replace("\":", "\": ")
    .Replace(",\"", ", \"")
    .Replace("]", "\n]")
    .Replace("}", " }");

File.WriteAllText(puzzlesFile, newPuzzlesJson);

public class Puzzle
{
    public required string solution { get; set; }
    public required DateOnly print_date { get; set; }
    public int days_since_launch { get; set; } = 0;
}
