# workspace-glob-exclusions-data

Exploring the usages of workspace glob exclusions in open source repositories.

Only pnpm workspaces were scraped as the dedicated `pnpm-workspace.yaml` file was very easy to search for with the github API (see [`./fetch.ts`](./fetch.ts) ).

1007 total `pnpm-workspace.{yaml,yml}` files were analyzed, of which ~990 were valid yaml (many were intended for use with templating engines)

## Results

```{json}
{
    "workspaces_count": 991,
    "percentage_of_workspaces_with_exclusions": "11.00%",
    "average_exclusion_count": "0.1675",
    "when_has_exclusions": {
        "average_exclusion_count": "1.523",
        "average_exclusion_with_globstar_count": "1.028",
        "average_exclusion_with_leading_globstar_count": "0.8440",
        "percentage_with_exclusion_that_possibly_excludes": {
            "a_previous_inclusion": "87.16%",
            "a_subsequent_inclusion": "2.752%"
        },
        "percentage_with_inclusion_that_possibly_includes": {
            "a_previous_exclusion": "0.9174%",
            "a_subsequent_exclusion": "21.10%"
        },
        "per_exclusion": {
            "average_negation_count": "1.000",
            "percentage_with_globstar": "67.47%",
            "percentage_with_leading_globstar": "55.42%",
            "percentage_possibly_excludes": {
                "previously_included": "83.13%",
                "subsequently_included": "3.012%"
            }
        },
        "per_inclusion": {
            "percentage_possibly_includes": {
                "previously_excluded": "0.6557%",
                "subsequently_excluded": "8.197%"
            }
        }
    }
}
```

This project was created using `bun init` in bun v1.1.30. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
