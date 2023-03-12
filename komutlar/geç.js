const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        let playingStream = require('../variables').playingStream;
        if(playingStream !==null){
            playingStream.push(null);
        }
}
}