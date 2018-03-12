module Body exposing (body)

import About exposing (..)
import Home exposing (..)
import Html exposing (..)
import Model exposing (..)
import Pages exposing (..)


body : Model -> Html Msg
body model =
    case model.page of
        Home ->
            home model

        About ->
            about model
