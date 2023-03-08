const {Client, ActivityType} = require('discord.js');

let playing = {title:null};

module.exports = {
    playing,
    set(song,client){
        playing.title = song.title;
        client.user.setActivity(song.title, { type: ActivityType.Watching });
    }
}