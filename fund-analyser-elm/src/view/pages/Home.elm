module Home exposing (home)

import FundViews exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Model exposing (..)


home : Model -> Html Msg
home model =
    div
        []
        [ jumbotron model
        , fundPerformanceTable model
        ]


jumbotron : Model -> Html Msg
jumbotron model =
    section
        [ class "jumbotron text-center" ]
        [ div
            [ class "container" ]
            [ h1 [ class "display-4" ] [ text "Fund analyser" ]
            , p [ class "mt-4 lead text-muted" ] [ text "Your gateway to all funds" ]
            ]
        ]
