# Money Command Center

A mobile-first personal money tracker:

- **Transfers & bills**: record transfers from Main Checking to Bills Checking, split them into bills, check bills off as you pay them. A transfer completes and leaves the Active list on its own once every bill is paid and nothing is unassigned.
- **Uncle's money**: a separate ledger for money you hold for your uncle, split into bank and cash. A cash withdrawal doesn't change the total you hold. Money only leaves the total when it reaches someone or goes back to him.
- **History & reports**: a searchable record of everything, with monthly comparisons and CSV/JSON export.

Transfers between your own accounts never count as spending. Only bill payments do. All amounts are stored as whole cents.

## Where your data lives

The website saves everything in your browser on the device you use (`localStorage`). Nothing is sent to a server, and the app never connects to a bank.

- **On iPhone**, open the site in Safari, then tap **Share → Add to Home Screen**. The app then opens full screen, and Safari keeps its data. A site you only visit in a Safari tab can have its data cleared after a few weeks without visits.
- **Back up regularly**: open Settings (top right), then **Export backup**. The app reminds you when your last backup is more than 7 days old.
- **To move to a new phone or computer**: export a backup on the old one, then **Import backup** on the new one. Importing matches records by ID, so importing the same file twice never creates duplicates.

## Deploy to Netlify

The site is prebuilt in `site/`, and `netlify.toml` tells Netlify to publish that folder. Netlify doesn't need to run a build.

**Option A: connect this GitHub repo (redeploys on every push)**

1. Sign in at app.netlify.com, then choose **Add new site → Import an existing project → GitHub**.
2. Pick `budget-planner`, and the branch that holds these files.
3. Leave the build settings as `netlify.toml` fills them in (publish directory `site`, no build command), then click **Deploy**.

**Option B: drag and drop (no Git)**

Go to app.netlify.com/drop and drag the `site` folder onto the page.

## Making changes

```sh
npm install
npm test        # money logic checks (transfers, completion, uncle ledger, import)
npm run build   # rebuilds site/index.html and dist/artifact.html
```

Edit `src/app.jsx` (UI), `src/logic.js` (calculations), or `src/shell-artifact.html` (styles), run the build, then commit the updated `site/` folder.
