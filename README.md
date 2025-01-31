# rep.observer

A website for displaying what elected representatives in the United States voted on in a single table.

## Data Sources
All data sources for this project are public domain.
See https://www.rep.observer/about for the complete list of sources.

## Development Setup
This project is a Nuxt app with a Supabase backend. Make sure you have Node v20+ when installing and running dependencies.

First, enable pnpm:
```bash
corepack enable pnpm
```

Next, install dependencies

```bash
pnpm install
```

## Development Server
Install [supabase's dependencies](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=npx#running-supabase-locally). You do not need to run `supabase init`, the project has already been initialized.

Next, start supabase by running the following in the project root folder:

```bash
npx supabase start
```

Using the values output from the supabase start script, set up your `.env` file. Variable names for the `.env` configuration can be found in the `.blank.env` file.

Then, start the Nuxt development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production
The website is deployed through Vercel. The owner of this repository (eshimizu) is the one who has access to the deploy keys and preview branches. Branches and PRs committed to this repository will have a preview build created automatically.

## Contributing Data Parsers
See the readme in `data/state` for information about contributing data parsers at the state level.