start cmd /k "cd fund-analyser-app && quasar dev -m pwa"
start cmd /k "cd fund-analyser-data && npm run server.dev"
start cmd /k "cd fund-analyser-compute && pipenv run python -m server.server"
