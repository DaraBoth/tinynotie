import Link from 'next/link';

const COMMANDS = [
  { cmd: '/register', use: 'Create and link your TinyNotie account from Telegram.' },
  { cmd: '/reset_password', use: 'Set a new password for your linked TinyNotie account.' },
  { cmd: '/my_account', use: 'Show your TinyNotie account ID and Telegram link details.' },
  { cmd: '/my_groups', use: 'List your latest TinyNotie groups and Telegram link status.' },
  { cmd: '/chat_id', use: 'Show the current Telegram chat ID for linking.' },
  { cmd: '/link_group', use: 'Link this Telegram group chat to an existing TinyNotie group.' },
  { cmd: '/unlink_group', use: 'Unlink the current Telegram group chat from TinyNotie (owner only).' },
  { cmd: '/create_group', use: 'Create a TinyNotie group from this chat. In group chats, it uses the Telegram group title.' },
  { cmd: '/add_member', use: 'Add one member to the linked TinyNotie group.' },
  { cmd: '/join', use: 'Join a linked TinyNotie group in Telegram using your current display name.' },
  { cmd: '/sync_members', use: 'Sync visible Telegram members into the linked TinyNotie group.' },
  { cmd: '/status', use: 'Show a quick financial summary of the linked group.' },
  { cmd: '/export', use: 'Generate and send the group Excel report.' },
  { cmd: '/miniapp', use: 'Open TinyNotie as a Telegram mini app.' },
  { cmd: '/guideline', use: 'Open this guideline page again anytime.' },
  { cmd: '/commands', use: 'Show a quick command list directly in Telegram chat.' },
];

export default function TelegramCommandsPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">TinyNotie Help</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Telegram Command Guideline</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Use these commands with the TinyNotie Telegram bot to manage groups, members, and reports.
          </p>

          <div className="mt-6 grid gap-3">
            {COMMANDS.map((item) => (
              <div
                key={item.cmd}
                className="rounded-xl border border-border/40 bg-background/70 px-4 py-3 sm:px-5 sm:py-4"
              >
                <p className="font-mono text-sm sm:text-base font-semibold text-primary">{item.cmd}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.use}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border/40 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Tip: In a Telegram group chat, commands work best when sent directly to the TinyNotie bot or as a reply to a bot message.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Mini App Tip: Use <span className="font-mono">/miniapp</span> in Telegram to open TinyNotie quickly. Make sure your bot domain is configured in BotFather and points to your production web app URL.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Open Register Guide
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
