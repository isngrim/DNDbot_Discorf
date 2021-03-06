var Discord = require('discord.io');
var DND = require('./dnd.js');
var fs = require('fs');
var bot = new Discord.Client({
    token: "MTk3MTg4MzI0MTQwNTE1MzI5.ClN9cA.QWf5EAxRWzWrDNDT7wHXD20Vbas",
    autorun: true
});



bot.games = {};

if (typeof String.prototype.startsWith != 'function') {
  //Implementation to startsWith starts below
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}
bot.on('ready', function() {
    console.log(bot.username + " - (" + bot.id + ")");
    loadGames(bot);
});

function roll(mssg) {
    try {
        var data = mssg.split(":");
        var num = Number(data[1]);
        var mult = 1;
        if(data[2]) {
            mult = Number(data[2]);
        }

        var output = [];
        if(mult > 100) mult = 100;
        for(var i = 0; i < mult; i++ ){
            output.push(Math.ceil(Math.random() * num).toString());
        }
        return output;
    }
    catch (err) {
        return [NaN];
    }

}

function saveGames(bot) {
    fs.writeFile('./game_data/games.json', JSON.stringify(bot.games))
}
function loadGames(bot) {
    fs.readFile('./game_data/games.json', function(err, data) {
        console.log(data.toString());
        bot.games = DND.createGames(JSON.parse(data));
    });
}

function processGame(user, userID, channelID, message, event) {
    var subcommand = message.split(/\.(.*)/)[1];
    if(!subcommand) {
        bot.sendMessage({
            to: channelID,
            message: "Invalid game command format: missing period"
        });
        return;
    }
    subcommand = subcommand.toLowerCase()
    //console.log(subcommand)
    if(subcommand.startsWith("help")) {

    }
    if(subcommand.startsWith("init") ) {
        if(!bot.games.hasOwnProperty(channelID)) {
            bot.games[channelID] = new DND.Game(channelID, bot.channels[channelID].name);
            bot.sendMessage({
                to: channelID,
                message: "Game created.  Add players now."
            });
            saveGames(bot);
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "Game already created. Game Status:"+ bot.games[channelID].state
            });
        }
    }
    else if(subcommand.startsWith("list") ) {
        //console.log(bot.games);
        for(var game in bot.games) {
            bot.sendMessage({
                to: channelID,
                message: "Game: " +bot.channels[game].name
            }); 
            //console.log(bot.games[game].players);
        }
    }
    else {
        if(bot.games.hasOwnProperty(channelID)) {
            if(subcommand.startsWith("start")) {
                bot.sendMessage({
                    to: channelID,
                    message: "Game started."
                });
                bot.games[channelID].start();
                saveGames(bot);
            }
            if(subcommand.startsWith("end") ) {
                bot.sendMessage({
                    to: channelID,
                    message: "Game ended."
                });
                bot.games[channelID].end();
                saveGames(bot);
            }
            if(subcommand.startsWith("delete") ) {
                bot.sendMessage({
                    to: channelID,
                    message: "Game deleted."
                });
                delete bot.games[channelID];
                saveGames(bot);
            }
            if(subcommand.startsWith("add-players")) {
                var players = event.d.mentions;
                for(var i=0; i < players.length; i++) {
                    var player = players[i];
                    bot.games[channelID].players[player.id] = new DND.Player(player.username, player.id);
                }
                saveGames(bot);
            }
            if(subcommand.startsWith("players")) {
                var players = bot.games[channelID].players;
                var output = "Players:\n";
                for(var player in players){
                    output += players[player].user + ": " + players[player].title + "\n"
                }
                bot.sendMessage({
                    to: channelID,
                    message: output
                })
            }
            if(subcommand.startsWith("dungeon-master")) {
                if(event.d.mentions.length == 0) {
                    output = "Dungeon Master:\n";
                    var players = bot.games[channelID].players;
                    for(var player in players) {
                        if(players[player].isDungeonMaster) {
                            output += "\t"+players[player].user + ": " + players[player].title + "\n"
                        }
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: output
                    })
                }
                else {
                    var player = event.d.mentions[0];
                    bot.games[channelID].players[player.id].isDungeonMaster = true;
                    saveGames(bot);
                }
            }
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "Game does not exist."
            }); 
        }
    }
}
bot.on('message', function(user, userID, channelID, message, event) {
    if (message.startsWith("!game")) {
        processGame(user, userID, channelID, message, event);
    }
    else if (message.startsWith("!roll") ){
        var rolls = roll(message);
        for(var i = 0; i < rolls.length; i++) {
            var aggregate = "";
            for(var j = 0; j < 10; j++) {
                if(10*i + j >= rolls.length)
                    break;
                aggregate += "Roll:\t" + rolls[i*10 + j] + "\n";
            }
            bot.sendMessage({
                to: channelID,
                message: aggregate
            });
        }
    }

});

module.exports = {bot: bot, save: saveGames, load:loadGames}
