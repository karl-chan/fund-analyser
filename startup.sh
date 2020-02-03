osascript -e 'tell app "Terminal"
    do script "cd '"$(pwd)"'/fund-analyser-app && quasar dev -m pwa"
end tell'
osascript -e 'tell app "Terminal"
    do script "cd '"$(pwd)"'/fund-analyser-data && npm run server.dev"
end tell'
osascript -e 'tell app "Terminal"
    do script "cd '"$(pwd)"'/fund-analyser-compute && pipenv run python -m server.server"
end tell'
