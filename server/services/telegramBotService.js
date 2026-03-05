import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { pool } from '../utils/dbUtils.js';
import bcrypt from 'bcrypt';
import { runAiAgent } from './aiAgentService.js';
import { generateGroupExcelBuffer } from '../utils/excelGenerator.js';
import { processReceiptImage } from './receiptService.js';
import moment from 'moment';
import axios from 'axios';

let bot;
const pendingRegistrations = new Map();

/**
 * Initialize the Telegram Bot with webhook mode
 */
export const initTelegramBot = (token) => {
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is missing');
        return;
    }

    // Initialize Telegraf without launching (no polling)
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
        const payloadFromStart = ctx.startPayload; // Preferred, when available
        const text = ctx.message?.text || '';
        const payloadFromText = text.startsWith('/start ') ? text.replace('/start ', '').trim() : '';
        const payload = payloadFromStart || payloadFromText;

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
            }\n\n*Available Commands:*\n/register [username] - Create account via Telegram\n/password [your_password] - Set password after /register\n/link_group [id] - Link this chat to a group\n/chat_id - Get current chat ID\n/create_group [name] - Create a new group\n/add_member [name] - Add member to group\n/export - Get Excel report\n/status - Group summary`,
            { parse_mode: 'Markdown' }
        );
    });

    // /register command - create account flow from Telegram
    bot.command('register', async (ctx) => {
        if (!ctx.from) return;

        try {
            const existingByTelegram = await pool.query(
                'SELECT id, usernm FROM user_infm WHERE telegram_id = $1',
                [ctx.from.id]
            );

            if (existingByTelegram.rows.length > 0) {
                return ctx.reply(`✅ This Telegram is already linked to account: *${existingByTelegram.rows[0].usernm}*`, { parse_mode: 'Markdown' });
            }

            const args = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
            const baseUsername = (args || ctx.from.username || `tg_${ctx.from.id}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40);
            let candidate = baseUsername || `tg_${ctx.from.id}`;

            const usernameCheck = await pool.query('SELECT 1 FROM user_infm WHERE usernm = $1', [candidate]);
            if (usernameCheck.rows.length > 0) {
                candidate = `${candidate}_${String(ctx.from.id).slice(-4)}`;
            }

            pendingRegistrations.set(ctx.from.id, {
                username: candidate,
                expiresAt: Date.now() + 10 * 60 * 1000,
            });

            return ctx.reply(
                `🧾 Registration initialized!\n\nUsername: *${candidate}*\n\nNow send:\n\`/password YourNewPassword\`\n\n(Expires in 10 minutes)`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('Telegram register error:', err);
            return ctx.reply('❌ Failed to initialize registration. Please try again.');
        }
    });

    // /password command - finalize Telegram registration
    bot.command('password', async (ctx) => {
        if (!ctx.from) return;

        try {
            const pending = pendingRegistrations.get(ctx.from.id);
            if (!pending) {
                return ctx.reply('❌ No active registration found. Please run /register first.');
            }

            if (Date.now() > pending.expiresAt) {
                pendingRegistrations.delete(ctx.from.id);
                return ctx.reply('⌛ Registration session expired. Please run /register again.');
            }

            const pwd = (ctx.message?.text || '').split(' ').slice(1).join(' ').trim();
            if (!pwd || pwd.length < 6) {
                return ctx.reply('❌ Password must be at least 6 characters. Example: /password MySecurePass123');
            }

            const usernameTaken = await pool.query('SELECT 1 FROM user_infm WHERE usernm = $1', [pending.username]);
            if (usernameTaken.rows.length > 0) {
                pendingRegistrations.delete(ctx.from.id);
                return ctx.reply('❌ Username is no longer available. Please run /register again.');
            }

            const hashed = await bcrypt.hash(pwd, 10);
            const insert = await pool.query(
                'INSERT INTO user_infm (usernm, passwd, telegram_id) VALUES ($1, $2, $3) RETURNING id, usernm',
                [pending.username, hashed, ctx.from.id]
            );

            pendingRegistrations.delete(ctx.from.id);

            return ctx.reply(
                `✅ Registration successful!\n\nAccount: *${insert.rows[0].usernm}*\n\nYou can now use TinyNotie app login with this username and your password.`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('Telegram password/register finalize error:', err);
            return ctx.reply('❌ Failed to complete registration. Please try /register again.');
        }
    });

    // /chat_id command - helps users discover the current Telegram chat ID
    bot.command('chat_id', async (ctx) => {
        const chatTitle = ctx.chat?.title || ctx.chat?.username || 'this chat';
        return ctx.reply(
            `🆔 Chat ID for *${chatTitle}*: \`${ctx.chat.id}\`\n\nUse this ID in TinyNotie to link Telegram group chat.`,
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
            await pool.query('INSERT INTO member_infm (mem_name, group_id, paid) VALUES ($1, $2, 0)', [memName, groupId]);
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
            const groupName = (group.grp_name || `Group_${group.id}`).trim();
            ctx.reply('⏳ Generating report...');

            const buffer = await generateGroupExcelBuffer(group.id);
            const filename = `${groupName.replace(/\s+/g, '_')}_Report.xlsx`;

            await ctx.replyWithDocument({ source: buffer, filename: filename }, { caption: `📊 Here is the financial report for *${groupName}*`, parse_mode: 'Markdown' });
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
            const { rows: members } = await pool.query('SELECT COUNT(*) as count FROM member_infm WHERE group_id = $1', [group.id]);
            const { rows: trips } = await pool.query('SELECT COUNT(*) as count, SUM(spend) as total FROM trp_infm WHERE group_id = $1', [group.id]);
            const groupName = group.grp_name || `Group ${group.id}`;
            const memberCount = Number(members?.[0]?.count || 0);
            const tripCount = Number(trips?.[0]?.count || 0);
            const totalSpend = Number(trips?.[0]?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const currency = group.currency || '';

            const summary = `
📊 *Group Status: ${groupName}*
👥 Members: ${memberCount}
✈️ Total Trips: ${tripCount}
💰 Total Spend: ${totalSpend} ${currency}
      `;
            ctx.reply(summary, { parse_mode: 'Markdown' });
        } catch (err) {
            ctx.reply('❌ Error fetching status.');
        }
    });

    // Handle natural language messages (Agentic AI)
    bot.on(message('text'), async (ctx) => {
        if (!ctx.user) {
            if (ctx.chat?.type === 'private') {
                return ctx.reply('Please link your TinyNotie account first from the web app, then send /start again.');
            }
            return;
        }
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
    bot.on(message('photo'), async (ctx) => {
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

    // When bot is added to a group, provide setup instructions with chat ID
    bot.on(message('new_chat_members'), async (ctx) => {
        try {
            const me = await bot.telegram.getMe();
            const addedBot = (ctx.message?.new_chat_members || []).some((m) => m.id === me.id);
            if (!addedBot) return;

            await ctx.reply(
                `👋 Thanks for adding TinyNotie bot!\n\n` +
                `🆔 This group chat ID is: \`${ctx.chat.id}\`\n\n` +
                `Next steps:\n` +
                `1) Link your TinyNotie account in private chat with this bot\n` +
                `2) In TinyNotie group settings, paste this chat ID to link this group`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            console.error('[Telegram] new_chat_members handler error:', err.message);
        }
    });

    return bot;
};

/**
 * Setup Telegram Webhook
 * Call this after your Express server is running
 */
export const setupWebhook = async (webhookUrl) => {
    if (!bot) {
        console.error('[Telegram] Bot not initialized. Cannot setup webhook.');
        return false;
    }

    try {
        // Remove any existing webhook first
        await bot.telegram.deleteWebhook();
        
        // Set the new webhook
        await bot.telegram.setWebhook(webhookUrl, {
            allowed_updates: ['message', 'callback_query', 'my_chat_member']
        });
        
        console.log(`[Telegram] Webhook set successfully to: ${webhookUrl}`);
        return true;
    } catch (err) {
        console.error('[Telegram] Error setting webhook:', err.message);
        return false;
    }
};

/**
 * Get webhook info (useful for debugging)
 */
export const getWebhookInfo = async () => {
    if (!bot) return null;
    try {
        return await bot.telegram.getWebhookInfo();
    } catch (err) {
        console.error('[Telegram] Error getting webhook info:', err);
        return null;
    }
};

/**
 * Send a Telegram message to any chat_id (group or personal)
 */
export const sendTelegramMessageToChat = async (chatId, message, options = { parse_mode: 'Markdown' }) => {
    if (!bot) return false;
    try {
        await bot.telegram.sendMessage(chatId, message, options);
        return true;
    } catch (err) {
        console.error(`[Telegram] sendMessage failed for chat ${chatId}:`, err.message);
        return false;
    }
};

/**
 * Send a notification to a linked Telegram group
 */
export const notifyGroup = async (groupId, message) => {
    if (!bot) return false;
    try {
        const { rows } = await pool.query('SELECT telegram_chat_id FROM grp_infm WHERE id = $1', [groupId]);
        if (rows.length > 0 && rows[0].telegram_chat_id) {
            await bot.telegram.sendMessage(rows[0].telegram_chat_id, message, { parse_mode: 'Markdown' });
            console.log(`[Telegram] Notification sent successfully to group ${groupId} (chat_id: ${rows[0].telegram_chat_id})`);
            return true;
        }
        console.warn(`[Telegram] No telegram_chat_id found for group ${groupId}`);
        return false;
    } catch (err) {
        console.error(`[Telegram] Notification error for group ${groupId}:`, err.message);
        return false;
    }
};

export const getBot = () => bot;
