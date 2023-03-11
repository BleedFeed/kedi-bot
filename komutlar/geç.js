const {SlashCommandBuilder} = require('discord.js');
const read = require('../utils/playingReadable');

module.exports = {
    data:new SlashCommandBuilder()
	.setName('geç')
	.setDescription('geçer'),
    async execute(interaction){
        console.log(read);
        if(read.emit !== null){
            read.emit('end');
        }
    }
}