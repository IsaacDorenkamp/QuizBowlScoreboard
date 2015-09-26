# QuizBowlScoreboard
A useful QuizBowl scoreboard web app using AngularJS, PHP Websockets (instead of Node due to certain obstacles at the beginning of development), and MySQL databases.

Setup
=================================================================================

1. Be sure your server supports websocket connections on port 8080.
2. If so, upload the QuizBowlScoreboard folder to your server.
3. Through SSH, start app.php in the php directory.
4. You may now use the scoreboard web application to connect to the competition database system.

Note: if your server did not support websockets, you can still use the scoreboard standalone.

How to Use
=================================================================================

- Click either team name to change team names.
- Change special properties in the Properties menu.
- Left Click a score to add 5 to it.
- Right Click a score or click -5 to subtract 5 points. You cannot go below zero.
- Click +1 to add one to a score ONLY IF both teams are tied.
- Click Function -> Start Game to connect to a competition.
- Click Function -> Finalize Scores to end a game in a competition.
- Click Function -> Reset Scoreboard to reset the scoreboard.
- Find additional help in the Help menu.
