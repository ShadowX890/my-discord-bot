const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Bot is running!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ApplicationCommandOptionType, 
    REST,
    Routes
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

// ---------------------------------------------------
// 1. ลงทะเบียนคำสั่ง Slash Command (/)
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} ออนไลน์!`);

    const commands = [
        {
            name: 'menu',
            description: 'เปิดเมนูรับของรางวัล (เฉพาะเจ้าของ)',
        },
        {
            name: 'clear',
            description: 'ลบข้อความ (เฉพาะเจ้าของ)',
            options: [
                {
                    name: 'amount',
                    description: 'จำนวนข้อความที่ต้องการลบ',
                    type: ApplicationCommandOptionType.Integer, 
                    required: true,
                },
            ],
        },
        // --- เพิ่มคำสั่ง rules ตรงนี้ ---
        {
            name: 'rules',
            description: 'ประกาศกฎระเบียบเซิร์ฟเวอร์ (เฉพาะเจ้าของ)',
            },
    ];

    try {
        console.log('⏳ กำลังลงทะเบียนคำสั่ง...');
        await client.application.commands.set(commands);
        console.log('🎉 ลงทะเบียนคำสั่งเรียบร้อย!');
    } catch (error) {
        console.error('Error:', error);
    }
});

// ---------------------------------------------------
// 2. จัดการเมื่อมีการใช้คำสั่ง / และปุ่มกด
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    
    // ==========================================
    // ส่วน A: จัดการ Slash Command (/menu, /clear, /rules)
    // ==========================================
    if (interaction.isChatInputCommand()) {
        
        // 🔥 โซนตรวจสอบสิทธิ์ (Security Check) 🔥
        // เช็คก่อนเลยว่า "คนกด" เป็น "เจ้าของห้อง" หรือไม่?
        if (interaction.user.id !== interaction.guild.ownerId) {
            
            await interaction.reply({
                content: '⛔ **ขออภัยครับ!** คุณไม่ใช่เจ้าของเซิร์ฟเวอร์ ไม่สามารถใช้คำสั่งนี้ได้',
                ephemeral: true 
            });

            setTimeout(async function () {
                try { await interaction.deleteReply(); } catch (e) { }
            }, 5000); 

            return; 
        }

        // --- คำสั่ง /rules (ประกาศกฎ) ---
        if (interaction.commandName === 'rules') {
            
            const rulesEmbed = new EmbedBuilder()
                .setColor(0x0099FF) // สีฟ้า
                .setTitle('📜 Server Rules (กฎระเบียบ)')
                .setDescription('Eng Rules:\n\n🔷 **Minor Offenses (Warning + Mute)**\nการละเมิดที่รบกวนความสงบเรียบร้อยแต่ไม่รุนแรงมาก หากทำซ้ำอาจมีบทลงโทษที่หนักขึ้น')
                .addFields(
                    { 
                        name: '• Toxicity & Disrespect', 
                        value: 'ห้ามใช้คำหยาบคาย ก้าวร้าว หรือดูหมิ่นสมาชิกและทีมงาน' 
                    },
                    { 
                        name: '• Light NSFW Remarks', 
                        value: 'ห้ามเล่นมุกตลกทางเพศ หรือพฤติกรรมที่ไม่เหมาะสม (แม้จะเล็กน้อยก็โดนเตือน)' 
                    },
                    { 
                        name: '• Channel Misuse', 
                        value: 'โปรดใช้ห้องแชทให้ถูกประเภท (เช่น อย่าถามคำถามในห้องทั่วไป)' 
                    },
                    { 
                        name: '• Spam, Flood & Chains', 
                        value: 'ห้ามสแปมข้อความ ส่งข้อความซ้ำๆ หรือส่งข้อความลูกโซ่ที่รบกวนผู้อื่น' 
                    },
                    { 
                        name: '• Encouraging Rule Breaking', 
                        value: 'ห้ามยุยง ส่งเสริม หรือล้อเลียนให้ผู้อื่นทำผิดกฎ' 
                    },
                    { 
                        name: '• Ghost Ping / Mass Ping', 
                        value: 'ห้ามแท็กแล้วลบ (Ghost Ping) หรือแท็กคนจำนวนมากเพื่อก่อกวน' 
                    }
                )
                .setFooter({ text: 'Please read and follow the rules.' });

            // ส่ง Embed ออกไป (แบบไม่ Ephemeral เพื่อให้ทุกคนเห็นกฎ)
            await interaction.reply({ embeds: [rulesEmbed] });
        }

        // --- คำสั่ง /menu ---
        if (interaction.commandName === 'menu') {
            
            const menuEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📦 ระบบแจกของรางวัล')
                .setDescription('เลือกกดปุ่มด้านล่างได้เลยครับ');

            const button1 = new ButtonBuilder()
                .setCustomId('open_secret_menu')
                .setLabel('เปิดเมนูเลือกของ')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎁');

            const button2 = new ButtonBuilder()
                .setCustomId('just_text_btn')
                .setLabel('คู่มือการใช้งาน')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('ℹ️');

            const row = new ActionRowBuilder().addComponents(button1, button2); 

            await interaction.reply({
                embeds: [menuEmbed],
                components: [row],
                ephemeral: true 
            });
        }

        // --- คำสั่ง /clear ---
        if (interaction.commandName === 'clear') {
            
            const amount = interaction.options.getInteger('amount');

            if (amount < 1 || amount > 100) {
                return interaction.reply({
                    content: '❌ ลบได้ทีละ 1-100 ข้อความครับ',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true }); 

            try {
                await interaction.channel.bulkDelete(amount, true);
                await interaction.editReply(`🧹 ลบข้อความ ${amount} ข้อความเรียบร้อย!`);
            } catch (error) {
                await interaction.editReply('❌ ลบไม่ได้ (ข้อความอาจเก่าเกิน 14 วัน)');
            }
        }
    }

    // ==========================================
    // ส่วน B: จัดการปุ่มกดและเมนู (Interaction)
    // ==========================================
    if (interaction.isButton()) {
        if (interaction.customId === 'open_secret_menu') {
            const select = new StringSelectMenuBuilder()
                .setCustomId('select_item')
                .setPlaceholder('🔻 จิ้มเพื่อเลือกไอเทม...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('ดาบ').setValue('sword').setEmoji('⚔️'),
                    new StringSelectMenuOptionBuilder().setLabel('โล่').setValue('shield').setEmoji('🛡️'),
                    new StringSelectMenuOptionBuilder().setLabel('ยา').setValue('potion').setEmoji('🧪'),
                );
            const row = new ActionRowBuilder().addComponents(select);

            await interaction.reply({
                content: 'เลือกรายการที่ต้องการได้เลยครับ:',
                components: [row],
                ephemeral: true 
            });
        }

        if (interaction.customId === 'just_text_btn') {
            await interaction.reply({
                content: '📚 **คู่มือ:** กดปุ่มเขียวเพื่อเลือกของ (ข้อความนี้จะหายใน 10 วิ)',
                ephemeral: true 
            });
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) {}
            }, 10000);
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_item') {
            const selectedValue = interaction.values[0];
            let responseText = '';
            if (selectedValue === 'sword') responseText = 'คุณเลือก ⚔️ **ดาบ**';
            if (selectedValue === 'shield') responseText = 'คุณเลือก 🛡️ **โล่**';
            if (selectedValue === 'potion') responseText = 'คุณเลือก 🧪 **ยา**';

            await interaction.update({
                content: `${responseText}`,
                components: [],
                embeds: []
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);