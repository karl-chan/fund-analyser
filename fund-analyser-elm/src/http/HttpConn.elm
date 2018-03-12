module HttpConn exposing (..)

import Fund exposing (..)
import Http
import Model exposing (..)
import String exposing (join)


---- HTTP METHODS ----


getFunds : Model -> List String -> Cmd Msg
getFunds model fields =
    let
        origin =
            model.server.origin

        fieldsStr =
            join "," fields

        url =
            origin ++ "/api/funds?fields=" ++ fieldsStr ++ "&limit=20"
    in
    Http.send UpdateFunds (Http.get url funds)
