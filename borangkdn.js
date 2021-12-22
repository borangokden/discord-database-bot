const { Client, MessageEmbed } = require("discord.js");
const client = new Client({ fetchAllMembers: true });
const config = require("./config.json");
const db = require("quick.db");
const fs = require("fs")
const moment = require("moment");
moment.locale("tr")

let danger = false

client.on("rateLimit", function (RateLimitData) {
    console.log("RATE LIMIT WARN AZ BEKLE KENDİME GELEYİM BRO!", RateLimitData)
})

client.on("ready", () => {
    client.user.setPresence({ activity: { name: (config.bot.Durum), type: "PLAYING" }, status: "online" });
     if (config.channels.SesKanalıID) client.channels.cache.get(config.channels.SesKanalıID).join();
    if (danger) console.log("Danger mod aktif!")
    if (danger !== true) {
        RoleBackup()
        setInterval(() => {
            RoleBackup()
        }, 1000 * 60 * 60);//? 1 saatte bir alır süreyi değiştirebilirsiniz (1000 = 1 saniye)
    }
});

client.on("message", message => {
    let prefix = config.bot.prefix.find((x) => message.content.toLowerCase().startsWith(x));
    if (!config.bot.owners.includes(message.author.id) || !prefix || !message.guild) return;
    let args = message.content.split(' ').slice(1);
    let command = message.content.split(' ')[0].slice(prefix.length);
    let embed = new MessageEmbed().setColor(message.member.displayHexColor).setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(config.bot.Footer).setTimestamp();

    if (command === "backup-al") {
        RoleBackup();
        message.channel.send(embed.setDescription(`Veri tabanı rol verisine kaydedildi.`))
    }

    if (command === "eval") {
        if (!args[0]) return message.channel.send(`Kod belirtmelisin!`);
        let code = args.join(' ');
        function clean(text) {
            if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
            text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
            return text;
        };
        try {
            var evaled = clean(eval(code));
            if (evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
            message.channel.send(`${evaled.replace(client.token, "ytb matthe tokeni alamazsin oc")}`, { code: "js", split: true });
        } catch (err) { message.channel.send(err, { code: "js", split: true }) };
    };

    if (command === "backup-kur") {
        const ıd = args[0]
            if (!ıd) return message.channel.send(embed.setDescription("Rol ID'si belirtmelisin."))
        const RoleDatabase = db.get(`rolebackup_${message.guild.id}_${ıd}`);
      if (!RoleDatabase) return message.channel.send(embed.setDescription("Rol ID'si belirtmelisin."))
        const RoleMembers = db.get(`rolemembers_${message.guild.id}_${ıd}`)
        message.guild.roles.create({
            data: {
                name: RoleDatabase.name,
                color: RoleDatabase.color,
                hoist: RoleDatabase.hoist,
                position: RoleDatabase.position,
                permissions: RoleDatabase.permler,
            }
        }).then(newRole => {
            message.channel.send(embed.setDescription(`${message.author} yöneticisi **${newRole}** - **${newRole.id}** rolünün datasını kurdu.`))
            client.channels.cache.get(config.channels.BackupLog).send(embed.setDescription(`${message.author} yöneticisi **${newRole}** - **${newRole.id}** rolünün datasını kurdu.`))
            if (!RoleMembers) return console.log(`${newRole.name} olayında veri tabanına kayıtlı kullanıcı olmadığı için rol dağıtımı iptal edildi.`)
            RoleMembers.forEach(member => {
                if (!member) return console.log(`${member.user.username} kullanıcısını sunucuda bulamadığım için ${newRole.name} rolü verilemedi.`)
                message.guild.members.cache.get(member).roles.add(newRole.id).then(x => console.log(`${client.users.cache.get(member).username} kullanıcısı ${newRole.name} rolünü aldı.`)).catch(err => console.log(`${err} sebebiyle ${client.users.cache.get(member).username} kullanıcısı ${newRole.name} rolünü alamadı!`))
            })
        })


    }
})

async function RoleBackup() {
    client.guilds.cache.get(config.Guild.SunucuID).roles.cache.filter(e => !e.managed).forEach(async role => {
        db.set(`rolebackup_${role.guild.id}_${role.id}`, {
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.rawPosition,
            permler: role.permissions,
            mentionable: role.mentionable,
        })
        db.set(`rolemembers_${role.guild.id}_${role.id}`, role.members.map(e => e.id))
    })
    let rolsize = client.guilds.cache.get(config.Guild.SunucuID).roles.cache.filter(rls => rls.name !== "@everyone").size
    console.log(`${moment(Date.now()).format("LLL")} Tarihinde başarıyla ${rolsize} rolün data alma işlemi gerçekleştirildi.`)
}

client.on("roleDelete", role => {
    client.channels.cache.get(config.channels.BackupLog).send(`@everyone bir kullanıcı **${role.name}** - **${role.id}** rolünü sildi.`)
})

client.login(config.bot.token).then(x => console.log(`Bot ${client.user.username} olarak giriş yaptı`)).catch(err => console.log(`Bot Giriş yapamadı! Sebep: ${err}`));
