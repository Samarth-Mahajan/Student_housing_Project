# Team5-GDSD

This is a private repository of team-5 GDSD

## Team Member Details

| Name                       | Role                 | Email                                              | GitHub username          |
| -------------------------- | -------------------- | -------------------------------------------------- | ------------------------ |
| Romina Nikasa              | Team Lead            | romina.nikasa@informatik.hs-fulda.de               | @romiinik                |
| Rashid Hussain Mohammed    | GitHub Master        | rashid-hussain.mohammed@informatik.hs-fulda.de     | @Rashid-hussain-mohammed |
| Tim Schröder               | Backend Lead         | tim.schroeder@informatik.hs-fulda.de               | @ts4321                  |
| Anmoldeep Angadi           | Front End            | anmoldeep.angadi-manjunatha@informatik.hs-fulda.de | @fdai7674                |
| Samarth Mahajan            | Front Lead           | samarth-omkar.mahajan@informatik.hs-fulda.de       | @samarth-mahajan1929     |
| Suhaila Kondappilly Aliyar | Backend              | suhaila.kondappilly-aliyar@informatik.hs-fulda.de  | @Suhaila7995             |
| Maira Shafi                | Documentation Master | maira.shafi@informatik.hs-fulda.de                 | @maira-fulda             |

## Technologies

- Server host: Azure VM B2s, 2vCPUs 4 GiB RAM
- OS: Ubuntu 24.04
- Database: MySQL v8.0.39
- Web server: Nginx v1.24.0
- Server side language: Node.js
- Additional technologies:
  - Web framework: React
  - IDE: Visual Studio Code
  - SSL Cert: Let's Encrypt (certbot v2.9.0)

## Getting started

- copy and rename the `.env.example` file to `.env` and replace the values inside if applicable:
  - `BACKEND_PORT`: the port where the backend is reachable
  - `BLOB_STORAGE`: the Azure blob storage endpoint
- install all dependencies:

  ```sh
  npm install
  ```

- run both backend and frontend locally:

  ```sh
  npm run dev
  ```

- build both projects:

  ```sh
  npm run build
  ```

- to only run a command on a specific project, pass `--workspace=<project>` to the command.
  for example: `npm run dev --workspace=backend`

### Folder structure

This project uses [Turborepo](https://turbo.build/repo/docs) which is a tool for managing monorepos. By utilizing this tool, we can share config files and TypeScript models between the backend and frontend.

| Name        | Description                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| .github     | Contains GitHub automation data                                                     |
| .vscode     | Contains editor data                                                                |
| apps        | Contains the code of our applications, the backend and frontend                     |
| bruno       | API test data for use with [Bruno](https://www.usebruno.com), a Postman alternative |
| credentials | **Mandatory project folder.** Contains credentials for the VM                       |
| doc         | Various documentation for the project                                               |
| Milestones  | **Mandatory project folder.** Contains "milestone" documents                        |
| packages    | Contains the code of our libraries and shared configs                               |

### Database

We use migrations for keeping the database up to date.

```sh
# create a new migration
npm run mikro-orm migration:create

# migrate database to the latest version (runs automatically on backend startup)
npm run mikro-orm migration:up

# go back to last revision
npm run mikro-orm migration:down
```

See more commands here: [mikro-orm.io/docs/migrations](https://mikro-orm.io/docs/migrations#using-via-cli)

### E2E testing

Start the backend/frontend in case of running test on localhost

In a new terminal, run the tests:
npx playwright test

If you encounter any missing dependencies, install Playwright
npx playwright install
