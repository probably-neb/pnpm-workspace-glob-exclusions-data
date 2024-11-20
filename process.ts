import Bun from "bun";
import * as R from "remeda";

const all_workspaces = await Bun.file("./workspaces.json")
    .json()
    .then((ws) => ws.map((w) => w.workspaces));

let has_exclusions_count = 0;
let total_exclusions_count = 0;
let total_inclusions_in_workspaces_with_exclusions_count = 0;

let total_exclusions_with_globstar_count = 0;
let total_exclusions_with_leading_globstar_count = 0;

let total_exclusion_negations_count = 0;

// number of exclusions that exclude something that is possibly included
// by another entry that comes before it (previously)
let total_exclusions_excluding_prev_count = 0;

// number of exclusions that exclude something that is possibly included
// by another entry that comes after it (subsequently)
let total_exclusions_excluding_subs_count = 0;

// workspaces that have exclusions satisfying the requirements for total_exclusions_with_leading_globstar_count
let total_workspaces_with_excluding_previous_count = 0;
// workspaces that have exclusions satisfying the requirements for total_exclusions_with_leading_globstar_count
let total_workspaces_with_excluding_subsequent_count = 0;

// inverse of total_exclusions_excluding_prev_count - inclusions of something possibly excluded previously
let total_inclusions_including_prev_count = 0;
// inverse of total_exclusions_excluding_subs_count - inclusions of something possibly excluded subsequently
let total_inclusions_including_subs_count = 0;

let total_workspaces_with_including_previous_count = 0;
let total_workspaces_with_including_subsequent_count = 0;

let workspaces_count = all_workspaces.length;

for (const workspaces of all_workspaces) {
    if (!Array.isArray(workspaces)) {
        workspaces_count -= 1;
        continue;
    }
    if (!workspaces.every(R.isString)) {
        workspaces_count -= 1;
        continue;
    }
    const exclusions = R.filter(workspaces, R.startsWith("!"));

    if (exclusions.length == 0) {
        continue;
    }

    has_exclusions_count++;
    total_exclusions_count += exclusions.length;
    total_inclusions_in_workspaces_with_exclusions_count +=
        workspaces.length - exclusions.length;

    const exclusions_with_globstar = R.filter(exclusions, (w) =>
        w.includes("**"),
    );
    total_exclusions_with_globstar_count += exclusions_with_globstar.length;
    const exclusions_with_leading_globstar = R.filter(
        exclusions,
        R.startsWith("!**"),
    );
    total_exclusions_with_leading_globstar_count +=
        exclusions_with_leading_globstar.length;

    for (const exclusion of exclusions) {
        let negation_count;
        for (
            negation_count = 0;
            negation_count < exclusion.length &&
            exclusion[negation_count] === "!";
            negation_count++
        ) {}
        total_exclusion_negations_count += negation_count;
    }

    // calculate exclusions excluding prev and post included
    {
        let found_excluding_prev = false;
        let found_excluding_subs = false;

        for (let i = 0; i < workspaces.length; i++) {
            const ws = workspaces[i]!;
            if (!R.startsWith(ws, "!")) {
                continue;
            }

            // negates an inclusion before or negates an inclusion after
            const bare = ws.replace(/^!*/, "");

            const before = R.filter(
                workspaces.slice(0, i),
                R.isNot(R.startsWith("!")),
            );
            const after = R.filter(
                workspaces.slice(i + 1),
                R.isNot(R.startsWith("!")),
            );

            for (const before_ws of before) {
                if (possibly_matches(bare, before_ws)) {
                    total_exclusions_excluding_prev_count++;
                    found_excluding_prev = true;
                    break;
                }
            }

            for (const after_ws of after) {
                if (possibly_matches(bare, after_ws)) {
                    total_exclusions_excluding_subs_count++;
                    found_excluding_subs = true;
                    break;
                }
            }
        }
        if (found_excluding_prev) {
            total_workspaces_with_excluding_previous_count++;
        }
        if (found_excluding_subs) {
            total_workspaces_with_excluding_subsequent_count++;
        }
    }

    // calculate inclusions including prev and post excluded
    {
        let found_including_prev = false;
        let found_including_subs = false;

        for (let i = 0; i < workspaces.length; i++) {
            const ws = workspaces[i]!;
            if (R.startsWith(ws, "!")) {
                continue;
            }

            const bare = ws;

            const before = R.pipe(
                workspaces.slice(0, i),
                R.filter(R.startsWith("!")),
                R.map((w) => w.replace(/^!*/, "")),
            );
            const after = R.pipe(
                workspaces.slice(i + 1),
                R.filter(R.startsWith("!")),
                R.map((w) => w.replace(/^!*/, "")),
            );

            for (const before_excl of before) {
                if (possibly_matches(bare, before_excl)) {
                    total_inclusions_including_prev_count++;
                    found_including_prev = true;
                    break;
                }
            }

            for (const after_excl of after) {
                if (possibly_matches(bare, after_excl)) {
                    total_inclusions_including_subs_count++;
                    found_including_subs = true;
                    break;
                }
            }
        }
        if (found_including_prev) {
            total_workspaces_with_including_previous_count++;
        }
        if (found_including_subs) {
            total_workspaces_with_including_subsequent_count++;
        }
    }
}

