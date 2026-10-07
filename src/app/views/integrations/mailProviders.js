/**
 * Mail providers an agency can pick when connecting its enquiry inbox: the IMAP server to read from, and how
 * to get the password the CRM signs in with. `warning` is shown before connecting.
 */
export const MAIL_PROVIDERS = [
    {
        id: 'gmail',
        name: 'Gmail',
        hint: '@gmail.com',
        color: '#EA4335',
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        passwordLabel: 'App password',
        steps: [
            'Turn on 2-Step Verification for this Google account (Google Account → Security).',
            'Open the App passwords page, type a name such as “Travel CRM”, and press Create.',
            'Copy the 16-letter password Google shows and paste it here. Spaces don’t matter.'
        ],
        links: [
            {
                label: 'Turn on 2-Step Verification',
                href: 'https://myaccount.google.com/signinoptions/two-step-verification'
            },
            { label: 'Create an app password', href: 'https://myaccount.google.com/apppasswords' }
        ]
    },
    {
        id: 'workspace',
        name: 'Google Workspace',
        hint: 'you@yourcompany.com on Google',
        color: '#4285F4',
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        passwordLabel: 'App password',
        steps: [
            'Sign in to this mailbox and turn on 2-Step Verification (Google Account → Security).',
            'Open the App passwords page, name it “Travel CRM”, and press Create.',
            'Paste the 16-letter password here.'
        ],
        note: 'If the App passwords page says it isn’t available, your Google Workspace admin has to allow 2-Step Verification for users first.',
        links: [{ label: 'Create an app password', href: 'https://myaccount.google.com/apppasswords' }]
    },
    {
        id: 'zoho',
        name: 'Zoho Mail (India)',
        hint: 'mail.zoho.in',
        color: '#E42527',
        host: 'imap.zoho.in',
        port: 993,
        secure: true,
        passwordLabel: 'App-specific password',
        steps: [
            'In Zoho Mail open Settings → Mail Accounts → IMAP and tick IMAP Access.',
            'Open Zoho Accounts → Security → App Passwords, press Generate New Password and name it “Travel CRM”.',
            'Paste that password here.'
        ],
        links: [{ label: 'Zoho app passwords', href: 'https://accounts.zoho.in/home#security/app_password' }]
    },
    {
        id: 'zoho-com',
        name: 'Zoho Mail (global)',
        hint: 'mail.zoho.com',
        color: '#E42527',
        host: 'imap.zoho.com',
        port: 993,
        secure: true,
        passwordLabel: 'App-specific password',
        steps: [
            'In Zoho Mail open Settings → Mail Accounts → IMAP and tick IMAP Access.',
            'Open Zoho Accounts → Security → App Passwords and generate one named “Travel CRM”.',
            'Paste that password here.'
        ],
        links: [{ label: 'Zoho app passwords', href: 'https://accounts.zoho.com/home#security/app_password' }]
    },
    {
        id: 'hostinger',
        name: 'Hostinger',
        hint: 'Hostinger email',
        color: '#673DE6',
        host: 'imap.hostinger.com',
        port: 993,
        secure: true,
        passwordLabel: 'Mailbox password',
        steps: [
            'Use the same password you use to open this mailbox in Hostinger Webmail.',
            'Forgot it? hPanel → Emails → Email accounts → ⋮ → Change password.'
        ],
        links: [{ label: 'Hostinger hPanel', href: 'https://hpanel.hostinger.com/' }]
    },
    {
        id: 'godaddy',
        name: 'GoDaddy Webmail',
        hint: 'Professional Email by GoDaddy',
        color: '#1BDBDB',
        host: 'imap.secureserver.net',
        port: 993,
        secure: true,
        passwordLabel: 'Mailbox password',
        steps: ['Use the password you sign in to GoDaddy Webmail with.'],
        note: 'If your GoDaddy email is “Microsoft 365 from GoDaddy”, choose Outlook / Microsoft 365 instead.'
    },
    {
        id: 'yahoo',
        name: 'Yahoo Mail',
        hint: '@yahoo.com, @yahoo.in',
        color: '#6001D2',
        host: 'imap.mail.yahoo.com',
        port: 993,
        secure: true,
        passwordLabel: 'App password',
        steps: [
            'Open Yahoo Account Info → Account security.',
            'Press Generate app password, name it “Travel CRM”, and paste the password here.'
        ],
        links: [{ label: 'Yahoo account security', href: 'https://login.yahoo.com/account/security' }]
    },
    {
        id: 'outlook',
        name: 'Outlook / Microsoft 365',
        hint: 'Outlook.com, Hotmail, Office 365',
        color: '#0078D4',
        host: 'outlook.office365.com',
        port: 993,
        secure: true,
        passwordLabel: 'App password',
        steps: [
            'Microsoft has turned off password sign-in for most Outlook and Microsoft 365 mailboxes.',
            'The reliable way: in Outlook, add a rule that forwards enquiry emails to a Gmail or Zoho mailbox, and connect that one here.'
        ],
        warning: 'This usually fails with Microsoft mailboxes. Forwarding to a Gmail or Zoho mailbox works every time.'
    },
    {
        id: 'other',
        name: 'Other provider',
        hint: 'Any mailbox with IMAP',
        color: '#64748B',
        host: '',
        port: 993,
        secure: true,
        passwordLabel: 'Password',
        steps: [
            'Ask your email provider or website host for the IMAP server name (often imap.yourdomain.com or mail.yourdomain.com).',
            'Port 993 with SSL works almost everywhere.'
        ],
        manual: true
    }
]

export const providerOf = id =>
    MAIL_PROVIDERS.find(provider => provider.id === id) || MAIL_PROVIDERS[MAIL_PROVIDERS.length - 1]

// ? the provider an address most likely belongs to
export const guessProvider = email => {
    const domain = String(email || '')
        .split('@')[1]
        ?.toLowerCase()
    if (!domain) return null
    if (domain === 'gmail.com' || domain === 'googlemail.com') return 'gmail'
    if (/^(yahoo|ymail|rocketmail)\./.test(domain)) return 'yahoo'
    if (/^(outlook|hotmail|live|msn)\./.test(domain)) return 'outlook'
    if (domain === 'zoho.com' || domain === 'zohomail.com') return 'zoho-com'
    if (domain === 'zohomail.in' || domain === 'zoho.in') return 'zoho'
    return null
}

export const BACKFILL_OPTIONS = [
    { value: 0, label: 'Only new emails, from now on' },
    { value: 1, label: 'Also the last 24 hours' },
    { value: 3, label: 'Also the last 3 days' },
    { value: 7, label: 'Also the last 7 days' }
]
