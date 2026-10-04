# The Orchestration

Proof of how the Abbrescia Art Legacy Revival went from a vision to reality. Built and run by Nikki Wheeler.

## Where the data comes from
Nothing is typed in here. `public/feed.json` is written every hour by `abbrescia-os/pipeline/orchestration_feed.py` on the desktop:

- **Notion ✅ Open Items** (the one to-do list on the Master Command Center). Ticked-Done rows become ledger entries; rows marked Milestone go on the milestone map.
- **Abbrescia Pulse** (Notion Dashboard Feed). Views, followers, email subscribers and posts published drive the audience and revenue goals, each dated the first time it's reached.

The feed is encrypted (AES-GCM, key from PBKDF2-SHA256 of `ORCH_PASSPHRASE` in `abbrescia-os/pipeline/.env`), so the site can be public while the record stays private. The page asks for the passphrase once per device.

## Hosting
GitHub Pages, built by `.github/workflows/deploy.yml` on every push to `main` (including each hourly feed update).

## Local
`npm install && npm run build`. Admin (⚙, PIN 1936) entries are kept on that device only; the real record lives in Notion.