import assert from "node:assert/strict";

function possibly_matches(exclusion: string, workspace: string) {
    assert(!exclusion.startsWith("!"));

    // fix prefix/* not matching prefix/subdir/
    // which is correct glob behavior but not desired behavior
    exclusion = exclusion.replace(/\/$/, "");
    workspace = workspace.replace(/\/$/, "");

    // if workspace is matched by the exclusion glob (NOTE - does not occur in dataset )
    const matches = new Bun.Glob(exclusion).match(workspace);

    // if exclusion is matched by the workspace glob
    const matches_inverted_glob = new Bun.Glob(workspace).match(exclusion);

    // if exclusion could be a subdirectory of directories described by workspace
    const matches_leading_globstar =
        exclusion.startsWith("**") &&
        (workspace.endsWith("/*") || workspace.endsWith("/**"));

    const result = matches || matches_inverted_glob || matches_leading_globstar;

    // console.log({
    //     exclusion,
    //     workspace,
    //     result,
    //     matches,
    //     matches_inverted_glob,
    //     matches_leading_globstar,
    // })

    return result;
}

function percentage(num: number, den: number) {
    return float((num / den) * 100) + "%";
}

function float(num: number) {
    return num.toPrecision(4);
}

const results = {
        workspaces_count,
        percentage_of_workspaces_with_exclusions: percentage(
            has_exclusions_count,
            workspaces_count,
        ),
        average_exclusion_count: float(
            total_exclusions_count / workspaces_count,
        ),
        when_has_exclusions: {
            average_exclusion_count: float(
                total_exclusions_count / has_exclusions_count,
            ),
            average_exclusion_with_globstar_count: float(
                total_exclusions_with_globstar_count / has_exclusions_count,
            ),
            average_exclusion_with_leading_globstar_count: float(
                total_exclusions_with_leading_globstar_count /
                    has_exclusions_count,
            ),
            percentage_with_exclusion_that_possibly_excludes: {
                a_previous_inclusion: percentage(
                    total_workspaces_with_excluding_previous_count,
                    has_exclusions_count,
                ),
                a_subsequent_inclusion: percentage(
                    total_workspaces_with_excluding_subsequent_count,
                    has_exclusions_count,
                ),
            },
            percentage_with_inclusion_that_possibly_includes: {
                a_previous_exclusion: percentage(
                    total_workspaces_with_including_previous_count,
                    has_exclusions_count,
                ),
                a_subsequent_exclusion: percentage(
                    total_workspaces_with_including_subsequent_count,
                    has_exclusions_count,
                ),
            },
            per_exclusion: {
                average_negation_count: float(
                    total_exclusion_negations_count / total_exclusions_count,
                ),
                percentage_with_globstar: percentage(
                    total_exclusions_with_globstar_count,
                    total_exclusions_count,
                ),
                percentage_with_leading_globstar: percentage(
                    total_exclusions_with_leading_globstar_count,
                    total_exclusions_count,
                ),
                percentage_possibly_excludes: {
                    previously_included: percentage(
                        total_exclusions_excluding_prev_count,
                        total_exclusions_count,
                    ),
                    subsequently_included: percentage(
                        total_exclusions_excluding_subs_count,
                        total_exclusions_count,
                    ),
                },
            },
            per_inclusion: {
                percentage_possibly_includes: {
                    previously_excluded: percentage(
                        total_inclusions_including_prev_count,
                        total_inclusions_in_workspaces_with_exclusions_count,
                    ),
                    subsequently_excluded: percentage(
                        total_inclusions_including_subs_count,
                        total_inclusions_in_workspaces_with_exclusions_count ,
                    ),
                },
            },
        },
    }

console.dir(
    results,
    { depth: null },
);

await Bun.write("./results.json", JSON.stringify(results, null, 4));
