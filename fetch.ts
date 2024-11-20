import Bun from "bun"
import { Octokit } from "octokit";

const token = process.env.GH_KEY;

const octokit = new Octokit({
    auth: token,
});

const repos_iter = octokit.paginate.iterator(octokit.rest.search.code, {
    q: "filename:pnpm-workspace.yaml",
    per_page: 100,
});

let page = 0;
for await (const response of repos_iter) {
    response.headers["x-ratelimit-remaining"]
    const path = `./repos/${page}.json`
    const written = await Bun.write(path, JSON.stringify(response.data, null, 2));
    console.log(path, written);
    page += 1;
}

const repos_yml_iter = octokit.paginate.iterator(octokit.rest.search.code, {
    q: "filename:pnpm-workspace.yml",
    per_page: 100,
});

for await (const response of repos_yml_iter) {
    response.headers["x-ratelimit-remaining"]
    const path = `./repos/${page}.json`
    const written = await Bun.write(path, JSON.stringify(response.data, null, 2));
    console.log(path, written);
    page += 1;
}
