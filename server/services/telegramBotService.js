import { Telegraf, Markup } from 'telegraf';
import { pool } from '../utils/dbUtils.js';
import { runAiAgent } from './aiAgentService.js';
import { generateGroupExcelBuffer } from '../utils/excelGenerator.js';
import { processReceiptImage } from './receiptService.js';
import moment from 'moment';
import axios from 'axios';

let bot;

/**
 * Initialize the Telegram Bot
 */
export const initTelegramBot = (token) => {
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        return;
    }

    bot = new Telegraf(token);

    // Middleware to attach TinyNotie user info to ctx
    bot.use(async (ctx, next) => {
        if (!ctx.from) return next();

        try {
            const { rows } = await pool.query(
                'SELECT id, usernm FROM user_infm WHERE telegram_id = $1',
                [ctx.from.id]
            );

            if (rows.length > 0) {
                ctx.user = rows[0];
            }
        } catch (err) {
            console.error('Error in Telegram middleware:', err);
        }
        return next();
    });

    // /start command - handles deep linking for account linking
    bot.start(async (ctx) => {
        const payload = ctx.startPayload; // From /start XXXX

        if (payload && payload.startsWith('link_')) {
            const code = payload.replace('link_', '');

            try {
                const { rows } = await pool.query(
                    'SELECT user_id FROM telegram_links WHERE code = $1 AND expires_at > NOW()',
                    [code]
                );

                if (rows.length > 0) {
                    const userId = rows[0].user_id;

                    await pool.query(
                        'UPDATE user_infm SET telegram_id = $1 WHERE id = $2',
                        [ctx.from.id, userId]
                    );

                    await pool.query('DELETE FROM telegram_links WHERE code = $1', [code]);

                    return ctx.reply('✅ Success! Your TinyNotie account is now linked to Telegram.');
                } else {
                    return ctx.reply('❌ Invalid or expired linking code. Please generate a new one from the app.');
                }
            } catch (err) {
                console.error('Link error:', err);
                return ctx.reply('❌ An error occurred during linking.');
            }
        }

        ctx.reply(
            `👋 Welcome to TinyNotie Assistant!\n\nI can help you manage your group expenses, members, and trips directly from Telegram.\n\n${ctx.user
                ? `Logged in as: *${ctx.user.usernm}*`
                : 'To get started, please link your account from the TinyNotie web app settings.'
            }\n\n*Available Commands:*\n/link_group [id] - Link this chat to a group\n/create_group [name] - Create a new group\n/add_member [name] - Add member to group\n/export - Get Excel report\n/status - Group summary`,
            { parse_mode: 'Markdown' }
        );
    });

    // /link_group command - links a Telegram chat (group) to a TinyNotie group
    bot.command('link_group', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first via private message to the bot.');
        if (ctx.chat.type === 'private') return ctx.reply('Please use this command inside a Telegram group.');

        const args = ctx.message.text.split(' ');
        if (args.length < 2) return ctx.reply('Usage: /link_group [groupId]');

        const groupId = parseInt(args[1]);

        try {
            // Verification: is user owner or member?
            const { rows: accessCheck } = await pool.query(
                'SELECT 1 FROM grp_infm g LEFT JOIN grp_users gu ON g.id = gu.group_id WHERE g.id = $1 AND (g.admin_id = $2 OR gu.user_id = $2)',
                [groupId, ctx.user.id]
            );

            if (accessCheck.length === 0) {
                return ctx.reply('❌ You do not have permission to link this group or the group does not exist.');
            }

            await pool.query(
                'UPDATE grp_infm SET telegram_chat_id = $1 WHERE id = $2',
                [ctx.chat.id, groupId]
            );

            ctx.reply(`✅ Success! This Telegram group is now linked to TinyNotie group: *${groupId}*`, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Link group error:', err);
            ctx.reply('❌ Failed to link group.');
        }
    });

    // /create_group command
    bot.command('create_group', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');
        const args = ctx.message.text.split(' ').slice(1);
        const grpName = args.join(' ') || `TG Group ${ctx.chat.id}`;

        try {
            const { rows } = await pool.query(
                'INSERT INTO grp_infm (grp_name, admin_id, telegram_chat_id, currency) VALUES ($1, $2, $3, $4) RETURNING id',
                [grpName, ctx.user.id, ctx.chat.id, 'W']
            );
            const groupId = rows[0].id;
            ctx.reply(`✅ Group *${grpName}* created successfully!\nID: \`${groupId}\``, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Create group TG error:', err);
            ctx.reply('❌ Failed to create group.');
        }
    });

    // /add_member command
    bot.command('add_member', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');
        const args = ctx.message.text.split(' ').slice(1);
        const memName = args.join(' ');

        if (!memName) return ctx.reply('Usage: /add_member [name]');

        try {
            // Find linked group for this chat
            const { rows: groups } = await pool.query('SELECT id FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group. Use /link_group first.');

            const groupId = groups[0].id;
            await pool.query('INSERT INTO mem_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)', [memName, groupId]);
            ctx.reply(`✅ Member *${memName}* added to the group!`, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Add member TG error:', err);
            ctx.reply('❌ Failed to add member.');
        }
    });

    // /export command - sends the Excel file
    bot.command('export', async (ctx) => {
        if (!ctx.user) return ctx.reply('Please link your account first.');

        try {
            const { rows: groups } = await pool.query('SELECT id, grp_name FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group.');

            const group = groups[0];
            ctx.reply('⏳ Generating report...');

            const buffer = await generateGroupExcelBuffer(group.id);
            const filename = `${group.grp_name.replace(/\s+/g, '_')}_Report.xlsx`;

            await ctx.replyWithDocument({ source: buffer, filename: filename }, { caption: `📊 Here is the financial report for *${group.grp_name}*`, parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Export TG error:', err);
            ctx.reply('❌ Failed to generate report.');
        }
    });

    // /status command - summary
    bot.command('status', async (ctx) => {
        try {
            const { rows: groups } = await pool.query('SELECT id, grp_name, currency FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
            if (groups.length === 0) return ctx.reply('❌ This chat is not linked to any group.');

            const group = groups[0];
            const { rows: members } = await pool.query('SELECT COUNT(*) as count FROM mem_infm WHERE group_id = $1', [group.id]);
            const { rows: trips } = await pool.query('SELECT COUNT(*) as count, SUM(spend) as total FROM trp_infm WHERE group_id = $1', [group.id]);

            const summary = `
📊 *Group Status: ${group.grp_name}*
👥 Members: ${members[0].count}
✈️ Total Trips: ${trips[0].count}
💰 Total Spend: ${parseFloat(trips[0].total || 0).toLocaleString()} ${group.currency}
      `;
            ctx.reply(summary, { parse_mode: 'Markdown' });
        } catch (err) {
            ctx.reply('❌ Error fetching status.');
        }
    });

    // Handle natural language messages (Agentic AI)
    bot.on('text', async (ctx) => {
        if (!ctx.user) return; // Ignore if not linked
        if (ctx.message.text.startsWith('/')) return; // Ignore commands

        // Find if this group is linked
        let groupId;
        try {
            const { rows } = await pool.query(
                'SELECT id FROM grp_infm WHERE telegram_chat_id = $1',
                [ctx.chat.id]
            );
            if (rows.length > 0) {
                groupId = rows[0].id;
            } else if (ctx.chat.type === 'private') {
                return ctx.reply('Please specify which group you are talking about, or use this bot inside a linked Telegram group.');
            } else {
                return; // Group not linked, ignore
            }
        } catch (err) {
            return;
        }

        ctx.sendChatAction('typing');

        try {
            const userContext = `Message from @${ctx.from.username || ctx.from.first_name} (App User: ${ctx.user.usernm}). `;
            const fullMessage = userContext + ctx.message.text;

            const aiResponse = await runAiAgent({
                message: fullMessage,
                groupId,
            });

            ctx.reply(aiResponse, { parse_mode: 'Markdown' });
        } catch (err) {
            console.error('Bot AI error:', err);
            ctx.reply('❌ Sorry, I encountered an error processing that.');
        }
    });

    // Handle Photos (Receipt Tracking)
    bot.on('photo', async (ctx) => {
        if (!ctx.user) return;

        // Find linked group
        const { rows: groups } = await pool.query('SELECT id, grp_name FROM grp_infm WHERE telegram_chat_id = $1', [ctx.chat.id]);
        if (groups.length === 0) return; // Not linked

        const group = groups[0];
        ctx.sendChatAction('typing');

        try {
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            const fileLink = await ctx.telegram.getFileLink(fileId);

            // Download image
            const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const base64 = buffer.toString('base64');

            ctx.reply('🔍 Scanning receipt...');

            const ocrResult = await processReceiptImage(base64);

            if (ocrResult.status && ocrResult.data && ocrResult.data.length > 0) {
                let summary = `📄 *Receipt Scan Results*\nGroup: *${group.grp_name}*\n\n`;
                let total = 0;

                ocrResult.data.forEach(item => {
                    summary += `• ${item.trp_name}: ${parseFloat(item.spend).toLocaleString()}\n`;
                    total += parseFloat(item.spend);
                });

                summary += `\n*Total: ${total.toLocaleString()}*\n\n_Note: You can tell me to "Add these expenses" to save them!_`;

                ctx.reply(summary, { parse_mode: 'Markdown' });
            } else {
                ctx.reply('❌ Could not extract items from this receipt.');
            }
        } catch (err) {
            console.error('Bot photo error:', err);
            ctx.reply('❌ Error processing photo.');
        }
    });

    return bot;
};

/**
 * Send a notification to a linked Telegram group
 */
export const notifyGroup = async (groupId, message) => {
    if (!bot) return;
    try {
        const { rows } = await pool.query('SELECT telegram_chat_id FROM grp_infm WHERE id = $1', [groupId]);
        if (rows.length > 0 && rows[0].telegram_chat_id) {
            await bot.telegram.sendMessage(rows[0].telegram_chat_id, message, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error('TG Notification error:', err);
    }
};

export const getBot = () => bot;
