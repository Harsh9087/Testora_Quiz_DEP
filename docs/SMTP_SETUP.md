# Titan SMTP Setup and Troubleshooting

This guide explains how to provision a sending mailbox, configure Titan SMTP, and use this Flask application to send a test message.

## 1. What SMTP does

SMTP (Simple Mail Transfer Protocol) is used to submit outgoing email from an application to a mail provider. In this project, Flask receives a recipient address from the web form, Python builds a plain-text email, and `smtplib` submits it to Titan for delivery.

Sending mail requires a valid sender mailbox and its SMTP credentials. Receiving mail is a separate mail-flow concern; this app only sends.

## 2. Create and prepare the mailbox

1. Register or use a domain that you control.
2. Purchase or enable email hosting for the domain through BigRock/Titan, then create the sender mailbox in the provider's email administration panel. The sender address configured in this project must be that real mailbox, or another address the provider explicitly permits for authenticated sending.
3. Confirm that you can sign in to the mailbox using the provider's webmail or mail client before configuring the app.
4. In the Titan/BigRock administration panel, locate the current SMTP settings and any required domain-authentication records. Provider settings can differ by account, so use the values shown for your mailbox if they differ from the defaults documented here.

### Domain DNS and sender authentication

Add or verify the DNS records specified by Titan for your domain:

- **SPF** identifies which mail services are authorized to send for the domain. Publish the exact TXT value supplied by the provider. A domain should have one SPF record; merge authorized senders into the existing record rather than publishing multiple SPF TXT records.
- **DKIM** lets receiving systems verify that messages were signed by an authorized mail service. Enable it in the mail administration panel and publish the selector/key records Titan provides.
- **DMARC** tells receiving systems how to handle messages that fail SPF/DKIM alignment and provides reporting options. Add a DMARC TXT record after reviewing the provider's guidance and your sending setup.
- **MX** records route incoming mail for the domain. Configure them if the mailbox must receive replies or other incoming mail. MX records are not what the application uses to submit outgoing mail.

DNS changes can take time to propagate. Do not guess record values; copy the values from the provider's domain setup page and verify them with a DNS lookup tool.

## 3. SMTP settings used by this project

The current implementation in `app.py` is configured for:

| Setting | Value | Meaning |
| --- | --- | --- |
| SMTP host | `smtp.titan.email` | Titan's outgoing mail server |
| Port | `465` | SMTP over implicit TLS/SSL |
| Security | SSL/TLS from connection start | Implemented with Python's `smtplib.SMTP_SSL` |
| Username | Full sender mailbox address | Used to authenticate to Titan |
| Password | Mailbox SMTP password | Keep private; never commit it to source control |

Port 465 with `SMTP_SSL` is not the same connection mode as port 587. Port 587 normally starts as an SMTP connection and upgrades with STARTTLS. If the provider directs you to use port 587, update the connection code to use `smtplib.SMTP`, call `starttls()` with a secure SSL context, and then log in. Do not combine port 587 with `SMTP_SSL` unless the provider explicitly documents that combination.

## 4. Configure credentials safely

The sender address and password are currently constants in `app.py`. A password embedded in source can be exposed through Git history, backups, logs, screenshots, or a shared workspace. **Rotate the SMTP password currently present in the source before using this app**, then remove it from the code and keep the replacement outside version control.

For local development, set environment variables in the terminal before starting Flask:

```powershell
$env:SMTP_HOST = "smtp.titan.email"
$env:SMTP_PORT = "465"
$env:SMTP_EMAIL = "your-mailbox@your-domain.example"
$env:SMTP_PASSWORD = "your-new-mailbox-password"
```

The current `app.py` does not read these environment variables yet; it must be changed to load `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, and `SMTP_PASSWORD` from the environment before these commands will configure the app. Never put a real password in this documentation or commit a `.env` file. If using a `.env` file for local work, add it to `.gitignore` and use a package such as `python-dotenv` to load it.

For a deployed application, store credentials in the hosting platform's secret manager or protected environment configuration. Use a dedicated sending mailbox with only the permissions required by the application, and rotate its password if it is exposed.

## 5. Install and run this test application

From the project directory, create and activate a virtual environment, install dependencies, and start the Flask development server:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`, enter an address you control, and select **Send Email**. The form submits a `POST` request to `/`; the app validates that an address was supplied, constructs a plain-text message, authenticates with Titan, and reports whether the SMTP submission succeeded.

The present application runs with Flask's debug mode enabled. That is for local development only. Do not expose the debug server to the public internet or use debug mode in production; deploy behind a production WSGI server and configure appropriate application security before public use.

## 6. How the email is assembled and sent

The route in `app.py` performs these steps:

1. Reads the `email` field from the submitted form.
2. Rejects an empty recipient address.
3. Creates a multipart MIME message with `From`, `To`, and `Subject` headers.
4. Attaches the message body as plain text.
5. Opens an SSL/TLS connection to Titan on port 465.
6. Authenticates with the sender mailbox and submits the message.
7. Closes the SMTP connection and displays a success or failure message.

SMTP acceptance means Titan accepted the message for processing. It does not guarantee delivery to the recipient's inbox; the message can still be delayed, rejected later, or placed in spam.

## 7. Troubleshooting

- **Authentication failed / invalid credentials:** Confirm the full mailbox address is the username, reset the mailbox password, and verify that SMTP access is enabled for the account. Do not assume a hosting control-panel password and mailbox password are interchangeable.
- **Connection timed out or refused:** Check the host and port in the provider panel, confirm outbound traffic to port 465 is allowed by the network or hosting provider, and try the provider's documented port/security combination.
- **TLS or SSL error:** Ensure the code uses `SMTP_SSL` with port 465. For port 587, use `SMTP` followed by `starttls()` instead.
- **Sender rejected / not permitted:** Make sure the `From` address matches the authenticated mailbox or is an approved sending alias.
- **Message accepted but not received:** Check the recipient's spam/junk folder, verify the address, inspect Titan's delivery logs if available, and verify SPF, DKIM, and DMARC alignment.
- **App reports a Python or Flask error:** Activate the intended virtual environment, install `requirements.txt`, and read the traceback in the terminal. Avoid displaying SMTP passwords or message contents in logs.
- **Changes made to DNS are not visible yet:** Allow for DNS propagation and query the authoritative DNS values; check for duplicate/conflicting SPF records.

## 8. Before production use

- Move SMTP credentials out of `app.py` and rotate any credential that has been committed or shared.
- Disable Flask debug mode and use a production WSGI server.
- Add request validation, rate limiting, and abuse protection so the form cannot be used to send unsolicited mail.
- Return generic errors to the browser and keep detailed diagnostics in protected logs, with secrets redacted.
- Add a connection cleanup strategy that also closes the SMTP session after failures (for example, a context manager or `try/finally`).
- Configure and verify SPF, DKIM, and DMARC for the sending domain, and monitor delivery and bounce reports.