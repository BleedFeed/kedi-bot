const nodeshout = require("nodeshout-napi");
let shout;

module.exports = {
    init(){
        nodeshout.init();

        // Create a shout instance
        shout = nodeshout.create();
        
        // Configure it
        shout.setHost('localhost');
        shout.setPort(8000);
        shout.setUser('source');
        shout.setPassword('password');
        shout.setMount('mount');
        shout.setFormat(1); // 0=ogg, 1=mp3
        shout.setAudioInfo('bitrate', '192');
        shout.setAudioInfo('samplerate', '44100');
        shout.setAudioInfo('channels', '2');
        if (shout.open() !== nodeshout.ErrorTypes.SUCCESS)
        {
        throw 0;
        }
    },
    getShout(){
        return shout;
    }
}



