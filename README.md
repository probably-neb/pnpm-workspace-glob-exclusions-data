# workspace-glob-exclusions-data

Exploring the usages of workspace glob exclusions in open source repositories.

Only pnpm workspaces were scraped as the dedicated `pnpm-workspace.yaml` file was very easy to search for with the github API (see [`./fetch.ts`](./fetch.ts) ).

1007 total `pnpm-workspace.{yaml,yml}` files were analyzed, of which ~990 were valid yaml (many were intended for use with templating engines)

## Results

![Results](./results-11-20-2024.json)

This project was created using `bun init` in bun v1.1.30. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
