open data.json | each { |$repo| if $repo.data == null { $repo | update data { gh api $repo.url | from json } } else $repo | tee { print } } | save data.json