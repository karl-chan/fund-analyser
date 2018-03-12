module About exposing (about)

import Html exposing (..)
import Model exposing (..)


about : Model -> Html Msg
about model =
    div [] [ text "About" ]
